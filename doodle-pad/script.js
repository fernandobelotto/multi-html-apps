const canvas = document.getElementById('doodleCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brushStyle = document.getElementById('brushStyle');
const clearButton = document.getElementById('clearCanvas');
const eraserButton = document.getElementById('eraser');
const pencilButton = document.getElementById('pencil');
const randomColorButton = document.getElementById('randomColor');
const saveButton = document.getElementById('save');

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
let hue = 0;

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

randomColorButton.addEventListener('click', () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    colorPicker.value = randomColor;
    currentColor = randomColor;
    isEraser = false;
    updateButtons();
});

saveButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'doodle.png';
    link.href = canvas.toDataURL();
    link.click();
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
    
    switch(brushStyle.value) {
        case 'round':
            drawRoundBrush(currentX, currentY);
            break;
        case 'square':
            drawSquareBrush(currentX, currentY);
            break;
        case 'rainbow':
            drawRainbowBrush(currentX, currentY);
            break;
        case 'pattern':
            drawPatternBrush(currentX, currentY);
            break;
    }

    [lastX, lastY] = [currentX, currentY];
}

function drawRoundBrush(x, y) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawSquareBrush(x, y) {
    const size = brushSize.value;
    ctx.fillStyle = isEraser ? '#ffffff' : currentColor;
    ctx.fillRect(x - size/2, y - size/2, size, size);
}

function drawRainbowBrush(x, y) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    hue = (hue + 1) % 360;
    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawPatternBrush(x, y) {
    const size = brushSize.value;
    const shapes = ['circle', 'star', 'heart'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    ctx.fillStyle = isEraser ? '#ffffff' : currentColor;
    
    switch(shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'star':
            drawStar(x, y, 5, size/2, size/4);
            break;
        case 'heart':
            drawHeart(x, y, size/2);
            break;
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for(let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3/4, x, y + size);
    ctx.bezierCurveTo(x, y + size * 3/4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
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