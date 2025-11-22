const WebSocket = require('ws');
const dgram = require('dgram');
const os = require('os');

const wss = new WebSocket.Server({ port: 9000 });
let udpSocket = null;

// 获取本机IP地址工具函数
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

console.log('\n====================================');
console.log('  UDP WebSocket Proxy Server');
console.log('====================================');
console.log('Server Status: Running');
console.log('Port: 9000');
console.log('Local IPs:', getLocalIPs());
console.log('====================================\n');

wss.on('connection', function connection(ws) {
    console.log('CONNECT: Web client connected');

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            
            // 1. 绑定 UDP 端口
            if (data.type === 'bind') {
                // 新增：检查物理网络连接状态
                const localIPs = getLocalIPs();
                if (localIPs.length === 0) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: '未检测到有效的网络连接！\n请检查网线是否已连接，或网络适配器是否启用。' 
                    }));
                    return;
                }

                // 新增：检查用户指定的IP是否存在于本机
                // 如果用户指定了具体的IP（非0.0.0.0/localhost），但本机没有这个IP，说明网线没插或配置不对
                if (data.expectedIp && data.expectedIp !== '0.0.0.0' && data.expectedIp !== 'localhost' && data.expectedIp !== '127.0.0.1') {
                    if (!localIPs.includes(data.expectedIp)) {
                         ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: `未检测到本地IP: ${data.expectedIp}\n\n请确认：\n1. 网线是否已连接？\n2. 电脑是否已配置该静态IP？\n\n当前本机可用IP: ${localIPs.join(', ')}` 
                        }));
                        return;
                    }
                }

                if (udpSocket) {
                    try { udpSocket.close(); } catch(e) {}
                }

                udpSocket = dgram.createSocket('udp4');
                
                udpSocket.on('error', (err) => {
                    console.log(`ERROR: UDP error:\n${err.stack}`);
                    ws.send(JSON.stringify({ type: 'error', message: `UDP error: ${err.message}` }));
                    try { udpSocket.close(); } catch(e) {}
                    udpSocket = null;
                });

                udpSocket.on('message', (msg, rinfo) => {
                    // 收到UDP数据，转发给前端
                    // console.log(`UDP RX: ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
                    ws.send(JSON.stringify({
                        type: 'udp_msg',
                        data: Array.from(msg), // 转为数组发送
                        rinfo: rinfo
                    }));
                });

                udpSocket.on('listening', () => {
                    const address = udpSocket.address();
                    console.log(`OK: UDP listening on ${address.address}:${address.port}`);
                    ws.send(JSON.stringify({ type: 'bound', address: address.address, port: address.port }));
                });

                // 如果 data.ip 为空或者 '0.0.0.0'，则绑定所有接口
                try {
                    if (data.ip && data.ip !== '0.0.0.0') {
                        udpSocket.bind(parseInt(data.port), data.ip);
                    } else {
                        udpSocket.bind(parseInt(data.port));
                    }
                } catch (e) {
                    ws.send(JSON.stringify({ type: 'error', message: `Bind failed: ${e.message}` }));
                }
            }
            
            // 2. 发送 UDP 数据 (文本/Hex字符串)
            else if (data.type === 'send') {
                if (!udpSocket) {
                    ws.send(JSON.stringify({ type: 'error', message: 'UDP socket not bound' }));
                    return;
                }
                
                let buffer;
                if (data.mode === 'hex') {
                    // 将 "AA BB CC" 格式转为 Buffer
                    const cleanHex = data.content.replace(/\s+/g, '');
                    buffer = Buffer.from(cleanHex, 'hex');
                } else {
                    buffer = Buffer.from(data.content);
                }

                udpSocket.send(buffer, data.remotePort, data.remoteIp, (err) => {
                    if (err) {
                        ws.send(JSON.stringify({ type: 'error', message: `Send error: ${err.message}` }));
                    } else {
                        console.log(`UDP TX: ${buffer.length} bytes to ${data.remoteIp}:${data.remotePort}`);
                        ws.send(JSON.stringify({ type: 'sent_success', len: buffer.length }));
                    }
                });
            }

            // 3. 发送文件数据 (接收到的是 Hex 字符串流)
            else if (data.type === 'send_file') {
                if (!udpSocket) {
                    ws.send(JSON.stringify({ type: 'error', message: 'UDP socket not bound' }));
                    return;
                }

                // 前端把文件内容转成了 Hex 字符串传过来
                const buffer = Buffer.from(data.content, 'hex');
                console.log(`FILE TX: Sending file (${buffer.length} bytes) to ${data.remoteIp}:${data.remotePort}`);

                // 分片发送逻辑
                const chunkSize = 8192; // 标准 UDP 分片大小
                const chunks = [];
                for (let offset = 0; offset < buffer.length; offset += chunkSize) {
                    chunks.push(buffer.slice(offset, offset + chunkSize));
                }

                let sentCount = 0;
                const sendNextChunk = (index) => {
                    if (index >= chunks.length) {
                        console.log(`FILE TX: Completed. Sent ${buffer.length} bytes.`);
                        ws.send(JSON.stringify({ type: 'sent_success', len: buffer.length, isFile: true }));
                        return;
                    }

                    udpSocket.send(chunks[index], data.remotePort, data.remoteIp, (err) => {
                        if (err) {
                            console.error(`ERROR: Chunk ${index} failed:`, err);
                        } else {
                            sentCount++;
                        }
                        // 使用 setImmediate 避免阻塞事件循环，但保持高速发送
                        setImmediate(() => sendNextChunk(index + 1));
                    });
                };

                sendNextChunk(0);
            }
            
            // 4. 断开连接
            else if (data.type === 'close') {
                if (udpSocket) {
                    udpSocket.close();
                    udpSocket = null;
                    console.log('CLOSE: UDP socket closed by client request');
                    ws.send(JSON.stringify({ type: 'closed' }));
                }
            }

        } catch (e) {
            console.error('ERROR: Message processing error:', e);
        }
    });

    ws.on('close', () => {
        console.log('DISCONNECT: Web client disconnected');
        if (udpSocket) {
            udpSocket.close();
            udpSocket = null;
        }
    });
});
