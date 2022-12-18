const canvas = document.querySelector("canvas"),
toolBtns = document.querySelectorAll(".tool"),
fillColor = document.querySelector("#fill-color"),
sizeSlider = document.querySelector("#size-slider"),
colorBtns = document.querySelectorAll(".colors .option"),
colorPicker = document.querySelector("#color-picker"),
clearCanvas = document.querySelector("#clear-canvas"),
saveImg = document.querySelector("#save-image"),
frontColor = document.querySelector(".front-color"),
backColor = document.querySelector(".back-color"),
ctx = canvas.getContext("2d", { willReadFrequently: true });

let prevMouseX, prevMouseY, snapshot,
isDrawing = false,
isTyping = false,
isFrontColorSelected = true,
isBackColorSelected = false,
selectedTool = "pencil",
brushWidth = 1,
font = '14px sans-serif',
hasInput = false,
selectedColor = "#fa81c9",
fcolor = "#fa81c9",
bcolor = "#fff";

var curColor = {
    r: 0,
    g: 0,
    b: 0
};

var mouse = {x: 0, y: 0};

canvas.addEventListener('mousemove', function(e) {
    mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
    mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
}, false);

canvas.onclick = (e) => {
    if (hasInput) return;
    if (!isTyping) return;
    addInput(e.clientX, e.clientY);
}

function addInput(x, y) {
    var input = document.createElement('input');

    input.type = 'text';
    input.style.position = 'fixed';
    input.style.border = '1px dashed gray';
    input.style.padding = '5px';
    input.style.left = (x - 4) + 'px';
    input.style.top = (y - 4) + 'px';

    input.onkeydown = handleEnter;
    document.body.appendChild(input);
    input.focus();
    hasInput = true;
}

function handleEnter(e) {
    var keyCode = e.keyCode;
    if (keyCode === 13) {
        drawText(this.value, parseInt(this.style.left, 10), parseInt(this.style.top, 10));
        document.body.removeChild(this);
        hasInput = false;
    }
}

function drawText(txt, x, y) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = font;
    var x = mouse.x;
    var y = mouse.y;

    ctx.fillText(txt, x, y );
    isTyping = false;
}

const setCanvasBackground = () => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setCanvasBackground();
});

const drawRect = (e) => {
    ctx.beginPath();
    ctx.rect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
    ctx.fillStyle = bcolor; 
    ctx.strokeStyle = fcolor;
    ctx.lineWidth = 3;
    ctx.fill();  
    ctx.stroke();
}

const drawCircle = (e) => {
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2))
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = bcolor; 
    ctx.strokeStyle = fcolor;
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
}

const drawPolygon = (e) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
    ctx.closePath();
    
    ctx.fillStyle = bcolor; 
    ctx.strokeStyle = fcolor;
    ctx.lineWidth = 3;
    ctx.fill();  
    ctx.stroke();
}

const drawLine = (e) => {
    console.log('line')
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

const drawRecborder = (e) => {
    ctx.beginPath();
    ctx.roundRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY, 10);
    ctx.fillStyle = bcolor; 
    ctx.strokeStyle = fcolor;
    ctx.lineWidth = 3;
    ctx.fill();  
    ctx.stroke();
}

var getRandomOffset = (radius) => {
    var random_angle = Math.random() * (2 * Math.PI);
    var random_radius = Math.random() * radius;
    
    return {
        x: Math.cos(random_angle) * random_radius,
        y: Math.sin(random_angle) * random_radius
    };
};

const drawSpray = (e) => {
    ctx.beginPath()
    var density = 50;
		
    for (var i = 0; i < density; i++) {
        var offset = getRandomOffset(10);
        var x = mouse.x + offset.x;
        var y = mouse.y + offset.y;
        ctx.fillRect(x, y, 1, 1);
    }
};

const paintBucket = (e) => {
    console.log('paint')
    var drawingBoundTop = 0;
    var width = canvas.width;
    var height = canvas.height;
    var imageData = ctx.getImageData(0, 0, width, height);
    pixelStack = [
        [e._x, e._y]
    ];

    while (pixelStack.length) {
        var newPos, x, y, pixelPos, reachLeft, reachRight;
        newPos = pixelStack.pop();
        x = newPos[0];
        y = newPos[1];

        pixelPos = (y * width + x) * 4;
        while (y-- >= drawingBoundTop && matchStartColor(pixelPos)) {
            pixelPos -= width * 4;
        }
        pixelPos += width * 4;
        ++y;
        reachLeft = false;
        reachRight = false;
        while (y++ < height - 1 && matchStartColor(pixelPos)) {
            colorPixel(pixelPos);

            if (x > 0) {
                if (matchStartColor(pixelPos - 4)) {
                    if (!reachLeft) {
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < width - 1) {
                if (matchStartColor(pixelPos + 4)) {
                    if (!reachRight) {
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }

            pixelPos += width * 4;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    function matchStartColor(pixelPos) {
        var r = imageData.data[pixelPos];
        var g = imageData.data[pixelPos + 1];
        var b = imageData.data[pixelPos + 2];

        return (r !== curColor.r || g !== curColor.g || b !== curColor.b);
    }

    function colorPixel(pixelPos) {
        imageData.data[pixelPos] = curColor.r;
        imageData.data[pixelPos + 1] = curColor.g;
        imageData.data[pixelPos + 2] = curColor.b;
        imageData.data[pixelPos + 3] = 255;
    }
}

function setColor(value) {
    var color = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
    curColor.r = parseInt(color[1], 16);
    curColor.g = parseInt(color[2], 16);
    curColor.b = parseInt(color[3], 16);
}

const startDraw = (e) => {
    isDrawing = true;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
    ctx.beginPath(); //without this, the stroke follow cursor pointer click
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = fcolor;
    ctx.fillStyle = fcolor;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

const drawing = (e) => {
    if (!isDrawing) return;
    ctx.putImageData(snapshot,0,0)

    if (selectedTool === "brush" || selectedTool === "eraser") {
        brushWidth = 5;
        ctx.strokeStyle = selectedTool === "eraser" ? '#fff' : fcolor;
        ctx.lineTo(e.offsetX, e.offsetY);
    } else if (selectedTool === "rectangle") {
        drawRect(e);
    } else if (selectedTool === "circle") {
        drawCircle(e);
    } else if (selectedTool === "triangle") {
        drawTriangle(e);
    } else if (selectedTool === "pencil") {
       
        brushWidth = 1;
        console.log(selectedTool)
        console.log(brushWidth)
        ctx.strokeStyle =  fcolor;
        ctx.lineTo(e.offsetX, e.offsetY);
    } else if (selectedTool === "line") {
        drawLine(e);
    } else if (selectedTool === "polygon") {
        drawPolygon(e);
    } else if (selectedTool === "recborder") {
        drawRecborder(e);
    } else if (selectedTool === "text") {
        isTyping = true;
    } else if (selectedTool === "spray") {
        drawSpray(e)
    } else if (selectedTool === "bucket") {
        setColor(fcolor);

       // paintBucket(e);
        canvas.addEventListener('mousedown', paintBucket(e), false);
    }
    ctx.stroke();
   
}

toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .active").classList.remove("active");
        selectedTool = btn.id;
        btn.classList.add("active");
    })
})

// sizeSlider.addEventListener("change", () => brushWidth = sizeSlider.value);

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");

        if (isFrontColorSelected) {
            frontColor.style.backgroundColor = selectedColor;
            fcolor = selectedColor;
        }

        if (isBackColorSelected) {
            backColor.style.backgroundColor = selectedColor;
            bcolor = selectedColor;
        }
    })
});

colorPicker.addEventListener("change", () => {
    if (isFrontColorSelected) {
        frontColor.style.backgroundColor = colorPicker.value;
        fcolor = colorPicker.value;
    }

    if (isBackColorSelected) {
        backColor.style.backgroundColor = colorPicker.value;
        bcolor = colorPicker.value;
    }
    colorPicker.parentElement.click();
})

frontColor.addEventListener("click", () => {
    isFrontColorSelected = true;
    isBackColorSelected = false;
});

backColor.addEventListener("click", () => {
    isFrontColorSelected = false;
    isBackColorSelected = true;
});

clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBackground();
});

saveImg.addEventListener("click", () => {
    const link = document.createElement('a');
    link.download = `${Date.now()}-made-in-sawa-studio.jpg`;
    link.href = canvas.toDataURL();
    link.click();
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);
