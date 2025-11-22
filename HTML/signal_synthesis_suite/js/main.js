/**
 * 信号合成上位机软件套装 - 主控制脚本
 * 负责模块切换、界面交互和状态管理
 */

class SignalSynthesisSuite {
    constructor() {
        this.currentModule = 'waveform';
        this.generatedData = null;
        this.udpStatus = 'disconnected';
        
        this.initializeElements();
        this.bindEvents();
        this.updateStatus();
        
        console.log('信号合成上位机软件套装已启动');
    }

    initializeElements() {
        // 导航按钮
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.modules = document.querySelectorAll('.module');
        
        // 状态显示元素
        this.udpStatusDot = document.getElementById('udpStatusDot');
        this.udpStatusText = document.getElementById('udpStatusText');
        
        // iframe元素
        this.waveformFrame = document.getElementById('waveformFrame');
        this.modulationFrame = document.getElementById('modulationFrame');
        this.udpFrame = document.getElementById('udpFrame');
    }

    bindEvents() {
        // 导航按钮事件
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.switchModule(target);
            });
        });

        // 监听iframe加载完成
        if (this.waveformFrame) {
            this.waveformFrame.addEventListener('load', () => {
                this.setupWaveformBridge();
            });
        }

        if (this.modulationFrame) {
            this.modulationFrame.addEventListener('load', () => {
                this.setupModulationBridge();
            });
        }

        if (this.udpFrame) {
            this.udpFrame.addEventListener('load', () => {
                this.setupUDPBridge();
            });
        }
    }

    switchModule(target) {
        // 更新导航按钮状态
        this.navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-target="${target}"]`).classList.add('active');

        // 更新模块显示
        this.modules.forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(`${target}-module`).classList.add('active');

        // 更新当前模块
        this.currentModule = target;
        this.updateStatus();
    }

    toggleHeader() {
        const isCollapsed = this.collapsibleHeader.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 展开头部
            this.collapsibleHeader.classList.remove('collapsed');
            this.toggleIcon.textContent = '▼';
            this.toggleText.textContent = '收起导航';
        } else {
            // 收起头部
            this.collapsibleHeader.classList.add('collapsed');
            this.toggleIcon.textContent = '▶';
            this.toggleText.textContent = '展开导航';
        }
        
        // 添加旋转动画
        this.toggleIcon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
    }

    updateStatus() {
        const moduleNames = {
            'waveform': '手绘波形生成器',
            'modulation': '调制信号生成器',
            'udp': 'UDP通信助手'
        };

        // 更新UDP状态显示
        const udpStatusText = {
            'disconnected': '未连接',
            'connecting': '连接中',
            'connected': '已连接',
            'error': '连接错误'
        };
        
        if (this.udpStatusText) {
            this.udpStatusText.textContent = udpStatusText[this.udpStatus];
        }
        
        // 更新UDP状态颜色
        if (this.udpStatusDot) {
            this.udpStatusDot.className = 'status-dot ' + this.udpStatus;
        }
    }

    setupWaveformBridge() {
        try {
            const waveformWindow = this.waveformFrame.contentWindow;
            // 建立与手绘波形生成器的通信桥接
            console.log('手绘波形生成器模块已加载');
        } catch (error) {
            console.warn('无法建立手绘波形生成器桥接:', error);
        }
    }

    setupModulationBridge() {
        try {
            const modulationWindow = this.modulationFrame.contentWindow;
            // 建立与调制信号生成器的通信桥接
            console.log('调制信号生成器模块已加载');
        } catch (error) {
            console.warn('无法建立调制信号生成器桥接:', error);
        }
    }

    setupUDPBridge() {
        try {
            const udpWindow = this.udpFrame.contentWindow;
            // 建立与UDP助手的通信桥接
            console.log('UDP通信助手模块已加载');
            
            // 等待UDP助手初始化完成
            const checkUDPReady = () => {
                if (udpWindow.udpAssistant) {
                    console.log('UDP助手实例已准备就绪');
                    // 可以在这里添加额外的初始化代码
                } else {
                    // 如果还没准备好，继续等待
                    setTimeout(checkUDPReady, 100);
                }
            };
            
            // 延迟检查，给UDP助手模块时间初始化
            setTimeout(checkUDPReady, 500);
            
            // 监听UDP连接状态变化
            this.monitorUDPStatus();
        } catch (error) {
            console.warn('无法建立UDP助手桥接:', error);
        }
    }

    exportWaveformData() {
        try {
            // 从手绘波形生成器获取数据
            const waveformWindow = this.waveformFrame.contentWindow;
            
            // 模拟获取波形数据
            const sampleData = this.generateSampleWaveformData();
            this.generatedData = sampleData;
            
            this.generationStatusSpan.textContent = '波形数据已生成';
            this.dataSizeSpan.textContent = `${(sampleData.length / 1024).toFixed(1)} KB`;
            
            this.showNotification('手绘波形数据已导出到内存，可以发送到UDP助手');
            
        } catch (error) {
            console.error('导出波形数据失败:', error);
            this.showNotification('导出波形数据失败', 'error');
        }
    }

    exportModulationData() {
        try {
            // 从调制信号生成器获取数据
            const modulationWindow = this.modulationFrame.contentWindow;
            
            // 模拟获取调制信号数据
            const sampleData = this.generateSampleModulationData();
            this.generatedData = sampleData;
            
            this.generationStatusSpan.textContent = '调制信号已生成';
            this.dataSizeSpan.textContent = `${(sampleData.length / 1024).toFixed(1)} KB`;
            
            this.showNotification('调制信号数据已导出到内存，可以发送到UDP助手');
            
        } catch (error) {
            console.error('导出调制信号数据失败:', error);
            this.showNotification('导出调制信号数据失败', 'error');
        }
    }

    directSendWaveformData() {
        try {
            // 检查UDP连接状态
            if (this.udpStatus !== 'connected') {
                this.showNotification('UDP未连接，请先建立连接', 'warning');
                this.switchModule('udp'); // 自动切换到UDP模块
                return;
            }

            // 获取波形数据
            const sampleData = this.generateSampleWaveformData();
            this.generatedData = sampleData;
            
            this.generationStatusSpan.textContent = '波形数据已生成';
            this.dataSizeSpan.textContent = `${(sampleData.length / 1024).toFixed(1)} KB`;
            
            // 创建临时.bin文件并通过UDP助手发送
            this.createTempFileAndSend(sampleData, 'waveform_data.bin', 'hand');
            
            this.showNotification('正在创建临时文件并发送波形数据...');
            
        } catch (error) {
            console.error('直接发送波形数据失败:', error);
            this.showNotification('直接发送波形数据失败', 'error');
        }
    }

    directSendModulationData() {
        try {
            // 检查UDP连接状态
            if (this.udpStatus !== 'connected') {
                this.showNotification('UDP未连接，请先建立连接', 'warning');
                this.switchModule('udp'); // 自动切换到UDP模块
                return;
            }

            // 获取调制信号数据
            const sampleData = this.generateSampleModulationData();
            this.generatedData = sampleData;
            
            this.generationStatusSpan.textContent = '调制信号已生成';
            this.dataSizeSpan.textContent = `${(sampleData.length / 1024).toFixed(1)} KB`;
            
            // 创建临时.bin文件并通过UDP助手发送
            this.createTempFileAndSend(sampleData, 'modulation_data.bin', 'modulation');
            
            this.showNotification('正在创建临时文件并发送调制信号数据...');
            
        } catch (error) {
            console.error('直接发送调制信号数据失败:', error);
            this.showNotification('直接发送调制信号数据失败', 'error');
        }
    }

    sendDataToUDP(data, dataType) {
        // 模拟发送到UDP的过程
        console.log(`发送${dataType}数据到UDP:`, data.length, '字节');
        
        this.showNotification(`正在发送 ${(data.length / 1024).toFixed(1)} KB ${dataType}数据...`);
        
        // 模拟发送进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            if (progress <= 100) {
                this.showNotification(`发送进度: ${progress}%`);
            } else {
                clearInterval(interval);
                this.showNotification(`${dataType}数据发送成功！`, 'success');
            }
        }, 200);
    }

    createTempFileAndSend(data, fileName, dataType) {
        try {
            // 将数组数据转换为Uint8Array
            const uint8Array = new Uint8Array(data);
            
            // 将二进制数据转换为十六进制字符串，用于跨iframe传输
            const hexData = Array.from(uint8Array).map(byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
            
            // 构造消息对象
            const message = {
                type: 'setTempFile',
                fileName: fileName,
                fileData: hexData,
                fileSize: uint8Array.length,
                dataType: dataType
            };
            
            // 切换到UDP模块
            this.switchModule('udp');
            
            // 延迟发送消息，确保iframe加载完成
            setTimeout(() => {
                // 使用postMessage向UDP助手iframe发送消息
                this.udpFrame.contentWindow.postMessage(message, '*');
                this.showNotification(`正在发送${dataType}数据到UDP设备...`, 'info');
            }, 500);
            
        } catch (error) {
            console.error('创建临时文件并发送失败:', error);
            this.showNotification('文件发送失败: ' + error.message, 'error');
        }
    }

    quickConnectUDP() {
        this.udpStatus = 'connecting';
        this.updateStatus();
        
        // 切换到UDP模块
        this.switchModule('udp');
        
        // 模拟连接过程
        setTimeout(() => {
            this.udpStatus = 'connected';
            this.updateStatus();
            this.showNotification('UDP连接已建立');
        }, 1500);
    }

    sendGeneratedData() {
        if (!this.generatedData) {
            this.showNotification('没有可发送的数据，请先生成信号', 'warning');
            return;
        }

        if (this.udpStatus !== 'connected') {
            this.showNotification('UDP未连接，请先建立连接', 'warning');
            return;
        }

        try {
            // 使用相同的postMessage机制发送存储的数据
            const fileName = 'generated_data.bin';
            this.createTempFileAndSend(this.generatedData, fileName, 'generated');
            
            this.showNotification('正在发送存储的数据到UDP设备...');
            
        } catch (error) {
            console.error('发送数据失败:', error);
            this.showNotification('发送数据失败', 'error');
        }
    }

    monitorUDPStatus() {
        // 定期检查UDP连接状态
        setInterval(() => {
            // 这里可以与UDP助手通信获取真实状态
            // 现在使用模拟状态
        }, 5000);
    }

    generateSampleWaveformData() {
        // 生成示例波形数据（1024个点）
        const data = new Uint8Array(1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(128 + 127 * Math.sin(2 * Math.PI * i / 100));
        }
        return data;
    }

    generateSampleModulationData() {
        // 生成示例调制信号数据（2048个点）
        const data = new Uint8Array(2048);
        for (let i = 0; i < data.length; i++) {
            const carrier = Math.sin(2 * Math.PI * i / 50);
            const modulation = Math.sin(2 * Math.PI * i / 200);
            data[i] = Math.floor(128 + 100 * carrier * (1 + 0.5 * modulation));
        }
        return data;
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 设置样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // 设置颜色
        const colors = {
            'info': '#2196f3',
            'success': '#4caf50',
            'warning': '#ff9800',
            'error': '#f44336'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动消失
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.signalSuite = new SignalSynthesisSuite();
});
