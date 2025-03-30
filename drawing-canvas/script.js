const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const clearButton = document.getElementById('clearCanvas');
const eraserButton = document.getElementById('eraser');
const pencilButton = document.getElementById('pencil');

// Set canvas size
function setCanvasSize() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.7;
}

setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = colorPicker.value;
let isEraser = false;

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDrawing);

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    isEraser = false;
    updateButtons();
});

brushSize.addEventListener('input', (e) => {
    brushSizeValue.textContent = `${e.target.value}px`;
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

eraserButton.addEventListener('click', () => {
    isEraser = true;
    updateButtons();
});

pencilButton.addEventListener('click', () => {
    isEraser = false;
    currentColor = colorPicker.value;
    updateButtons();
});

function updateButtons() {
    eraserButton.classList.toggle('active', isEraser);
    pencilButton.classList.toggle('active', !isEraser);
}

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
    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.stroke();

    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    isDrawing = false;
}

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

function handleTouch(e) {
    e.preventDefault();
    const touch = e.type === 'touchstart' ? startDrawing : draw;
    touch(e);
} 