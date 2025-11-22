/**
 * UDP通信助手前端逻辑
 * 负责处理UI交互、文件读取以及与Node.js WebSocket服务器的通信
 */

// DOM 元素引用
const els = {
    localHost: document.getElementById('localHost'),
    localPort: document.getElementById('localPort'),
    remoteIp: document.getElementById('remoteHost'), // HTML ID is remoteHost
    remotePort: document.getElementById('remotePort'),
    btnConnect: document.getElementById('connectBtn'), // HTML ID is connectBtn
    btnDisconnect: document.getElementById('disconnectBtn'), // HTML ID is disconnectBtn
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    logArea: document.getElementById('logArea'),
    btnClearLog: document.getElementById('clearReceiveBtn'), // HTML ID is clearReceiveBtn
    sendContent: document.getElementById('sendData'), // HTML ID is sendData
    fileInput: document.getElementById('fileInput'),
    btnSelectFile: document.getElementById('selectFileBtn'), // HTML ID is selectFileBtn
    fileName: document.getElementById('fileName'),
    btnSend: document.getElementById('sendBtn'), // HTML ID is sendBtn
    btnSendFile: document.getElementById('sendFileBtn'), // HTML ID is sendFileBtn
    btnClearSend: document.getElementById('clearSendBtn'), // HTML ID is clearSendBtn
    autoScroll: document.getElementById('autoScroll'),
    recvMode: document.getElementsByName('receiveFormat'), // HTML name is receiveFormat
    sendMode: document.getElementsByName('sendFormat'), // HTML name is sendFormat
    
    // Stats
    sentBytes: document.getElementById('sentBytes'),
    receivedBytes: document.getElementById('receivedBytes'),
    sentPackets: document.getElementById('sentPackets'),
    receivedPackets: document.getElementById('receivedPackets'),
    resetStatsBtn: document.getElementById('resetStatsBtn')
};

// 状态变量
let ws = null;
let isBound = false;
let selectedFileHex = null; // 存储已读取文件的Hex字符串
let stats = {
    sentBytes: 0,
    receivedBytes: 0,
    sentPackets: 0,
    receivedPackets: 0
};

// 初始化
function init() {
    connectWebSocket();
    bindEvents();
    log('系统', '正在初始化...');
}

// 1. 连接 WebSocket 服务器 (Node.js 后台)
function connectWebSocket() {
    // 尝试连接本地 WebSocket 服务器
    ws = new WebSocket('ws://localhost:9000');

    ws.onopen = () => {
        log('系统', '已连接到后台服务');
    };

    ws.onclose = () => {
        log('系统', '后台服务连接断开，请检查 server.js 是否运行');
        setBoundState(false);
        // 尝试重连
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
        // log('系统', '后台服务连接错误');
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        } catch (e) {
            console.error('解析消息失败', e);
        }
    };
}

// 2. 处理服务器发来的消息
function handleServerMessage(msg) {
    switch (msg.type) {
        case 'bound':
            log('系统', `UDP服务已就绪，监听端口: ${msg.port}`);
            setBoundState(true);
            break;
        case 'closed':
            log('系统', 'UDP连接已断开');
            setBoundState(false);
            break;
        case 'error':
            log('错误', msg.message);
            if (msg.message.includes('bind') || msg.message.includes('EADDRNOTAVAIL')) {
                setBoundState(false);
                alert('绑定端口失败：' + msg.message + '\n提示：如果本机没有配置该IP，请尝试留空或填 0.0.0.0');
            }
            break;
        case 'sent_success':
            if (msg.isFile) {
                log('发送', `文件已发送 (${msg.len} 字节) - UDP不保证送达`);
            } else {
                log('发送', `文本已发送 (${msg.len} 字节) - UDP不保证送达`);
            }
            updateStats(msg.len, 0);
            break;
        case 'udp_msg':
            // 收到 UDP 数据
            displayReceivedData(msg.data, msg.rinfo);
            updateStats(0, msg.data.length);
            break;
    }
}

// 3. 绑定 UI 事件
function bindEvents() {
    // 连接/断开 UDP
    if (els.btnConnect) {
        els.btnConnect.onclick = () => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert('未连接到后台服务，请先运行启动服务器.bat');
                return;
            }
            
            const port = parseInt(els.localPort.value);
            const expectedIp = els.localHost.value.trim();
            // 强制绑定所有接口，避免 EADDRNOTAVAIL
            const ip = '0.0.0.0'; 

            log('系统', `尝试绑定端口 ${port}...`);
            
            // 设置超时检测
            const bindTimeout = setTimeout(() => {
                if (!isBound) {
                    alert('连接超时！\n后台服务器没有响应。\n\n请尝试：\n1. 关闭当前的黑色命令行窗口\n2. 重新运行"启动服务器.bat"');
                    log('错误', '服务器响应超时');
                }
            }, 3000);

            // 监听一次性消息以清除超时
            const originalHandler = ws.onmessage;
            ws.onmessage = (event) => {
                clearTimeout(bindTimeout);
                if (originalHandler) originalHandler(event);
            };

            ws.send(JSON.stringify({
                type: 'bind',
                port: port,
                ip: ip,
                expectedIp: expectedIp
            }));
        };
    }

    if (els.btnDisconnect) {
        els.btnDisconnect.onclick = () => {
            if (ws) {
                ws.send(JSON.stringify({ type: 'close' }));
            }
        };
    }

    // 清空日志
    if (els.btnClearLog) {
        els.btnClearLog.onclick = () => {
            els.logArea.innerHTML = '';
        };
    }

    // 清空发送区
    if (els.btnClearSend) {
        els.btnClearSend.onclick = () => {
            els.sendContent.value = '';
            els.fileInput.value = '';
            els.fileName.textContent = '';
            selectedFileHex = null;
            els.btnSendFile.disabled = true;
        };
    }

    // 发送文本
    if (els.btnSend) {
        els.btnSend.onclick = () => {
            if (!isBound) {
                alert('请先连接 UDP');
                return;
            }
            const content = els.sendContent.value;
            if (!content) {
                alert('请输入发送内容');
                return;
            }

            const mode = getRadioValue(els.sendMode); // 'text' or 'hex'
            
            ws.send(JSON.stringify({
                type: 'send',
                remoteIp: els.remoteIp.value,
                remotePort: parseInt(els.remotePort.value),
                content: content,
                mode: mode
            }));
        };
    }

    // 选择文件
    if (els.btnSelectFile) {
        els.btnSelectFile.onclick = () => {
            els.fileInput.click();
        };
    }

    if (els.fileInput) {
        els.fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            els.fileName.textContent = `${file.name} (${(file.size/1024).toFixed(2)} KB)`;
            
            // 读取文件
            const reader = new FileReader();
            reader.onload = function(evt) {
                const arrayBuffer = evt.target.result;
                // 转为 Hex 字符串
                const uint8Array = new Uint8Array(arrayBuffer);
                let hexStr = '';
                for (let i = 0; i < uint8Array.length; i++) {
                    hexStr += uint8Array[i].toString(16).padStart(2, '0');
                }
                selectedFileHex = hexStr;
                els.btnSendFile.disabled = false;
                log('系统', `文件读取完成，准备就绪`);
            };
            reader.readAsArrayBuffer(file);
        };
    }

    // 发送文件
    if (els.btnSendFile) {
        els.btnSendFile.onclick = () => {
            if (!isBound) {
                alert('请先连接 UDP');
                return;
            }
            if (!selectedFileHex) {
                alert('请先选择文件');
                return;
            }

            log('系统', '正在发送文件...');
            ws.send(JSON.stringify({
                type: 'send_file',
                remoteIp: els.remoteIp.value,
                remotePort: parseInt(els.remotePort.value),
                content: selectedFileHex // 发送 Hex 字符串
            }));
        };
    }

    // 重置统计
    if (els.resetStatsBtn) {
        els.resetStatsBtn.onclick = () => {
            stats = { sentBytes: 0, receivedBytes: 0, sentPackets: 0, receivedPackets: 0 };
            updateStatsUI();
        };
    }
}

// 辅助函数：更新连接状态UI
function setBoundState(bound) {
    isBound = bound;
    if (bound) {
        els.statusDot.style.backgroundColor = '#28a745'; // Green
        els.statusText.textContent = '本地服务已就绪';
        els.btnConnect.disabled = true;
        els.btnDisconnect.disabled = false;
        els.localPort.disabled = true;
        els.btnSend.disabled = false;
        if (selectedFileHex) els.btnSendFile.disabled = false;
    } else {
        els.statusDot.style.backgroundColor = '#ccc'; // Grey
        els.statusText.textContent = '未连接';
        els.btnConnect.disabled = false;
        els.btnDisconnect.disabled = true;
        els.localPort.disabled = false;
        els.btnSend.disabled = true;
        els.btnSendFile.disabled = true;
    }
}

// 辅助函数：显示接收数据
function displayReceivedData(dataArray, rinfo) {
    const mode = getRadioValue(els.recvMode);
    let content = '';

    if (mode === 'hex') {
        content = dataArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    } else {
        // 尝试转文本，过滤不可见字符
        content = String.fromCharCode.apply(null, dataArray);
        // 简单的过滤，防止乱码破坏布局
        content = content.replace(/[^\x20-\x7E]/g, '.'); 
    }

    const time = new Date().toLocaleTimeString();
    const logLine = `[${time}] 来自 ${rinfo.address}:${rinfo.port} : ${content}`;
    
    const div = document.createElement('div');
    div.textContent = logLine;
    div.style.borderBottom = '1px solid #eee';
    div.style.padding = '2px 0';
    div.style.wordBreak = 'break-all';
    
    els.logArea.appendChild(div);

    if (els.autoScroll.checked) {
        els.logArea.scrollTop = els.logArea.scrollHeight;
    }
}

// 辅助函数：日志
function log(source, msg) {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.innerHTML = `<span style="color:#888">[${time}]</span> <strong>${source}:</strong> ${msg}`;
    div.style.borderBottom = '1px solid #f0f0f0';
    div.style.padding = '2px 0';
    els.logArea.appendChild(div);
    if (els.autoScroll.checked) {
        els.logArea.scrollTop = els.logArea.scrollHeight;
    }
}

// 辅助函数：更新统计
function updateStats(sent, received) {
    if (sent > 0) {
        stats.sentBytes += sent;
        stats.sentPackets++;
    }
    if (received > 0) {
        stats.receivedBytes += received;
        stats.receivedPackets++;
    }
    updateStatsUI();
}

function updateStatsUI() {
    if (els.sentBytes) els.sentBytes.textContent = stats.sentBytes;
    if (els.receivedBytes) els.receivedBytes.textContent = stats.receivedBytes;
    if (els.sentPackets) els.sentPackets.textContent = stats.sentPackets;
    if (els.receivedPackets) els.receivedPackets.textContent = stats.receivedPackets;
}

// 辅助函数：获取 Radio 值
function getRadioValue(radioNodeList) {
    for (let i = 0; i < radioNodeList.length; i++) {
        if (radioNodeList[i].checked) return radioNodeList[i].value;
    }
    return null;
}

// 启动
init();