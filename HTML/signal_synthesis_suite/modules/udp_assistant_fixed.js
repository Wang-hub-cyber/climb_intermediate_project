/**
 * UDP网口通信助手 JavaScript 实现
 * 由于浏览器安全限制，使用WebSocket模拟UDP通信
 */

class UDPAssistant {
    constructor() {
        this.socket = null;        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.currentFile = null;
        this.currentFileType = null;
        this.testMode = false; // 添加测试模式标志
        this.stats = {
            sentBytes: 0,
            receivedBytes: 0,
            sentPackets: 0,
            receivedPackets: 0
        };
          
        this.initializeElements();
        this.bindEvents();
        this.updateUI();        this.loadConfigList();
        
        // 添加连接提示
        this.addLog('系统', '应用已启动，现支持发送txt和bin文件');
        this.addLog('提示', '如果没有WebSocket服务器，点击"启用测试模式"按钮进行测试');
        
        // 添加测试模式按钮
        this.addTestModeButton();
    }

    initializeElements() {
        // 连接相关元素
        this.localHostInput = document.getElementById('localHost');
        this.localPortInput = document.getElementById('localPort');
        this.remoteHostInput = document.getElementById('remoteHost');
        this.remotePortInput = document.getElementById('remotePort');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.statusText = document.getElementById('statusText');

        // 配置管理相关元素
        this.configSelect = document.getElementById('configSelect');
        this.loadConfigBtn = document.getElementById('loadConfigBtn');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        this.deleteConfigBtn = document.getElementById('deleteConfigBtn');
        this.configNameInput = document.getElementById('configName');
        this.confirmSaveBtn = document.getElementById('confirmSaveBtn');
        this.cancelSaveBtn = document.getElementById('cancelSaveBtn');
        this.saveConfigGroup = document.getElementById('saveConfigGroup');

        // 发送相关元素
        this.sendDataTextarea = document.getElementById('sendData');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearSendBtn = document.getElementById('clearSendBtn');
        this.sendFormatRadios = document.querySelectorAll('input[name="sendFormat"]');

        // 接收相关元素
        this.receiveDataTextarea = document.getElementById('receiveData');
        this.clearReceiveBtn = document.getElementById('clearReceiveBtn');
        this.saveLogBtn = document.getElementById('saveLogBtn');
        this.receiveFormatRadios = document.querySelectorAll('input[name="receiveFormat"]');
        this.autoScrollCheckbox = document.getElementById('autoScroll');

        // 统计相关元素
        this.sentBytesSpan = document.getElementById('sentBytes');
        this.receivedBytesSpan = document.getElementById('receivedBytes');
        this.sentPacketsSpan = document.getElementById('sentPackets');
        this.receivedPacketsSpan = document.getElementById('receivedPackets');
        this.resetStatsBtn = document.getElementById('resetStatsBtn');

        // 文件相关元素
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.sendFileBtn = document.getElementById('sendFileBtn');
        this.clearFileBtn = document.getElementById('clearFileBtn');
        this.fileNameLabel = document.getElementById('fileName');
    }

    bindEvents() {
        // 连接按钮事件
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());

        // 配置管理事件
        this.loadConfigBtn.addEventListener('click', () => this.loadConfig());
        this.saveConfigBtn.addEventListener('click', () => this.showSaveConfigDialog());
        this.deleteConfigBtn.addEventListener('click', () => this.deleteConfig());
        this.confirmSaveBtn.addEventListener('click', () => this.saveConfig());
        this.cancelSaveBtn.addEventListener('click', () => this.hideSaveConfigDialog());
        this.configSelect.addEventListener('change', () => this.onConfigSelectChange());

        // 发送按钮事件
        this.sendBtn.addEventListener('click', () => this.sendData());
        this.clearSendBtn.addEventListener('click', () => this.clearSendData());

        // 接收区域按钮事件
        this.clearReceiveBtn.addEventListener('click', () => this.clearReceiveData());
        this.saveLogBtn.addEventListener('click', () => this.saveLog());

        // 统计按钮事件
        this.resetStatsBtn.addEventListener('click', () => this.resetStats());

        // 文件选择和发送事件
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (event) => this.handleFileSelect(event));
        this.clearFileBtn.addEventListener('click', () => this.clearSelectedFile());
        this.sendFileBtn.addEventListener('click', () => this.sendFileContent());

        // 键盘事件
        this.sendDataTextarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.sendData();
            }
        });

        // 格式切换事件
        this.sendFormatRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateSendFormat());
        });

        this.receiveFormatRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateReceiveFormat());
        });
    }    connect() {
        if (this.isConnected) return;

        const localHost = this.localHostInput.value.trim();
        const localPort = this.localPortInput.value.trim();
        const remoteHost = this.remoteHostInput.value.trim();
        const remotePort = this.remotePortInput.value.trim();

        if (!this.validateInputs(localHost, localPort, remoteHost, remotePort)) {
            return;
        }

        this.setStatus('connecting', '正在连接...');
        this.connectBtn.disabled = true;
        this.addLog('系统', `尝试连接到 WebSocket 服务器...`);

        try {
            const wsUrl = `ws://localhost:9000`;
            this.addLog('系统', `连接地址: ${wsUrl}`);
            
            this.socket = new WebSocket(wsUrl);

            const connectionTimeout = setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
                    this.socket.close();
                    this.handleConnectionError('连接超时');
                }
            }, 5000);

            this.socket.onopen = () => {
                clearTimeout(connectionTimeout);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.setStatus('connected', `本地服务已就绪 - 目标: ${remoteHost}:${remotePort}`);
                this.updateUI();
                
                const config = {
                    type: 'config',
                    localHost: localHost,
                    localPort: parseInt(localPort),
                    remoteHost: remoteHost,
                    remotePort: parseInt(remotePort)
                };
                
                this.socket.send(JSON.stringify(config));
                this.addLog('系统', `连接建立成功 - ${new Date().toLocaleTimeString()}`);
                this.addLog('调试', `WebSocket状态: ${this.socket.readyState} (OPEN=1)`);
            };

            this.socket.onmessage = (event) => {
                this.addLog('调试', `收到WebSocket消息: ${event.data.substring(0, 100)}...`);
                this.handleReceiveData(event.data);
            };

            this.socket.onclose = (event) => {
                clearTimeout(connectionTimeout);
                this.isConnected = false;
                this.setStatus('disconnected', '连接已断开');
                this.updateUI();
                
                const reason = event.reason || '未知原因';
                const code = event.code;
                this.addLog('系统', `连接断开 - 代码:${code}, 原因:${reason} - ${new Date().toLocaleTimeString()}`);
                
                if (code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                }
            };

            this.socket.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('WebSocket错误:', error);
                this.addLog('错误', `WebSocket错误: ${error.type || 'unknown'}`);
                this.handleConnectionError('WebSocket连接错误');
            };

        } catch (error) {
            console.error('连接错误:', error);
            this.handleConnectionError(`连接异常: ${error.message}`);
        }
    }    handleConnectionError(errorMsg) {
        this.setStatus('disconnected', '连接失败');
        this.updateUI();
        this.addLog('错误', `${errorMsg} - ${new Date().toLocaleTimeString()}`);
        
        if (errorMsg.includes('连接超时') || errorMsg.includes('WebSocket连接错误')) {
            this.addLog('建议', '请检查WebSocket服务器是否在 localhost:9000 运行');
            this.addLog('提示', '如果没有服务器，可以尝试以下方案:');
            this.addLog('提示', '1. 启用测试模式（将添加模拟发送功能）');
            this.addLog('提示', '2. 检查防火墙设置');
            this.addLog('提示', '3. 确认端口9000未被占用');
        }
    }

    attemptReconnect() {
        this.reconnectAttempts++;
        this.addLog('系统', `尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, 2000 * this.reconnectAttempts);
    }

    disconnect() {
        if (!this.isConnected || !this.socket) return;

        // 防止触发自动重连
        this.socket.onclose = null;
        this.socket.onerror = null;

        this.socket.close();
        this.socket = null;
        this.isConnected = false;
        this.setStatus('disconnected', '未连接');
        this.updateUI();
        
        this.addLog('系统', '已断开连接');
    }

    // 文件处理功能 - 新增bin文件支持
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['txt', 'bin'].includes(fileExtension)) {
            alert('只支持 .txt 和 .bin 文件');
            event.target.value = '';
            return;
        }

        this.currentFile = file;
        this.currentFileType = fileExtension;
        
        this.fileNameLabel.textContent = file.name;
        this.clearFileBtn.style.display = 'inline-block';
        this.sendFileBtn.disabled = !this.isConnected;

        // 显示文件信息
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            const fileTypeInfo = document.getElementById('fileTypeInfo');
            const fileSizeInfo = document.getElementById('fileSizeInfo');
            
            if (fileTypeInfo) {
                fileTypeInfo.textContent = `类型: ${fileExtension.toUpperCase()} 文件`;
                fileTypeInfo.className = `file-type-${fileExtension}`;
            }
            if (fileSizeInfo) {
                fileSizeInfo.textContent = ` | 大小: ${this.formatFileSize(file.size)}`;
            }
            fileInfo.style.display = 'block';
        }

        this.addLog('系统', `已选择文件: ${file.name} (${this.formatFileSize(file.size)})`);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    clearSelectedFile() {
        this.currentFile = null;
        this.currentFileType = null;
        this.fileInput.value = '';
        this.fileNameLabel.textContent = '';
        this.clearFileBtn.style.display = 'none';
        this.sendFileBtn.disabled = true;
        
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        this.addLog('系统', '已清除选择的文件');
    }    async sendFileContent() {
        console.log('开始发送文件...', {
            isConnected: this.isConnected,
            currentFile: this.currentFile ? this.currentFile.name : '无',
            socketState: this.socket ? this.socket.readyState : '无socket'
        });

        if (!this.isConnected) {
            alert('请先建立连接');
            this.addLog('错误', '尝试发送文件但未连接');
            return;
        }

        if (!this.currentFile) {
            alert('请先选择文件');
            this.addLog('错误', '尝试发送文件但未选择文件');
            return;
        }

        try {
            this.sendFileBtn.disabled = true;
            this.sendFileBtn.textContent = '发送中...';
            this.addLog('系统', `开始发送文件: ${this.currentFile.name}`);
            
            let fileData;
            let sendFormat;
            
            if (this.currentFileType === 'txt') {
                fileData = await this.readFileAsText(this.currentFile);
                this.addLog('调试', `TXT文件读取完成，大小: ${fileData.length} 字符`);
                
                sendFormat = this.getSendFormat();
                if (sendFormat === 'hex') {
                    fileData = this.stringToHex(fileData);
                    this.addLog('调试', `转换为十六进制格式`);
                }
            } else if (this.currentFileType === 'bin') {
                const binaryData = await this.readFileAsBinary(this.currentFile);
                this.addLog('调试', `BIN文件读取完成，大小: ${binaryData.length} 字节`);
                
                // 二进制文件始终以十六进制格式发送，确保数据完整性
                fileData = this.binaryToHex(binaryData);
                sendFormat = 'hex'; // 强制使用hex格式
                this.addLog('调试', `转换为十六进制格式，数据长度: ${fileData.length} 字符`);
            }

            // 检查数据是否准备好
            if (!fileData) {
                throw new Error('文件数据为空');
            }

            const messageData = {
                type: 'file',
                filename: this.currentFile.name,
                fileType: this.currentFileType,
                data: fileData,
                format: sendFormat,
                size: this.currentFile.size
            };            // 发送数据
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                const jsonString = JSON.stringify(messageData);
                this.addLog('调试', `准备发送JSON数据，大小: ${jsonString.length} 字符`);
                
                this.socket.send(jsonString);
                this.addLog('发送', `WebSocket发送成功: ${this.currentFile.name}`);
                
            } else if (this.testMode) {
                // 测试模式 - 模拟发送
                const jsonString = JSON.stringify(messageData);
                this.addLog('测试', `模拟发送文件数据，大小: ${jsonString.length} 字符`);
                this.addLog('测试', `文件名: ${messageData.filename}, 类型: ${messageData.fileType}`);
                this.addLog('测试', `数据预览: ${messageData.data.substring(0, 100)}...`);
                
                // 输出到控制台供调试
                console.log('测试模式 - 模拟发送的文件数据:', messageData);
                
            } else if (this.socket) {
                this.addLog('错误', `WebSocket状态异常: ${this.socket.readyState}`);
                throw new Error(`WebSocket连接状态异常: ${this.socket.readyState}`);
            } else {
                this.addLog('错误', 'WebSocket对象不存在，请先连接或启用测试模式');
                throw new Error('WebSocket连接不存在');
            }

            // 更新统计
            this.stats.sentPackets++;
            this.stats.sentBytes += this.currentFile.size;
            this.updateStats();

            this.addLog('成功', `文件 ${this.currentFile.name} 发送完成 (${this.formatFileSize(this.currentFile.size)})`);

        } catch (error) {
            console.error('发送文件错误:', error);
            this.addLog('错误', `发送文件失败: ${error.message}`);
            alert('发送文件失败: ' + error.message);
        } finally {
            if (this.sendFileBtn) {
                this.sendFileBtn.disabled = !this.isConnected || !this.currentFile;
                this.sendFileBtn.textContent = '发送文件';
            }
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    readFileAsBinary(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    binaryToDisplayText(uint8Array) {
        let result = '';
        for (let i = 0; i < uint8Array.length; i++) {
            const byte = uint8Array[i];
            if (byte >= 32 && byte <= 126) {
                result += String.fromCharCode(byte);
            } else {
                result += '.';
            }
        }
        return result;
    }

    binaryToHex(uint8Array) {
        return Array.from(uint8Array)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join(' ')
            .toUpperCase();
    }

    // 原有的其他方法保持不变
    sendData() {
        if (!this.isConnected) {
            alert('请先建立连接');
            return;
        }

        const data = this.sendDataTextarea.value.trim();
        if (!data) {
            alert('请输入要发送的数据');
            return;
        }

        try {
            const sendFormat = this.getSendFormat();
            let processedData;

            if (sendFormat === 'hex') {
                processedData = this.hexStringToBytes(data);
                if (processedData === null) {
                    alert('十六进制格式错误');
                    return;
                }
            } else {
                processedData = data;
            }

            if (this.socket) {
                this.socket.send(JSON.stringify({
                    type: 'data',
                    data: processedData,
                    format: sendFormat
                }));
                this.addLog('发送', this.formatDataForDisplay(data, sendFormat));
            }

            this.stats.sentPackets++;
            this.stats.sentBytes += new Blob([data]).size;
            this.updateStats();

        } catch (error) {
            console.error('发送数据错误:', error);
            alert('发送数据失败: ' + error.message);
        }
    }

    handleReceiveData(rawData) {
        try {
            const message = JSON.parse(rawData);
            
            if (message.type === 'data') {
                const receiveFormat = this.getReceiveFormat();
                const displayData = this.formatDataForDisplay(message.data, receiveFormat);
                
                this.stats.receivedPackets++;
                this.stats.receivedBytes += new Blob([message.data]).size;
                this.updateStats();

                this.addLog('接收', displayData);
            }
        } catch (error) {
            const receiveFormat = this.getReceiveFormat();
            const displayData = this.formatDataForDisplay(rawData, receiveFormat);
            
            this.stats.receivedPackets++;
            this.stats.receivedBytes += new Blob([rawData]).size;
            this.updateStats();

            this.addLog('接收', displayData);
        }
    }

    addLog(type, data) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${type}: ${data}\n`;
        
        this.receiveDataTextarea.value += logEntry;
        
        if (this.autoScrollCheckbox.checked) {
            this.receiveDataTextarea.scrollTop = this.receiveDataTextarea.scrollHeight;
        }
    }

    formatDataForDisplay(data, format) {
        if (format === 'hex') {
            if (typeof data === 'string') {
                return this.stringToHex(data);
            }
            return data;
        }
        return data;
    }

    stringToHex(str) {
        return str.split('').map(char => 
            char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join(' ').toUpperCase();
    }

    hexStringToBytes(hexString) {
        const hex = hexString.replace(/\s+/g, '');
        if (hex.length % 2 !== 0 || !/^[0-9A-Fa-f]+$/.test(hex)) {
            return null;
        }
        
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
            result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return result;
    }

    validateInputs(localHost, localPort, remoteHost, remotePort) {
        if (!localHost) {
            alert('请输入本地IP地址');
            return false;
        }

        if (!this.isValidIP(localHost)) {
            alert('本地IP地址格式不正确');
            return false;
        }

        if (!localPort || localPort < 1 || localPort > 65535) {
            alert('本地端口必须在1-65535之间');
            return false;
        }

        if (!remoteHost) {
            alert('请输入远程主机地址');
            return false;
        }

        if (!this.isValidIP(remoteHost)) {
            alert('远程主机IP地址格式不正确');
            return false;
        }

        if (!remotePort || remotePort < 1 || remotePort > 65535) {
            alert('远程端口必须在1-65535之间');
            return false;
        }

        return true;
    }

    isValidIP(ip) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return false;
        }
        
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }

    setStatus(status, message) {
        const indicator = `<span class="connection-indicator ${status}"></span>`;
        const formattedMessage = message.replace(/(.{40})/g, '$1<br>');
        this.statusText.innerHTML = indicator + '<span class="status-text">' + formattedMessage + '</span>';
        this.statusText.className = `status status-${status}`;
        
        if (status === 'connected') {
            this.statusText.classList.add('data-flow');
        } else {
            this.statusText.classList.remove('data-flow');
        }
    }    updateUI() {
        this.connectBtn.disabled = this.isConnected;
        this.disconnectBtn.disabled = !this.isConnected;
        this.sendBtn.disabled = !this.isConnected;
        
        // 修复文件发送按钮状态
        if (this.sendFileBtn) {
            this.sendFileBtn.disabled = !this.isConnected || !this.currentFile;
        }
        
        this.localHostInput.disabled = this.isConnected;
        this.localPortInput.disabled = this.isConnected;
        this.remoteHostInput.disabled = this.isConnected;
        this.remotePortInput.disabled = this.isConnected;
        
        // 添加调试日志
        console.log('UI更新 - 连接状态:', this.isConnected, '当前文件:', this.currentFile ? this.currentFile.name : '无');
    }

    getSendFormat() {
        return document.querySelector('input[name="sendFormat"]:checked').value;
    }

    getReceiveFormat() {
        return document.querySelector('input[name="receiveFormat"]:checked').value;
    }

    updateSendFormat() {
        // 格式切换时可以添加数据转换逻辑
    }

    updateReceiveFormat() {
        // 可以重新格式化已接收的数据
    }

    clearSendData() {
        this.sendDataTextarea.value = '';
    }

    clearReceiveData() {
        this.receiveDataTextarea.value = '';
    }

    updateStats() {
        this.sentBytesSpan.textContent = this.stats.sentBytes.toLocaleString();
        this.receivedBytesSpan.textContent = this.stats.receivedBytes.toLocaleString();
        this.sentPacketsSpan.textContent = this.stats.sentPackets.toLocaleString();
        this.receivedPacketsSpan.textContent = this.stats.receivedPackets.toLocaleString();
    }

    resetStats() {
        this.stats = {
            sentBytes: 0,
            receivedBytes: 0,
            sentPackets: 0,
            receivedPackets: 0
        };
        this.updateStats();
    }

    saveLog() {
        const logContent = this.receiveDataTextarea.value;
        if (!logContent) {
            alert('没有日志内容可保存');
            return;
        }

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `udp_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 配置管理功能
    loadConfigList() {
        const savedConfigs = JSON.parse(localStorage.getItem('udpConfigs') || '{}');
        this.configSelect.innerHTML = '<option value="">请选择配置...</option>';
        
        Object.keys(savedConfigs).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.configSelect.appendChild(option);
        });
        
        this.updateConfigButtons();
    }

    onConfigSelectChange() {
        this.updateConfigButtons();
    }

    updateConfigButtons() {
        const hasSelection = this.configSelect.value !== '';
        this.loadConfigBtn.disabled = !hasSelection;
        this.deleteConfigBtn.disabled = !hasSelection;
    }

    loadConfig() {
        const configName = this.configSelect.value;
        if (!configName) return;

        const savedConfigs = JSON.parse(localStorage.getItem('udpConfigs') || '{}');
        const config = savedConfigs[configName];
        
        if (config) {
            this.localHostInput.value = config.localHost || '';
            this.localPortInput.value = config.localPort || '';
            this.remoteHostInput.value = config.remoteHost || '';
            this.remotePortInput.value = config.remotePort || '';
            
            this.addLog('系统', `已加载配置: ${configName}`);
        } else {
            alert('配置不存在');
        }
    }

    showSaveConfigDialog() {
        this.saveConfigGroup.style.display = 'block';
        this.configNameInput.value = '';
        this.configNameInput.focus();
    }

    hideSaveConfigDialog() {
        this.saveConfigGroup.style.display = 'none';
        this.configNameInput.value = '';
    }

    saveConfig() {
        const configName = this.configNameInput.value.trim();
        if (!configName) {
            alert('请输入配置名称');
            return;
        }

        const config = {
            localHost: this.localHostInput.value,
            localPort: this.localPortInput.value,
            remoteHost: this.remoteHostInput.value,
            remotePort: this.remotePortInput.value,
            savedAt: new Date().toISOString()
        };

        const savedConfigs = JSON.parse(localStorage.getItem('udpConfigs') || '{}');
        savedConfigs[configName] = config;
        localStorage.setItem('udpConfigs', JSON.stringify(savedConfigs));

        this.hideSaveConfigDialog();
        this.loadConfigList();
        
        this.configSelect.value = configName;
        this.updateConfigButtons();
        
        this.addLog('系统', `配置已保存: ${configName}`);
    }

    deleteConfig() {
        const configName = this.configSelect.value;
        if (!configName) return;

        if (confirm(`确定要删除配置 "${configName}" 吗？`)) {
            const savedConfigs = JSON.parse(localStorage.getItem('udpConfigs') || '{}');
            delete savedConfigs[configName];
            localStorage.setItem('udpConfigs', JSON.stringify(savedConfigs));

            this.loadConfigList();            this.addLog('系统', `配置已删除: ${configName}`);
        }
    }

    // 添加测试模式功能
    addTestModeButton() {
        const testModeBtn = document.createElement('button');
        testModeBtn.id = 'testModeBtn';
        testModeBtn.className = 'btn btn-warning';
        testModeBtn.textContent = '启用测试模式';
        testModeBtn.style.marginLeft = '10px';
        
        // 添加到连接按钮组
        const buttonGroup = document.querySelector('.connection-panel .button-group');
        if (buttonGroup) {
            buttonGroup.appendChild(testModeBtn);
        }
        
        testModeBtn.addEventListener('click', () => {
            if (!this.testMode) {
                this.enableTestMode();
                testModeBtn.textContent = '退出测试模式';
                testModeBtn.className = 'btn btn-danger';
            } else {
                this.disableTestMode();
                testModeBtn.textContent = '启用测试模式';
                testModeBtn.className = 'btn btn-warning';
            }
        });
    }

    enableTestMode() {
        this.testMode = true;
        this.isConnected = true; // 模拟连接状态
        this.setStatus('connected', '测试模式 - 模拟连接');
        this.updateUI();
        this.addLog('系统', '已启用测试模式 - 可以测试文件发送功能');
        this.addLog('提示', '在此模式下，文件会被"发送"到浏览器控制台');
    }

    disableTestMode() {
        this.testMode = false;
        this.isConnected = false;
        this.setStatus('disconnected', '未连接');
        this.updateUI();
        this.addLog('系统', '已退出测试模式');
    }

    // 供外部调用的方法：设置临时文件用于直接发送
    setTempFile(file) {
        try {
            this.currentFile = file;
            this.currentFileType = 'bin'; // 默认作为二进制文件处理
            
            // 更新UI显示
            if (this.fileNameSpan) {
                this.fileNameSpan.textContent = file.name;
                this.fileNameSpan.title = `文件大小: ${(file.size / 1024).toFixed(1)} KB`;
            }
            
            if (this.clearFileBtn) {
                this.clearFileBtn.style.display = 'inline-block';
            }
            
            this.updateUI();
            this.addLog('系统', `已设置临时文件: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
            
            return true;
        } catch (error) {
            console.error('设置临时文件失败:', error);
            this.addLog('错误', '设置临时文件失败: ' + error.message);
            return false;
        }
    }

    // 处理十六进制数据并创建临时文件
    setTempFileFromHex(fileName, hexData, fileSize, dataType) {
        try {
            // 将十六进制字符串转换回二进制数据
            const binaryData = new Uint8Array(hexData.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            // 创建Blob对象
            const blob = new Blob([binaryData], { type: 'application/octet-stream' });
            
            // 创建File对象
            const file = new File([blob], fileName, { type: 'application/octet-stream' });
            
            // 设置为当前文件
            this.currentFile = file;
            this.currentFileType = 'bin';
            
            // 更新UI显示
            if (this.fileNameSpan) {
                this.fileNameSpan.textContent = fileName;
                this.fileNameSpan.title = `文件大小: ${(fileSize / 1024).toFixed(1)} KB`;
            }
            
            if (this.clearFileBtn) {
                this.clearFileBtn.style.display = 'inline-block';
            }
            
            this.updateUI();
            this.addLog('系统', `已接收临时文件: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)`);
            
            // 自动发送文件
            setTimeout(() => {
                this.sendFileContent();
            }, 100);
            
            return true;
        } catch (error) {
            console.error('设置临时文件失败:', error);
            this.addLog('错误', '设置临时文件失败: ' + error.message);
            return false;
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.udpAssistant = new UDPAssistant();
    
    // 监听来自父窗口的postMessage
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'setTempFile') {
            const { fileName, fileData, fileSize, dataType } = event.data;
            console.log('收到postMessage:', fileName, fileSize, 'bytes');
            window.udpAssistant.setTempFileFromHex(fileName, fileData, fileSize, dataType);
        }
    });
});