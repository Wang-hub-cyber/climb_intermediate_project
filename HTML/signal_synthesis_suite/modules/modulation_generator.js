// ASK/BPSK/AM/FM调制信号生成器 JavaScript

// 全局变量
let canvas, ctx;
let signalData = [];
let dacData = [];
let isDigitalMode = true; // 数字调制模式标志

// DOM 元素
const modulationTypeSelect = document.getElementById('modulationType');
const carrierFreqInput = document.getElementById('carrierFreq');
const baudRateSelect = document.getElementById('baudRate');
const sampleRateInput = document.getElementById('sampleRate');
const sampleCountSelect = document.getElementById('sampleCount');
const dataInputTextarea = document.getElementById('dataInput');
const fileNameInput = document.getElementById('fileName');

// 模式切换按钮
const digitalModeBtn = document.getElementById('digitalModeBtn');
const analogModeBtn = document.getElementById('analogModeBtn');

// ASK参数
const askAmplitude1Input = document.getElementById('askAmplitude1');
const askAmplitude0Input = document.getElementById('askAmplitude0');
const askAmp1ValueSpan = document.getElementById('askAmp1Value');
const askAmp0ValueSpan = document.getElementById('askAmp0Value');

// BPSK参数
const bpskPhase1Input = document.getElementById('bpskPhase1');
const bpskPhase0Input = document.getElementById('bpskPhase0');
const bpskPhase1ValueSpan = document.getElementById('bpskPhase1Value');
const bpskPhase0ValueSpan = document.getElementById('bpskPhase0Value');

// AM参数
const amModulationDepthInput = document.getElementById('amModulationDepth');
const amModulationFreqInput = document.getElementById('amModulationFreq');
const amDepthValueSpan = document.getElementById('amDepthValue');

// FM参数
const fmFrequencyDeviationInput = document.getElementById('fmFrequencyDeviation');
const fmModulationFreqInput = document.getElementById('fmModulationFreq');

// 按钮
const generateRandomBtn = document.getElementById('generateRandomBtn');
const generateTestBtn = document.getElementById('generateTestBtn');
const generateSignalBtn = document.getElementById('generateSignalBtn');
const quickTestBtn = document.getElementById('quickTestBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const downloadBinBtn = document.getElementById('downloadBinBtn');

// 波形控制按钮
const displayPointsSelect = document.getElementById('displayPoints');
const displayOffsetRange = document.getElementById('displayOffset');
const offsetValueSpan = document.getElementById('offsetValue');
const refreshWaveBtn = document.getElementById('refreshWaveBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

// 波形显示变量
let currentDisplayPoints = 4000;
let currentDisplayOffset = 0;
let zoomLevel = 1;

// 显示元素
const signalInfoSpan = document.getElementById('signalInfo');
const dataPreviewTextarea = document.getElementById('dataPreview');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('signalCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        console.log('Canvas初始化成功');
        clearCanvas(); // 初始显示网格
    } else {
        console.error('无法找到canvas元素');
    }
      setupEventListeners();
    updateParameterPanels();
    updateSliderValues();
    updateStats(); // 初始化统计信息
    
    // 初始化波形控制显示
    offsetValueSpan.textContent = '0%';
});

// 设置事件监听器
function setupEventListeners() {
    // 调制类型变化
    modulationTypeSelect.addEventListener('change', updateParameterPanels);
    
    // 模式切换按钮
    digitalModeBtn.addEventListener('click', switchToDigitalMode);
    analogModeBtn.addEventListener('click', switchToAnalogMode);
    
    // 滑块值变化
    askAmplitude1Input.addEventListener('input', updateSliderValues);
    askAmplitude0Input.addEventListener('input', updateSliderValues);
    bpskPhase1Input.addEventListener('input', updateSliderValues);
    bpskPhase0Input.addEventListener('input', updateSliderValues);
    amModulationDepthInput.addEventListener('input', updateSliderValues);// 按钮事件
    generateRandomBtn.addEventListener('click', generateRandomData);
    generateTestBtn.addEventListener('click', generateTestData);
    generateSignalBtn.addEventListener('click', generateModulatedSignal);
    quickTestBtn.addEventListener('click', quickTest);
    clearDataBtn.addEventListener('click', clearData);
    downloadTxtBtn.addEventListener('click', () => downloadFile('txt'));
    downloadBinBtn.addEventListener('click', () => downloadFile('bin'));
      // 输入验证
    carrierFreqInput.addEventListener('input', validateInputs);
    sampleRateInput.addEventListener('input', validateInputs);
    
    // 波形控制事件
    displayPointsSelect.addEventListener('change', updateDisplayPoints);
    displayOffsetRange.addEventListener('input', updateDisplayOffset);
    refreshWaveBtn.addEventListener('click', refreshWaveform);
    resetViewBtn.addEventListener('click', resetView);
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    prevPageBtn.addEventListener('click', prevPage);
    nextPageBtn.addEventListener('click', nextPage);
}

// 更新参数面板显示
function updateParameterPanels() {
    const modulationType = modulationTypeSelect.value;
    const askParams = document.getElementById('askParams');
    const bpskParams = document.getElementById('bpskParams');
    const amParams = document.getElementById('amParams');
    const fmParams = document.getElementById('fmParams');
    
    // 隐藏所有参数面板
    askParams.style.display = 'none';
    bpskParams.style.display = 'none';
    amParams.style.display = 'none';
    fmParams.style.display = 'none';
    
    // 显示对应的参数面板
    if (modulationType === 'ask') {
        askParams.style.display = 'block';
    } else if (modulationType === 'bpsk') {
        bpskParams.style.display = 'block';
    } else if (modulationType === 'am') {
        amParams.style.display = 'block';
    } else if (modulationType === 'fm') {
        fmParams.style.display = 'block';
    }
}

// 切换到数字调制模式
function switchToDigitalMode() {
    isDigitalMode = true;
    digitalModeBtn.classList.add('active');
    analogModeBtn.classList.remove('active');
    
    // 显示数字调制选项，隐藏模拟调制选项
    const askOption = modulationTypeSelect.querySelector('option[value="ask"]');
    const bpskOption = modulationTypeSelect.querySelector('option[value="bpsk"]');
    const amOption = modulationTypeSelect.querySelector('option[value="am"]');
    const fmOption = modulationTypeSelect.querySelector('option[value="fm"]');
    
    askOption.style.display = '';
    bpskOption.style.display = '';
    amOption.style.display = 'none';
    fmOption.style.display = 'none';
    
    // 设置默认选择
    modulationTypeSelect.value = 'ask';
    updateParameterPanels();
    
    console.log('切换到数字调制模式');
}

// 切换到模拟调制模式
function switchToAnalogMode() {
    isDigitalMode = false;
    digitalModeBtn.classList.remove('active');
    analogModeBtn.classList.add('active');
    
    // 隐藏数字调制选项，显示模拟调制选项
    const askOption = modulationTypeSelect.querySelector('option[value="ask"]');
    const bpskOption = modulationTypeSelect.querySelector('option[value="bpsk"]');
    const amOption = modulationTypeSelect.querySelector('option[value="am"]');
    const fmOption = modulationTypeSelect.querySelector('option[value="fm"]');
    
    askOption.style.display = 'none';
    bpskOption.style.display = 'none';
    amOption.style.display = '';
    fmOption.style.display = '';
    
    // 设置默认选择
    modulationTypeSelect.value = 'am';
    updateParameterPanels();
    
    console.log('切换到模拟调制模式');
}

// 更新滑块值显示
function updateSliderValues() {
    askAmp1ValueSpan.textContent = askAmplitude1Input.value;
    askAmp0ValueSpan.textContent = askAmplitude0Input.value;
    bpskPhase1ValueSpan.textContent = bpskPhase1Input.value + '°';
    bpskPhase0ValueSpan.textContent = bpskPhase0Input.value + '°';
    amDepthValueSpan.textContent = amModulationDepthInput.value + '%';
}

// 生成随机二进制数据
function generateRandomData() {
    const baudRate = parseInt(baudRateSelect.value);
    const sampleRate = parseInt(sampleRateInput.value);
    const sampleCount = parseInt(sampleCountSelect.value);
    const signalDuration = sampleCount / sampleRate; // 信号时长(秒)
    const bitCount = Math.max(32, Math.floor(signalDuration * baudRate)); // 至少32位数据
    
    let randomData = '';
    for (let i = 0; i < bitCount; i++) {
        randomData += Math.random() < 0.5 ? '0' : '1';
    }
    
    dataInputTextarea.value = randomData;
    console.log(`生成了${bitCount}位随机二进制数据，信号时长${signalDuration.toFixed(3)}秒`);    console.log(`数据预览: ${randomData.substring(0, 50)}...`);
}

// 生成1010...测试数据
function generateTestData() {
    const baudRate = parseInt(baudRateSelect.value);
    const sampleRate = parseInt(sampleRateInput.value);
    const sampleCount = parseInt(sampleCountSelect.value);
    const signalDuration = sampleCount / sampleRate; // 信号时长(秒)
    const bitCount = Math.max(32, Math.floor(signalDuration * baudRate)); // 至少32位数据
    
    // 生成1010...交替模式
    let testData = '';
    for (let i = 0; i < bitCount; i++) {
        testData += (i % 2).toString(); // 0,1,0,1,0,1...
    }
    
    dataInputTextarea.value = testData;
    console.log(`生成了${bitCount}位1010测试数据，信号时长${signalDuration.toFixed(3)}秒`);
    console.log(`数据预览: ${testData.substring(0, 50)}...`);    console.log(`模式验证: 前20位=${testData.substring(0, 20)}`);
}

// 快速测试：生成1010...数据并立即调制
function quickTest() {
    console.log('=== 快速测试开始 ===');
    
    // 显示快速测试状态
    const quickBtn = document.getElementById('quickTestBtn');
    const originalText = quickBtn.textContent;
    quickBtn.textContent = '正在快速测试...';
    quickBtn.disabled = true;
    
    try {
        // 显示当前使用的参数
        const modulationType = modulationTypeSelect.value;
        const carrierFreq = parseInt(carrierFreqInput.value);
        const baudRate = parseInt(baudRateSelect.value);
        const sampleRate = parseInt(sampleRateInput.value);
        const sampleCount = parseInt(sampleCountSelect.value);
        
        console.log(`快速测试参数:`);
        console.log(`- 调制类型: ${modulationType.toUpperCase()}`);
        console.log(`- 载波频率: ${carrierFreq}Hz`);
        console.log(`- 波特率: ${baudRate}bps`);
        console.log(`- 采样率: ${sampleRate}Hz`);
        console.log(`- 采样点数: ${sampleCount}`);
        
        // 首先生成1010...测试数据
        generateTestData();
        
        // 短暂延迟后自动开始调制
        setTimeout(() => {
            console.log('开始自动调制...');
            generateModulatedSignal();
            
            // 恢复按钮状态
            setTimeout(() => {
                quickBtn.textContent = originalText;
                quickBtn.disabled = false;
                console.log('=== 快速测试完成 ===');
            }, 1000);
        }, 500);
        
    } catch (error) {
        console.error('快速测试出错:', error);
        quickBtn.textContent = originalText;
        quickBtn.disabled = false;        alert('快速测试失败: ' + error.message);
    }
}

// 波形控制功能
function updateDisplayPoints() {
    currentDisplayPoints = parseInt(displayPointsSelect.value);
    console.log(`更新显示点数: ${currentDisplayPoints}`);
    if (signalData.length > 0) {
        drawSignal();
    }
}

function updateDisplayOffset() {
    currentDisplayOffset = parseInt(displayOffsetRange.value);
    offsetValueSpan.textContent = currentDisplayOffset + '%';
    console.log(`更新显示偏移: ${currentDisplayOffset}%`);
    if (signalData.length > 0) {
        drawSignal();
    }
}

function refreshWaveform() {
    console.log('刷新波形显示');
    if (signalData.length > 0) {
        drawSignal();
    } else {
        console.log('没有信号数据可刷新');
    }
}

function resetView() {
    currentDisplayOffset = 0;
    zoomLevel = 1;
    currentDisplayPoints = 4000;
    
    displayOffsetRange.value = 0;
    offsetValueSpan.textContent = '0%';
    displayPointsSelect.value = '4000';
    
    console.log('重置视图参数');
    if (signalData.length > 0) {
        drawSignal();
    }
}

function zoomIn() {
    if (currentDisplayPoints > 500) {
        currentDisplayPoints = Math.floor(currentDisplayPoints * 0.5);
        displayPointsSelect.value = currentDisplayPoints.toString();
        console.log(`放大 - 显示点数: ${currentDisplayPoints}`);
        if (signalData.length > 0) {
            drawSignal();
        }
    }
}

function zoomOut() {
    if (currentDisplayPoints < 32000) {
        currentDisplayPoints = Math.floor(currentDisplayPoints * 2);
        displayPointsSelect.value = currentDisplayPoints.toString();
        console.log(`缩小 - 显示点数: ${currentDisplayPoints}`);
        if (signalData.length > 0) {
            drawSignal();
        }
    }
}

function prevPage() {
    if (currentDisplayOffset > 0) {
        currentDisplayOffset = Math.max(0, currentDisplayOffset - 10);
        displayOffsetRange.value = currentDisplayOffset;
        offsetValueSpan.textContent = currentDisplayOffset + '%';
        console.log(`上一页 - 偏移: ${currentDisplayOffset}%`);
        if (signalData.length > 0) {
            drawSignal();
        }
    }
}

function nextPage() {
    if (currentDisplayOffset < 90) {
        currentDisplayOffset = Math.min(90, currentDisplayOffset + 10);
        displayOffsetRange.value = currentDisplayOffset;
        offsetValueSpan.textContent = currentDisplayOffset + '%';
        console.log(`下一页 - 偏移: ${currentDisplayOffset}%`);
        if (signalData.length > 0) {
            drawSignal();
        }
    }
}

// 清空数据
function clearData() {
    dataInputTextarea.value = '';
    signalData = [];
    dacData = [];
    dataPreviewTextarea.value = '';
    signalInfoSpan.textContent = '等待生成信号...';
    downloadTxtBtn.disabled = true;
    downloadBinBtn.disabled = true;
    clearCanvas();
    updateStats();
}

// 生成调制信号
function generateModulatedSignal() {
    let binaryData = dataInputTextarea.value.replace(/[^01]/g, ''); // 只保留0和1
    
    // 如果没有数据，自动生成一些测试数据
    if (!binaryData) {
        console.log('没有输入数据，生成测试数据...');
        binaryData = '10101100110101001010110011010100'; // 32位测试数据
        dataInputTextarea.value = binaryData;
        console.log(`使用测试数据: ${binaryData}`);
    }
    
    const modulationType = modulationTypeSelect.value;
    const carrierFreq = parseInt(carrierFreqInput.value);
    const baudRate = parseInt(baudRateSelect.value);
    const sampleRate = parseInt(sampleRateInput.value);
    const sampleCount = parseInt(sampleCountSelect.value);
    
    // 验证参数
    if (!validateParameters()) {
        return;
    }
    
    // 显示生成进度
    const generateBtn = document.getElementById('generateSignalBtn');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = '正在生成...';
    generateBtn.disabled = true;
      // 使用setTimeout来允许UI更新
    setTimeout(() => {
        try {
            console.log('=== 开始生成调制信号 ===');
            console.log(`调制类型: ${modulationType.toUpperCase()}`);
            console.log(`载波频率: ${carrierFreq}Hz`);
            console.log(`波特率: ${baudRate}bps`);
            console.log(`采样率: ${sampleRate}Hz`);
            console.log(`采样点数: ${sampleCount}`);
            console.log(`二进制数据长度: ${binaryData.length}位`);
            console.log(`每位样本数: ${Math.floor(sampleRate / baudRate)}`);
            
            // 清空之前的数据
            signalData = [];
            dacData = [];
            
            // 生成信号
            if (modulationType === 'ask') {
                generateASKSignal(binaryData, carrierFreq, baudRate, sampleRate, sampleCount);
            } else if (modulationType === 'bpsk') {
                generateBPSKSignal(binaryData, carrierFreq, baudRate, sampleRate, sampleCount);
            } else if (modulationType === 'am') {
                generateAMSignal(carrierFreq, sampleRate, sampleCount);
            } else if (modulationType === 'fm') {
                generateFMSignal(carrierFreq, sampleRate, sampleCount);
            }
            
            // 验证信号生成
            if (signalData.length === 0) {
                throw new Error('信号生成失败 - 没有生成数据');
            }
            
            // 转换为DAC数据
            convertToDAC();
            
            // 验证DAC转换
            if (dacData.length === 0) {
                throw new Error('DAC转换失败 - 没有生成DAC数据');
            }
              // 绘制波形
            drawSignal();
            
            // 更新预览和统计
            updatePreview();
            updateStats();
            
            // 启用下载按钮
            downloadTxtBtn.disabled = false;
            downloadBinBtn.disabled = false;
              console.log(`生成了${modulationType.toUpperCase()}调制信号：`);
            console.log(`- 采样点数: ${sampleCount}`);
            console.log(`- 信号数据长度: ${signalData.length}`);
            console.log(`- DAC数据长度: ${dacData.length}`);
            console.log(`- 信号范围: ${Math.min(...signalData.slice(0,1000)).toFixed(3)} ~ ${Math.max(...signalData.slice(0,1000)).toFixed(3)}`);
            console.log(`- DAC范围: ${Math.min(...dacData.slice(0,1000))} ~ ${Math.max(...dacData.slice(0,1000))}`);
            console.log('=== 信号生成完成 ===');
        } catch (error) {
            console.error('生成信号时出错:', error);
            alert('生成信号时出错: ' + error.message);
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
    }, 100);
}

// 生成ASK信号
function generateASKSignal(binaryData, carrierFreq, baudRate, sampleRate, sampleCount) {
    signalData = [];
    const samplesPerBit = Math.floor(sampleRate / baudRate);
    const amplitude1 = parseFloat(askAmplitude1Input.value);
    const amplitude0 = parseFloat(askAmplitude0Input.value);
      console.log(`ASK参数: 载波${carrierFreq}Hz, 波特率${baudRate}bps, 采样率${sampleRate}Hz`);
    console.log(`每位样本数: ${samplesPerBit}, 振幅1: ${amplitude1}, 振幅0: ${amplitude0}`);
    console.log(`二进制数据: ${binaryData.substring(0, 20)}... (长度${binaryData.length})`);
    
    // 高采样率优化提示
    if (sampleRate > 10000000) {
        console.log(`高采样率模式: ${(sampleRate/1000000).toFixed(0)}MHz，优化生成算法`);
    }
    
    let sampleIndex = 0;
    let bitIndex = 0;
    
    // 重复数据直到填满所有采样点
    while (sampleIndex < sampleCount) {
        const bit = parseInt(binaryData[bitIndex % binaryData.length]);
        const amplitude = bit ? amplitude1 : amplitude0;
        
        // 生成当前位的所有样本
        for (let i = 0; i < samplesPerBit && sampleIndex < sampleCount; i++) {
            const t = sampleIndex / sampleRate;
            const signal = amplitude * Math.sin(2 * Math.PI * carrierFreq * t);
            signalData.push(signal);
            sampleIndex++;
        }
        
        bitIndex++;
        
        // 进度显示（每100万个样本）
        if (sampleIndex % 1000000 === 0) {
            console.log(`生成进度: ${(sampleIndex / sampleCount * 100).toFixed(1)}%`);
        }
    }
      console.log(`ASK信号生成完成: ${signalData.length}个样本`);
    console.log(`前10个样本: ${signalData.slice(0, 10).map(x => x.toFixed(3)).join(', ')}`);
    console.log(`中间10个样本: ${signalData.slice(Math.floor(signalData.length/2), Math.floor(signalData.length/2)+10).map(x => x.toFixed(3)).join(', ')}`);
    
    // 验证信号是否有变化
    const uniqueValues = [...new Set(signalData.slice(0, 1000).map(x => Math.round(x*1000)/1000))];
    console.log(`前1000个样本中的唯一值数量: ${uniqueValues.length}`);
    if (uniqueValues.length < 10) {
        console.warn('警告: 信号变化很少，可能存在问题');
        console.log('唯一值:', uniqueValues);
    }
}

// 生成BPSK信号
function generateBPSKSignal(binaryData, carrierFreq, baudRate, sampleRate, sampleCount) {
    signalData = [];
    const samplesPerBit = Math.floor(sampleRate / baudRate);
    const phase1 = parseFloat(bpskPhase1Input.value) * Math.PI / 180; // 转换为弧度
    const phase0 = parseFloat(bpskPhase0Input.value) * Math.PI / 180;
    const amplitude = 1.0; // BPSK使用固定振幅
    
    console.log(`BPSK参数: 载波${carrierFreq}Hz, 波特率${baudRate}bps, 采样率${sampleRate}Hz`);
    console.log(`每位样本数: ${samplesPerBit}, 相位1: ${bpskPhase1Input.value}°, 相位0: ${bpskPhase0Input.value}°`);
    console.log(`二进制数据: ${binaryData.substring(0, 20)}... (长度${binaryData.length})`);
    
    let sampleIndex = 0;
    let bitIndex = 0;
    
    // 重复数据直到填满所有采样点
    while (sampleIndex < sampleCount) {
        const bit = parseInt(binaryData[bitIndex % binaryData.length]);
        const phase = bit ? phase1 : phase0;
        
        // 生成当前位的所有样本
        for (let i = 0; i < samplesPerBit && sampleIndex < sampleCount; i++) {
            const t = sampleIndex / sampleRate;
            const signal = amplitude * Math.sin(2 * Math.PI * carrierFreq * t + phase);
            signalData.push(signal);
            sampleIndex++;
        }
        
        bitIndex++;
        
        // 进度显示（每100万个样本）
        if (sampleIndex % 1000000 === 0) {
            console.log(`生成进度: ${(sampleIndex / sampleCount * 100).toFixed(1)}%`);
        }
    }
      console.log(`BPSK信号生成完成: ${signalData.length}个样本`);
    console.log(`前10个样本: ${signalData.slice(0, 10).map(x => x.toFixed(3)).join(', ')}`);
    console.log(`中间10个样本: ${signalData.slice(Math.floor(signalData.length/2), Math.floor(signalData.length/2)+10).map(x => x.toFixed(3)).join(', ')}`);
    
    // 验证信号是否有变化
    const uniqueValues = [...new Set(signalData.slice(0, 1000).map(x => Math.round(x*1000)/1000))];
    console.log(`前1000个样本中的唯一值数量: ${uniqueValues.length}`);
    if (uniqueValues.length < 10) {
        console.warn('警告: 信号变化很少，可能存在问题');
        console.log('唯一值:', uniqueValues);
    }
}

// 生成AM信号
function generateAMSignal(carrierFreq, sampleRate, sampleCount) {
    signalData = [];
    const modulationDepth = parseFloat(amModulationDepthInput.value) / 100; // 转换为小数
    const modulationFreq = parseInt(amModulationFreqInput.value);
    
    console.log(`AM参数: 载波${carrierFreq}Hz, 调制频率${modulationFreq}Hz, 调制深度${modulationDepth*100}%`);
    console.log(`采样率: ${sampleRate}Hz, 采样点数: ${sampleCount}`);
    
    for (let i = 0; i < sampleCount; i++) {
        const t = i / sampleRate;
        
        // AM调制信号: s(t) = (1 + m*cos(2πfm*t)) * cos(2πfc*t)
        // 为了保持在[-1, 1]范围内，我们需要归一化
        const modulatingSignal = Math.cos(2 * Math.PI * modulationFreq * t);
        const envelope = 1 + modulationDepth * modulatingSignal;
        const carrier = Math.cos(2 * Math.PI * carrierFreq * t);
        
        // 原始AM信号
        let signal = envelope * carrier;
        
        // 归一化到[-1, 1]范围
        // 最大幅度是 (1 + modulationDepth)，最小幅度是 (1 - modulationDepth)
        // 所以信号范围是 [-(1 + modulationDepth), (1 + modulationDepth)]
        const maxAmplitude = 1 + modulationDepth;
        if (maxAmplitude > 0) {
            signal = signal / maxAmplitude;
        }
        
        signalData.push(signal);
        
        // 进度显示（每100万个样本）
        if (i % 1000000 === 0) {
            console.log(`生成进度: ${(i / sampleCount * 100).toFixed(1)}%`);
        }
    }
    
    console.log(`AM信号生成完成: ${signalData.length}个样本`);
    console.log(`前10个样本: ${signalData.slice(0, 10).map(x => x.toFixed(3)).join(', ')}`);
    console.log(`信号范围: ${Math.min(...signalData.slice(0, 1000)).toFixed(3)} ~ ${Math.max(...signalData.slice(0, 1000)).toFixed(3)}`);
    console.log(`归一化因子: 1/${(1 + modulationDepth).toFixed(3)}`);
}

// 生成FM信号
function generateFMSignal(carrierFreq, sampleRate, sampleCount) {
    signalData = [];
    const frequencyDeviation = parseInt(fmFrequencyDeviationInput.value);
    const modulationFreq = parseInt(fmModulationFreqInput.value);
    
    console.log(`FM参数: 载波${carrierFreq}Hz, 调制频率${modulationFreq}Hz, 频偏${frequencyDeviation}Hz`);
    console.log(`采样率: ${sampleRate}Hz, 采样点数: ${sampleCount}`);
    
    let phase = 0;
    const phaseIncrement = 2 * Math.PI / sampleRate;
    
    for (let i = 0; i < sampleCount; i++) {
        const t = i / sampleRate;
        
        // FM调制信号: s(t) = cos(2πfc*t + (Δf/fm)*sin(2πfm*t))
        // 其中 Δf 是频偏，fm 是调制频率，fc 是载波频率
        const modulatingSignal = Math.sin(2 * Math.PI * modulationFreq * t);
        const instantaneousFreq = carrierFreq + frequencyDeviation * modulatingSignal;
        
        // 累积相位（积分瞬时频率）
        phase += instantaneousFreq * phaseIncrement;
        const signal = Math.cos(phase);
        
        signalData.push(signal);
        
        // 进度显示（每100万个样本）
        if (i % 1000000 === 0) {
            console.log(`生成进度: ${(i / sampleCount * 100).toFixed(1)}%`);
        }
    }
    
    console.log(`FM信号生成完成: ${signalData.length}个样本`);
    console.log(`前10个样本: ${signalData.slice(0, 10).map(x => x.toFixed(3)).join(', ')}`);
    console.log(`信号范围: ${Math.min(...signalData.slice(0, 1000)).toFixed(3)} ~ ${Math.max(...signalData.slice(0, 1000)).toFixed(3)}`);
}

// 转换为DAC数据
function convertToDAC() {
    dacData = [];
    
    // 设置输出范围：最小值5，最大值250
    const minOutput = 5;
    const maxOutput = 250;
    const outputRange = maxOutput - minOutput; // 245
    
    // 检查信号范围
    const minSignal = Math.min(...signalData.slice(0, Math.min(signalData.length, 10000)));
    const maxSignal = Math.max(...signalData.slice(0, Math.min(signalData.length, 10000)));
    console.log(`DAC转换前信号范围检查: ${minSignal.toFixed(3)} ~ ${maxSignal.toFixed(3)}`);
    
    if (minSignal < -1.1 || maxSignal > 1.1) {
        console.warn(`警告: 信号幅度超出预期范围[-1, 1]，可能会被截断`);
    }
    
    for (let i = 0; i < signalData.length; i++) {
        // 将信号范围从[-1, 1]映射到[minOutput, maxOutput]
        // 首先确保信号在[-1, 1]范围内
        let normalizedSignal = Math.max(-1, Math.min(1, signalData[i]));
        
        // 公式：output = minOutput + (signal + 1) / 2 * outputRange
        let dacValue = Math.round(minOutput + (normalizedSignal + 1) / 2 * outputRange);
        dacValue = Math.max(minOutput, Math.min(maxOutput, dacValue)); // 额外的范围限制
        
        dacData.push(dacValue);
    }
    
    console.log(`DAC转换完成，输出范围: ${Math.min(...dacData.slice(0, 1000))} ~ ${Math.max(...dacData.slice(0, 1000))}`);
}

// 绘制信号波形
function drawSignal() {
    if (signalData.length === 0) {
        console.log('没有信号数据可绘制');
        clearCanvas();
        return;
    }
    
    console.log(`开始绘制波形，数据点数: ${signalData.length}`);
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);    // 绘制网格
    drawGrid();
    
    // 计算显示的样本数量（使用当前显示点数设置）
    const maxDisplaySamples = currentDisplayPoints;
    const displaySamples = Math.min(signalData.length, maxDisplaySamples);
    
    // 计算偏移量
    const startOffset = Math.floor((currentDisplayOffset / 100) * signalData.length);
    const endOffset = Math.min(startOffset + displaySamples, signalData.length);
    const actualDisplaySamples = endOffset - startOffset;
    
    console.log(`显示 ${actualDisplaySamples} 个点，起始偏移: ${startOffset}, 结束偏移: ${endOffset}`);    // 计算信号的最值（使用当前显示区域的数据进行统计）
    const sampleSize = Math.min(actualDisplaySamples, 5000);
    const dataSlice = signalData.slice(startOffset, startOffset + sampleSize);
    let minVal = Math.min(...dataSlice);
    let maxVal = Math.max(...dataSlice);
    
    // 确保有一定的动态范围
    if (Math.abs(maxVal - minVal) < 0.1) {
        // 如果信号变化太小，使用默认范围
        minVal = -1.2;
        maxVal = 1.2;
        console.log('信号变化太小，使用默认显示范围');
    } else {
        // 增加一些边距以便更好地显示
        const range = maxVal - minVal;
        minVal -= range * 0.1;
        maxVal += range * 0.1;
    }
    
    console.log(`信号范围: ${minVal.toFixed(3)} ~ ${maxVal.toFixed(3)}`);    // 绘制信号波形
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let firstPoint = true;
    for (let i = 0; i < actualDisplaySamples; i++) {
        const dataIndex = startOffset + i;
        if (dataIndex >= signalData.length) break;
        
        const amplitude = signalData[dataIndex];
        const x = (i / (actualDisplaySamples - 1)) * width;
        const y = height - ((amplitude - minVal) / (maxVal - minVal)) * height;
        
        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // 添加标签信息
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.fillText(`载波: ${carrierFreqInput.value}Hz, 波特率: ${baudRateSelect.value}bps`, 10, 20);
    ctx.fillText(`显示: ${actualDisplaySamples}点, 偏移: ${currentDisplayOffset}%`, 10, 35);
    ctx.fillText(`范围: 样本${startOffset}-${endOffset-1} (${(actualDisplaySamples/signalData.length*100).toFixed(1)}%)`, 10, 50);
    
    console.log('波形绘制完成');
}

// 绘制网格
function drawGrid() {
    const width = canvas.width;
    const height = canvas.height;
    
    // 背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // 网格线
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    // 水平网格线
    for (let i = 0; i <= 10; i++) {
        const y = (height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // 垂直网格线
    for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // 中心线 (0V参考线)
    ctx.strokeStyle = '#dc3545';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 边框
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
}

// 清空画布
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
}

// 更新预览
function updatePreview() {
    if (dacData.length === 0) {
        dataPreviewTextarea.value = '';
        return;
    }
    
    // 显示前100个点
    const previewCount = Math.min(100, dacData.length);
    const previewData = dacData.slice(0, previewCount);
    dataPreviewTextarea.value = previewData.join('\n');
    
    // 更新信号信息
    const sampleRate = parseInt(sampleRateInput.value);
    const sampleCount = parseInt(sampleCountSelect.value);
    const duration = (sampleCount / sampleRate * 1000).toFixed(1); // 毫秒
    signalInfoSpan.textContent = `信号已生成 - 时长: ${duration}ms, 采样点: ${(sampleCount / 1000000).toFixed(1)}M`;
}

// 更新统计信息
function updateStats() {
    const sampleCountSpan = document.getElementById('sampleCountStat');
    const signalDurationSpan = document.getElementById('signalDuration');
    const fileSizeSpan = document.getElementById('fileSize');
    const avgValueSpan = document.getElementById('avgValue');
    
    const sampleCount = parseInt(sampleCountSelect.value);
    const sampleCountText = sampleCount >= 1000000 ? 
        `${(sampleCount / 1000000).toFixed(1)}M` : 
        `${(sampleCount / 1000).toFixed(0)}K`;
    
    sampleCountSpan.textContent = sampleCountText;
    
    if (dacData.length === 0) {
        signalDurationSpan.textContent = '-';
        fileSizeSpan.textContent = '-';
        avgValueSpan.textContent = '-';
        return;
    }
      const sampleRate = parseInt(sampleRateInput.value);
    const duration = (sampleCount / sampleRate * 1000).toFixed(1);
    const avgValue = Math.round(dacData.reduce((sum, val) => sum + val, 0) / dacData.length);
    const fileSizeMB = (sampleCount / (1024 * 1024)).toFixed(1);
    
    // 高采样率时显示更多信息
    let durationText = `${duration}ms`;
    if (sampleRate >= 1000000) {
        durationText += ` @${(sampleRate/1000000).toFixed(0)}MHz`;
    }
    
    signalDurationSpan.textContent = durationText;
    fileSizeSpan.textContent = `${fileSizeMB}MB`;
    avgValueSpan.textContent = avgValue;
}

// 验证参数
function validateParameters() {
    const carrierFreq = parseInt(carrierFreqInput.value);
    const sampleRate = parseInt(sampleRateInput.value);
    
    if (carrierFreq < 100 || carrierFreq > 5000000) {
        alert('载波频率必须在100Hz-5MHz范围内！');
        return false;
    }
    
    if (sampleRate < 10000 || sampleRate > 50000000) {
        alert('采样率必须在10kHz-50MHz范围内！');
        return false;
    }
    
    if (sampleRate < carrierFreq * 10) {
        if (!confirm(`警告：采样率(${(sampleRate/1000).toFixed(0)}kHz)低于载波频率(${(carrierFreq/1000).toFixed(0)}kHz)的10倍，可能导致失真。是否继续？`)) {
            return false;
        }
    }
    
    if (sampleRate > 10000000) {
        if (!confirm(`采样率较高(${(sampleRate/1000000).toFixed(0)}MHz)，生成大文件可能需要更长时间。是否继续？`)) {
            return false;
        }
    }
    
    return true;
}

// 验证输入
function validateInputs() {
    const carrierFreq = parseInt(carrierFreqInput.value);
    const sampleRate = parseInt(sampleRateInput.value);
    
    if (carrierFreq < 100 || carrierFreq > 5000000) {
        carrierFreqInput.style.borderColor = '#e74c3c';
    } else {
        carrierFreqInput.style.borderColor = '#e1e8ed';
    }
    
    if (sampleRate < 10000 || sampleRate > 50000000) {
        sampleRateInput.style.borderColor = '#e74c3c';
    } else {
        sampleRateInput.style.borderColor = '#e1e8ed';
    }
    
    // 实时检查采样率与载波频率的关系
    if (carrierFreq && sampleRate && sampleRate < carrierFreq * 5) {
        sampleRateInput.style.borderColor = '#f39c12'; // 橙色警告
    }
}

// 下载文件
function downloadFile(format) {
    if (dacData.length === 0) {
        alert('没有数据可以下载！');
        return;
    }
    
    const fileName = fileNameInput.value.trim() || 'modulated_signal';
    const sampleCount = parseInt(sampleCountSelect.value);
    
    // 对于大文件，显示下载进度
    if (sampleCount >= 1000000) {
        const downloadBtn = format === 'txt' ? downloadTxtBtn : downloadBinBtn;
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '准备下载...';
        downloadBtn.disabled = true;
        
        setTimeout(() => {
            try {
                if (format === 'txt') {
                    downloadTxtFile(fileName);
                } else if (format === 'bin') {
                    downloadBinFile(fileName);
                }
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        }, 100);
    } else {
        if (format === 'txt') {
            downloadTxtFile(fileName);
        } else if (format === 'bin') {
            downloadBinFile(fileName);
        }
    }
}

// 下载TXT文件
function downloadTxtFile(fileName) {
    const txtData = dacData.join('\n');
    const blob = new Blob([txtData], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${fileName}.txt`);
}

// 下载BIN文件
function downloadBinFile(fileName) {
    const uint8Array = new Uint8Array(dacData);
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    downloadBlob(blob, `${fileName}.bin`);
}

// 下载Blob
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`下载文件: ${filename}`);
}

console.log('ASK/BPSK/AM/FM调制信号生成器已加载');