// 手绘波形生成器 JavaScript

// 全局变量
let drawingCanvas, drawingCtx;
let previewCanvas, previewCtx;
let isDrawing = false;
let isDrawMode = true;
let brushSize = 3;
let drawnPoints = [];
let signalData = [];
let dacData = [];
let undoStack = [];
let redoStack = [];

// DOM 元素
const sampleRateInput = document.getElementById('sampleRate');
const sampleCountSelect = document.getElementById('sampleCount');
const waveformPeriodsSelect = document.getElementById('waveformPeriods');
const customPeriodsInput = document.getElementById('customPeriods');
const fileNameInput = document.getElementById('fileName');

// 工具栏元素
const drawModeBtn = document.getElementById('drawModeBtn');
const eraseModeBtn = document.getElementById('eraseModeBtn');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValueSpan = document.getElementById('brushSizeValue');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const smoothBtn = document.getElementById('smoothBtn');

// 画布控制元素
const showGridCheckbox = document.getElementById('showGrid');
const showValuesCheckbox = document.getElementById('showValues');
const showCoordsCheckbox = document.getElementById('showCoords');
const showBoundariesCheckbox = document.getElementById('showBoundaries');

// 预设波形按钮
const sineWaveBtn = document.getElementById('sineWaveBtn');
const squareWaveBtn = document.getElementById('squareWaveBtn');
const triangleWaveBtn = document.getElementById('triangleWaveBtn');
const sawtoothWaveBtn = document.getElementById('sawtoothWaveBtn');
const noiseWaveBtn = document.getElementById('noiseWaveBtn');
const presetFreqInput = document.getElementById('presetFreq');

// 生成和预览按钮
const generateSignalBtn = document.getElementById('generateSignalBtn');
const previewWaveBtn = document.getElementById('previewWaveBtn');
const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');

// 预览控制
const previewModeSelect = document.getElementById('previewMode');
const previewOffsetRange = document.getElementById('previewOffset');
const previewOffsetValueSpan = document.getElementById('previewOffsetValue');
const partialControlsDiv = document.getElementById('partialControls');

// 导出按钮
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const downloadBinBtn = document.getElementById('downloadBinBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

// 显示元素
const canvasInfoSpan = document.getElementById('canvasInfo');
const previewInfoSpan = document.getElementById('previewInfo');
const dataPreviewTextarea = document.getElementById('dataPreview');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    drawingCanvas = document.getElementById('drawingCanvas');
    previewCanvas = document.getElementById('previewCanvas');
    
    if (drawingCanvas && previewCanvas) {
        drawingCtx = drawingCanvas.getContext('2d');
        previewCtx = previewCanvas.getContext('2d');
        console.log('画布初始化成功');
        
        setupCanvas();
        clearDrawingCanvas();
        clearPreviewCanvas();
    } else {
        console.error('无法找到canvas元素');
    }
    
    setupEventListeners();
    updateStats();
    updateBrushSize();
    updatePreviewMode(); // 初始化预览模式
    updatePeriodsInput(); // 初始化周期数输入
});

// 设置画布
function setupCanvas() {
    // 设置绘制画布的绘制样式
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    
    // 设置预览画布的绘制样式
    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
}

// 设置事件监听器
function setupEventListeners() {
    // 模式切换
    drawModeBtn.addEventListener('click', () => setDrawMode(true));
    eraseModeBtn.addEventListener('click', () => setDrawMode(false));
    
    // 画布操作
    clearCanvasBtn.addEventListener('click', clearDrawingCanvas);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    smoothBtn.addEventListener('click', smoothWaveform);
    
    // 画笔大小
    brushSizeInput.addEventListener('input', updateBrushSize);
    
    // 画布控制
    showGridCheckbox.addEventListener('change', redrawCanvas);
    showValuesCheckbox.addEventListener('change', redrawCanvas);
    showCoordsCheckbox.addEventListener('change', redrawCanvas);
    showBoundariesCheckbox.addEventListener('change', redrawCanvas);
    
    // 预设波形
    sineWaveBtn.addEventListener('click', () => generatePresetWaveform('sine'));
    squareWaveBtn.addEventListener('click', () => generatePresetWaveform('square'));
    triangleWaveBtn.addEventListener('click', () => generatePresetWaveform('triangle'));
    sawtoothWaveBtn.addEventListener('click', () => generatePresetWaveform('sawtooth'));
    noiseWaveBtn.addEventListener('click', () => generatePresetWaveform('noise'));
    
    // 信号生成
    generateSignalBtn.addEventListener('click', generateSignalData);
    previewWaveBtn.addEventListener('click', drawPreview);
    refreshPreviewBtn.addEventListener('click', drawPreview);
    
    // 预览控制
    previewModeSelect.addEventListener('change', updatePreviewMode);
    previewOffsetRange.addEventListener('input', updatePreviewOffset);
    
    // 下载按钮
    downloadTxtBtn.addEventListener('click', () => downloadFile('txt'));
    downloadBinBtn.addEventListener('click', () => downloadFile('bin'));
    downloadCsvBtn.addEventListener('click', () => downloadFile('csv'));
    
    // 鼠标事件 - 绘制画布
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    
    // 触摸事件支持
    drawingCanvas.addEventListener('touchstart', handleTouch);
    drawingCanvas.addEventListener('touchmove', handleTouch);
    drawingCanvas.addEventListener('touchend', stopDrawing);
    
    // 参数变化监听
    sampleCountSelect.addEventListener('change', updateStats);
    sampleRateInput.addEventListener('input', updateStats);
    waveformPeriodsSelect.addEventListener('change', updatePeriodsInput);
}

// 设置绘制模式
function setDrawMode(isDraw) {
    isDrawMode = isDraw;
    
    if (isDraw) {
        drawModeBtn.classList.add('active');
        eraseModeBtn.classList.remove('active');
        drawingCanvas.style.cursor = 'crosshair';
    } else {
        drawModeBtn.classList.remove('active');
        eraseModeBtn.classList.add('active');
        drawingCanvas.style.cursor = 'not-allowed';
    }
}

// 更新画笔大小
function updateBrushSize() {
    brushSize = parseInt(brushSizeInput.value);
    brushSizeValueSpan.textContent = brushSize;
}

// 开始绘制
function startDrawing(e) {
    // 检查是否在有效绘制区域内
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // 画布总宽度700，有效绘制区域居中，左右各留100像素的禁止区域在CSS中处理
    // 实际绘制区域是整个画布，但我们需要在视觉上给用户边界提示
    
    isDrawing = true;
    
    // 保存当前状态到撤销栈
    saveState();
    
    const y = e.clientY - rect.top;
    
    if (isDrawMode) {
        drawingCtx.beginPath();
        drawingCtx.moveTo(x, y);
    }
    
    draw(e);
}

// 绘制
function draw(e) {
    if (!isDrawing) return;
    
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 将坐标转换为信号值 (-1 到 1)
    const signalValue = 1 - (y / drawingCanvas.height) * 2;
    const timePosition = x / drawingCanvas.width;
    
    if (isDrawMode) {
        // 绘制模式
        drawingCtx.globalCompositeOperation = 'source-over';
        drawingCtx.strokeStyle = '#e74c3c';
        drawingCtx.lineWidth = brushSize;
        drawingCtx.lineTo(x, y);
        drawingCtx.stroke();
        drawingCtx.beginPath();
        drawingCtx.moveTo(x, y);
        
        // 记录绘制点
        drawnPoints.push({x: timePosition, y: signalValue});
    } else {
        // 擦除模式
        drawingCtx.globalCompositeOperation = 'destination-out';
        drawingCtx.beginPath();
        drawingCtx.arc(x, y, brushSize * 2, 0, 2 * Math.PI);
        drawingCtx.fill();
        
        // 从绘制点中移除附近的点
        const eraseRadius = (brushSize * 2) / drawingCanvas.width;
        drawnPoints = drawnPoints.filter(point => {
            const distance = Math.sqrt(
                Math.pow(point.x - timePosition, 2) + 
                Math.pow((1 - point.y) / 2 - y / drawingCanvas.height, 2)
            );
            return distance > eraseRadius;
        });
    }
    
    // 更新坐标显示
    if (showCoordsCheckbox.checked) {
        updateCoordinateDisplay(timePosition, signalValue);
    }
}

// 停止绘制
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        drawingCtx.globalCompositeOperation = 'source-over';
        redrawCanvas();
        
        // 清空重做栈
        redoStack = [];
    }
}

// 处理触摸事件
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                    e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
}

// 清空绘制画布
function clearDrawingCanvas() {
    saveState();
    drawnPoints = [];
    redrawCanvas();
    redoStack = [];
}

// 重绘画布
function redrawCanvas() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // 绘制网格
    if (showGridCheckbox.checked) {
        drawGrid(drawingCtx, drawingCanvas);
    }
    
    // 绘制边界提示
    if (showBoundariesCheckbox.checked) {
        drawBoundaries(drawingCtx, drawingCanvas);
    }
    
    // 重绘所有点
    if (drawnPoints.length > 0) {
        // 按时间排序
        drawnPoints.sort((a, b) => a.x - b.x);
        
        drawingCtx.strokeStyle = '#e74c3c';
        drawingCtx.lineWidth = 2;
        drawingCtx.beginPath();
        
        for (let i = 0; i < drawnPoints.length; i++) {
            const point = drawnPoints[i];
            const x = point.x * drawingCanvas.width;
            const y = (1 - point.y) / 2 * drawingCanvas.height;
            
            if (i === 0) {
                drawingCtx.moveTo(x, y);
            } else {
                drawingCtx.lineTo(x, y);
            }
        }
        
        drawingCtx.stroke();
    }
    
    // 显示数值
    if (showValuesCheckbox.checked) {
        drawValueLabels(drawingCtx, drawingCanvas);
    }
}

// 绘制边界提示
function drawBoundaries(ctx, canvas) {
    ctx.save();
    
    // 绘制有效区域边界 - 只要红线
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    // 左边界 (0%)
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, canvas.height);
    ctx.stroke();
    
    // 右边界 (100%)
    ctx.beginPath();
    ctx.moveTo(canvas.width - 1, 0);
    ctx.lineTo(canvas.width - 1, canvas.height);
    ctx.stroke();
    
    // 绘制轻微的进度标记（可选）
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // 25%、50%、75% 轻微标记
    for (let i = 1; i <= 3; i++) {
        const x = (i * canvas.width) / 4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    ctx.restore();
}

// 绘制网格
function drawGrid(ctx, canvas) {
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    
    // 垂直线
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 水平线
    for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 中心线（0值线）
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    const centerY = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
}

// 绘制数值标签
function drawValueLabels(ctx, canvas) {
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    // Y轴标签
    for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * canvas.height;
        const value = (1 - i / 5).toFixed(1);
        ctx.fillText(value, canvas.width - 5, y + 4);
    }
    
    // X轴标签
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        const value = (i / 10).toFixed(1);
        ctx.fillText(value, x, canvas.height - 5);
    }
}

// 更新坐标显示
function updateCoordinateDisplay(timePos, signalValue) {
    canvasInfoSpan.textContent = 
        `当前位置: 时间=${timePos.toFixed(3)}, 幅度=${signalValue.toFixed(3)}`;
}

// 生成预设波形
function generatePresetWaveform(type) {
    saveState();
    drawnPoints = [];
    
    const frequency = parseFloat(presetFreqInput.value);
    const points = 1000; // 生成1000个点
    
    for (let i = 0; i < points; i++) {
        const x = i / (points - 1);
        let y;
        
        switch (type) {
            case 'sine':
                y = Math.sin(2 * Math.PI * frequency * x);
                break;
            case 'square':
                y = Math.sin(2 * Math.PI * frequency * x) > 0 ? 1 : -1;
                break;
            case 'triangle':
                const t = (frequency * x) % 1;
                y = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
                break;
            case 'sawtooth':
                y = 2 * ((frequency * x) % 1) - 1;
                break;
            case 'noise':
                y = (Math.random() - 0.5) * 2;
                break;
            default:
                y = 0;
        }
        
        drawnPoints.push({x: x, y: y});
    }
    
    redrawCanvas();
    redoStack = [];
}

// 平滑处理
function smoothWaveform() {
    if (drawnPoints.length < 3) return;
    
    saveState();
    
    // 简单的移动平均平滑
    const smoothedPoints = [];
    const windowSize = 3;
    
    for (let i = 0; i < drawnPoints.length; i++) {
        let sum = 0;
        let count = 0;
        
        for (let j = Math.max(0, i - windowSize); j <= Math.min(drawnPoints.length - 1, i + windowSize); j++) {
            sum += drawnPoints[j].y;
            count++;
        }
        
        smoothedPoints.push({
            x: drawnPoints[i].x,
            y: sum / count
        });
    }
    
    drawnPoints = smoothedPoints;
    redrawCanvas();
    redoStack = [];
}

// 保存状态（用于撤销）
function saveState() {
    undoStack.push(JSON.parse(JSON.stringify(drawnPoints)));
    if (undoStack.length > 50) { // 限制撤销栈大小
        undoStack.shift();
    }
}

// 撤销
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(JSON.parse(JSON.stringify(drawnPoints)));
        drawnPoints = undoStack.pop();
        redrawCanvas();
    }
}

// 重做
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.parse(JSON.stringify(drawnPoints)));
        drawnPoints = redoStack.pop();
        redrawCanvas();
    }
}

// 生成信号数据
async function generateSignalData() {
    if (drawnPoints.length === 0) {
        alert('请先绘制波形！');
        return;
    }
    
    try {
        const sampleCount = parseInt(sampleCountSelect.value);
        const periods = getCurrentPeriods();
        
        console.log(`开始生成信号数据: ${sampleCount}个采样点, ${periods}个周期`);
        
        // 禁用生成按钮，显示进度
        generateSignalBtn.disabled = true;
        generateSignalBtn.textContent = '生成中...';
        
        // 对绘制的点进行排序和插值
        drawnPoints.sort((a, b) => a.x - b.x);
        
        signalData = [];
        
        // 添加进度显示，避免UI阻塞
        console.log('开始生成信号数据...');
        
        // 分批处理大数据量
        const batchSize = 100000; // 每批处理10万个样本
        
        for (let batch = 0; batch < Math.ceil(sampleCount / batchSize); batch++) {
            const start = batch * batchSize;
            const end = Math.min(start + batchSize, sampleCount);
            
            for (let i = start; i < end; i++) {
                // 计算当前采样点在周期中的位置
                const phasePosition = ((i / sampleCount) * periods) % 1;
                
                // 在绘制点中插值
                const interpolatedValue = interpolateValue(phasePosition);
                signalData.push(interpolatedValue);
            }
            
            // 更新进度
            const progress = ((end / sampleCount) * 100).toFixed(1);
            generateSignalBtn.textContent = `生成中... ${progress}%`;
            console.log(`生成进度: ${progress}%`);
            
            // 让UI有机会更新
            if (batch % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        // 转换为DAC数据
        generateSignalBtn.textContent = '转换DAC数据...';
        convertToDAC();
        
        // 更新预览和统计
        generateSignalBtn.textContent = '更新预览...';
        updatePreview();
        updateStats();
        drawPreview();
        
        // 启用下载按钮
        downloadTxtBtn.disabled = false;
        downloadBinBtn.disabled = false;
        downloadCsvBtn.disabled = false;
        
        // 恢复按钮状态
        generateSignalBtn.disabled = false;
        generateSignalBtn.textContent = '生成信号数据';
        
        console.log(`信号生成完成: ${signalData.length}个样本`);
        
        // 安全地计算DAC数据范围（避免栈溢出）
        let minDac = dacData[0];
        let maxDac = dacData[0];
        for (let i = 1; i < Math.min(dacData.length, 1000); i++) {
            minDac = Math.min(minDac, dacData[i]);
            maxDac = Math.max(maxDac, dacData[i]);
        }
        console.log(`DAC数据范围: ${minDac} ~ ${maxDac}`);
        
    } catch (error) {
        console.error('生成信号失败:', error);
        alert('生成信号失败: ' + error.message);
        
        // 恢复按钮状态
        generateSignalBtn.disabled = false;
        generateSignalBtn.textContent = '生成信号数据';
    }
}

// 插值函数
function interpolateValue(position) {
    if (drawnPoints.length === 0) return 0;
    if (drawnPoints.length === 1) return drawnPoints[0].y;
    
    // 线性插值
    for (let i = 0; i < drawnPoints.length - 1; i++) {
        const p1 = drawnPoints[i];
        const p2 = drawnPoints[i + 1];
        
        if (position >= p1.x && position <= p2.x) {
            const t = (position - p1.x) / (p2.x - p1.x);
            return p1.y + t * (p2.y - p1.y);
        }
    }
    
    // 如果超出范围，返回最近的点
    if (position < drawnPoints[0].x) {
        return drawnPoints[0].y;
    } else {
        return drawnPoints[drawnPoints.length - 1].y;
    }
}

// 转换为DAC数据（使用5-250范围）
function convertToDAC() {
    dacData = [];
    
    // 设置输出范围：最小值5，最大值250
    const minOutput = 5;
    const maxOutput = 250;
    const outputRange = maxOutput - minOutput; // 245
    
    for (let i = 0; i < signalData.length; i++) {
        // 将信号范围从[-1, 1]映射到[minOutput, maxOutput]
        let dacValue = Math.round(minOutput + (signalData[i] + 1) / 2 * outputRange);
        dacValue = Math.max(minOutput, Math.min(maxOutput, dacValue)); // 限制范围
        
        dacData.push(dacValue);
    }
}

// 更新周期数输入
function updatePeriodsInput() {
    const selectedValue = waveformPeriodsSelect.value;
    
    if (selectedValue === 'custom') {
        customPeriodsInput.style.display = 'block';
        customPeriodsInput.focus();
    } else {
        customPeriodsInput.style.display = 'none';
    }
}

// 获取当前周期数
function getCurrentPeriods() {
    const selectedValue = waveformPeriodsSelect.value;
    
    if (selectedValue === 'custom') {
        return parseInt(customPeriodsInput.value) || 1;
    } else {
        return parseInt(selectedValue);
    }
}

// 更新预览模式
function updatePreviewMode() {
    const mode = previewModeSelect.value;
    
    if (mode === 'partial') {
        partialControlsDiv.style.display = 'flex';
    } else {
        partialControlsDiv.style.display = 'none';
    }
    
    if (signalData.length > 0) {
        drawPreview();
    }
}

// 绘制预览
function drawPreview() {
    if (signalData.length === 0) {
        clearPreviewCanvas();
        return;
    }
    
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    
    previewCtx.clearRect(0, 0, width, height);
    
    // 绘制网格
    drawGrid(previewCtx, previewCanvas);
    
    // 绘制边界
    drawBoundaries(previewCtx, previewCanvas);
    
    const mode = previewModeSelect.value;
    let startIndex, endIndex, displayPoints;
    
    if (mode === 'full') {
        // 全部波形显示 - 使用抽点方式
        const maxDisplayPoints = Math.min(width, 2000); // 最多显示2000个点
        const step = Math.max(1, Math.floor(signalData.length / maxDisplayPoints));
        
        previewCtx.strokeStyle = '#e74c3c';
        previewCtx.lineWidth = 1.5;
        previewCtx.beginPath();
        
        for (let i = 0; i < signalData.length; i += step) {
            const x = (i / signalData.length) * width;
            const y = (1 - signalData[i]) / 2 * height;
            
            if (i === 0) {
                previewCtx.moveTo(x, y);
            } else {
                previewCtx.lineTo(x, y);
            }
        }
        
        previewCtx.stroke();
        
        // 更新信息显示
        const sampleRate = parseInt(sampleRateInput.value);
        const duration = (signalData.length / sampleRate * 1000).toFixed(1);
        const samplingInfo = step > 1 ? ` (抽点: 1/${step})` : '';
        previewInfoSpan.textContent = 
            `完整波形预览${samplingInfo} - 总时长: ${duration}ms, 总采样点: ${(signalData.length/1000000).toFixed(1)}M`;
            
    } else {
        // 部分波形显示 - 详细显示
        const offset = parseFloat(previewOffsetRange.value) / 100;
        displayPoints = Math.min(signalData.length, 5000); // 最多显示5K点
        startIndex = Math.floor(offset * (signalData.length - displayPoints));
        endIndex = Math.min(startIndex + displayPoints, signalData.length);
        
        // 绘制信号
        previewCtx.strokeStyle = '#e74c3c';
        previewCtx.lineWidth = 2;
        previewCtx.beginPath();
        
        for (let i = startIndex; i < endIndex; i++) {
            const x = ((i - startIndex) / (endIndex - startIndex)) * width;
            const y = (1 - signalData[i]) / 2 * height;
            
            if (i === startIndex) {
                previewCtx.moveTo(x, y);
            } else {
                previewCtx.lineTo(x, y);
            }
        }
        
        previewCtx.stroke();
        
        // 更新信息显示
        const sampleRate = parseInt(sampleRateInput.value);
        const startTime = (startIndex / sampleRate * 1000).toFixed(2);
        const endTime = (endIndex / sampleRate * 1000).toFixed(2);
        previewInfoSpan.textContent = 
            `详细预览: ${startIndex}-${endIndex} (时间: ${startTime}-${endTime}ms)`;
    }
}

// 清空预览画布
function clearPreviewCanvas() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    drawGrid(previewCtx, previewCanvas);
    drawBoundaries(previewCtx, previewCanvas);
    previewInfoSpan.textContent = '生成信号后显示完整波形预览';
}

// 更新预览偏移
function updatePreviewOffset() {
    const offset = previewOffsetRange.value;
    previewOffsetValueSpan.textContent = offset + '%';
    if (signalData.length > 0) {
        drawPreview();
    }
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
}

// 更新统计信息
function updateStats() {
    const sampleCountSpan = document.getElementById('sampleCountStat');
    const signalDurationSpan = document.getElementById('signalDuration');
    const fileSizeSpan = document.getElementById('fileSize');
    const avgValueSpan = document.getElementById('avgValue');
    const maxValueSpan = document.getElementById('maxValue');
    const minValueSpan = document.getElementById('minValue');
    
    const sampleCount = parseInt(sampleCountSelect.value);
    const sampleCountText = sampleCount >= 1000000 ? 
        `${(sampleCount / 1000000).toFixed(1)}M` : 
        `${(sampleCount / 1000).toFixed(0)}K`;
    
    sampleCountSpan.textContent = sampleCountText;
    
    if (dacData.length === 0) {
        signalDurationSpan.textContent = '-';
        fileSizeSpan.textContent = '-';
        avgValueSpan.textContent = '-';
        maxValueSpan.textContent = '-';
        minValueSpan.textContent = '-';
        return;
    }
    
    const sampleRate = parseInt(sampleRateInput.value);
    const duration = (sampleCount / sampleRate * 1000).toFixed(1);
    
    // 安全地计算统计值（避免栈溢出）
    let sum = 0;
    let maxValue = dacData[0];
    let minValue = dacData[0];
    
    // 使用循环而非展开运算符来避免栈溢出
    for (let i = 0; i < dacData.length; i++) {
        sum += dacData[i];
        maxValue = Math.max(maxValue, dacData[i]);
        minValue = Math.min(minValue, dacData[i]);
    }
    
    const avgValue = Math.round(sum / dacData.length);
    const fileSizeMB = (sampleCount / (1024 * 1024)).toFixed(1);
    
    signalDurationSpan.textContent = `${duration}ms`;
    fileSizeSpan.textContent = `${fileSizeMB}MB`;
    avgValueSpan.textContent = avgValue;
    maxValueSpan.textContent = maxValue;
    minValueSpan.textContent = minValue;
}

// 下载文件
function downloadFile(format) {
    if (dacData.length === 0) {
        alert('请先生成信号数据！');
        return;
    }
    
    const fileName = fileNameInput.value || 'custom_waveform';
    let content, mimeType, extension;
    
    switch (format) {
        case 'txt':
            content = dacData.join('\n');
            mimeType = 'text/plain';
            extension = 'txt';
            break;
            
        case 'bin':
            const buffer = new ArrayBuffer(dacData.length);
            const uint8Array = new Uint8Array(buffer);
            for (let i = 0; i < dacData.length; i++) {
                uint8Array[i] = dacData[i];
            }
            content = uint8Array;
            mimeType = 'application/octet-stream';
            extension = 'bin';
            break;
            
        case 'csv':
            content = 'Sample,DAC_Value,Time_ms\n';
            const sampleRate = parseInt(sampleRateInput.value);
            for (let i = 0; i < dacData.length; i++) {
                const timeMs = (i / sampleRate * 1000).toFixed(6);
                content += `${i},${dacData[i]},${timeMs}\n`;
            }
            mimeType = 'text/csv';
            extension = 'csv';
            break;
            
        default:
            return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    console.log(`下载${extension.toUpperCase()}文件: ${fileName}.${extension}, 大小: ${(blob.size/1024/1024).toFixed(2)}MB`);
}
