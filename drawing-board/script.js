// Canvas setup
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Drawing state
let currentTool = 'pencil';
let drawingHistory = [];
let historyStep = -1;

// DOM Elements
const colorPicker = document.getElementById('colorPicker');
const colorPreview = document.getElementById('colorPreview');
const brushSize = document.getElementById('brushSize');
const brushPreview = document.getElementById('brushPreview');
const pencilTool = document.getElementById('pencilTool');
const eraserTool = document.getElementById('eraserTool');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

// Initialize
function init() {
    resizeCanvas();
    setupEventListeners();
    updateColorPreview();
    updateBrushPreview();
    saveCanvasState();
}

// Event Listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', resizeCanvas);

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    // Tool selection
    pencilTool.addEventListener('click', () => setTool('pencil'));
    eraserTool.addEventListener('click', () => setTool('eraser'));

    // Color picker
    colorPicker.addEventListener('input', () => {
        updateColorPreview();
        if (currentTool === 'pencil') {
            ctx.strokeStyle = colorPicker.value;
        }
    });

    // Brush size
    brushSize.addEventListener('input', () => {
        ctx.lineWidth = brushSize.value;
        updateBrushPreview();
    });

    // Buttons
    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveDrawing);
}

// Canvas Management
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = window.innerHeight * 0.6;
    
    // Restore canvas state after resize
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
}

function saveCanvasState() {
    // Remove any states after current step if we're in middle of history
    drawingHistory = drawingHistory.slice(0, historyStep + 1);
    // Add current state to history
    drawingHistory.push(canvas.toDataURL());
    historyStep++;
    undoBtn.disabled = historyStep === 0;
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        const img = new Image();
        img.src = drawingHistory[historyStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        undoBtn.disabled = historyStep === 0;
    }
}

// Drawing Functions
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function draw(e) {
    if (!isDrawing) return;

    const [currentX, currentY] = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveCanvasState();
    }
}

// Tool Management
function setTool(tool) {
    currentTool = tool;
    ctx.strokeStyle = tool === 'pencil' ? colorPicker.value : '#ffffff';
    
    // Update UI
    pencilTool.classList.toggle('active', tool === 'pencil');
    eraserTool.classList.toggle('active', tool === 'eraser');
}

function updateColorPreview() {
    colorPreview.style.backgroundColor = colorPicker.value;
}

function updateBrushPreview() {
    const size = Math.min(Math.max(brushSize.value / 2, 2), 15);
    brushPreview.style.setProperty('--size', `${size}px`);
    brushPreview.querySelector('::after').style.width = `${size}px`;
    brushPreview.querySelector('::after').style.height = `${size}px`;
}

// Utility Functions
function getCoordinates(e) {
    let x, y;
    
    if (e.type.includes('touch')) {
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    
    return [x, y];
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

function saveDrawing() {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Initialize the app
init(); 