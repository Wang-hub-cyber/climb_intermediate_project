/**
 * 数据桥接脚本
 * 负责在不同模块之间传递数据和状态
 */

class DataBridge {
    constructor() {
        this.dataStore = {
            waveformData: null,
            modulationData: null,
            udpConfig: {
                localHost: '192.168.1.10',
                localPort: 1234,
                remoteHost: '192.168.1.102',
                remotePort: 1234
            }
        };
        
        this.eventListeners = {};
        this.setupMessageListener();
        
        console.log('数据桥接系统已初始化');
    }

    setupMessageListener() {
        // 监听来自iframe的消息
        window.addEventListener('message', (event) => {
            this.handleMessage(event);
        });
    }

    handleMessage(event) {
        try {
            const { type, data, source } = event.data;
            
            switch (type) {
                case 'waveform_data':
                    this.storeWaveformData(data);
                    break;
                    
                case 'modulation_data':
                    this.storeModulationData(data);
                    break;
                    
                case 'udp_status':
                    this.updateUDPStatus(data);
                    break;
                    
                case 'request_data':
                    this.sendDataToModule(source, data.dataType);
                    break;
                    
                default:
                    console.log('未知消息类型:', type);
            }
        } catch (error) {
            console.warn('处理消息失败:', error);
        }
    }

    storeWaveformData(data) {
        this.dataStore.waveformData = data;
        this.triggerEvent('waveform_data_updated', data);
        
        console.log('波形数据已存储:', data.length, '个样点');
        
        // 通知主界面
        if (window.signalSuite) {
            window.signalSuite.generationStatusSpan.textContent = '波形数据已生成';
            window.signalSuite.dataSizeSpan.textContent = `${(data.length * 2 / 1024).toFixed(1)} KB`;
        }
    }

    storeModulationData(data) {
        this.dataStore.modulationData = data;
        this.triggerEvent('modulation_data_updated', data);
        
        console.log('调制数据已存储:', data.length, '个样点');
        
        // 通知主界面
        if (window.signalSuite) {
            window.signalSuite.generationStatusSpan.textContent = '调制信号已生成';
            window.signalSuite.dataSizeSpan.textContent = `${(data.length * 2 / 1024).toFixed(1)} KB`;
        }
    }

    updateUDPStatus(status) {
        if (window.signalSuite) {
            window.signalSuite.udpStatus = status.connected ? 'connected' : 'disconnected';
            window.signalSuite.updateStatus();
        }
        
        this.triggerEvent('udp_status_updated', status);
    }

    sendDataToModule(targetModule, dataType) {
        let data = null;
        
        switch (dataType) {
            case 'waveform':
                data = this.dataStore.waveformData;
                break;
            case 'modulation':
                data = this.dataStore.modulationData;
                break;
            case 'udp_config':
                data = this.dataStore.udpConfig;
                break;
        }
        
        if (data) {
            this.postMessageToModule(targetModule, {
                type: 'data_response',
                dataType: dataType,
                data: data
            });
        }
    }

    postMessageToModule(targetModule, message) {
        const frames = {
            'waveform': window.signalSuite?.waveformFrame,
            'modulation': window.signalSuite?.modulationFrame,
            'udp': window.signalSuite?.udpFrame
        };
        
        const frame = frames[targetModule];
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage(message, '*');
        }
    }

    // 数据转换工具
    convertToHex(data) {
        if (!data) return '';
        
        return Array.from(data)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join(' ')
            .toUpperCase();
    }

    convertToBinary(data) {
        if (!data) return new Uint8Array(0);
        
        const buffer = new ArrayBuffer(data.length);
        const view = new Uint8Array(buffer);
        
        for (let i = 0; i < data.length; i++) {
            view[i] = data[i];
        }
        
        return view;
    }

    // 数据压缩和优化
    compressData(data, factor = 2) {
        if (!data || data.length <= factor) return data;
        
        const compressed = new Uint8Array(Math.floor(data.length / factor));
        for (let i = 0; i < compressed.length; i++) {
            compressed[i] = data[i * factor];
        }
        
        return compressed;
    }

    // 事件系统
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }

    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('事件回调执行失败:', error);
                }
            });
        }
    }

    // 数据导出功能
    exportCurrentData(format = 'bin') {
        const activeData = this.getCurrentActiveData();
        if (!activeData) {
            alert('没有可导出的数据');
            return;
        }

        switch (format) {
            case 'bin':
                this.downloadBinaryFile(activeData);
                break;
            case 'hex':
                this.downloadTextFile(this.convertToHex(activeData), 'hex');
                break;
            case 'csv':
                this.downloadCSVFile(activeData);
                break;
        }
    }

    getCurrentActiveData() {
        if (window.signalSuite) {
            const currentModule = window.signalSuite.currentModule;
            if (currentModule === 'waveform') {
                return this.dataStore.waveformData;
            } else if (currentModule === 'modulation') {
                return this.dataStore.modulationData;
            }
        }
        return null;
    }

    downloadBinaryFile(data) {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signal_data_${Date.now()}.bin`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadTextFile(text, extension) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signal_data_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadCSVFile(data) {
        const csv = Array.from(data).map((value, index) => `${index},${value}`).join('\n');
        const csvContent = 'Index,Value\n' + csv;
        this.downloadTextFile(csvContent, 'csv');
    }

    // 获取统计信息
    getDataStatistics(data) {
        if (!data || data.length === 0) return null;
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        
        // 计算标准差
        const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            count: data.length,
            min: min,
            max: max,
            mean: mean.toFixed(2),
            stdDev: stdDev.toFixed(2),
            size: `${(data.length / 1024).toFixed(1)} KB`
        };
    }
}

// 创建全局数据桥接实例
window.dataBridge = new DataBridge();
