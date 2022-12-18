var tool;
var tool_default = 'bucket';
var tools = {};
var canvas, ctx;
var curColor = {
    r: 0,
    g: 0,
    b: 0
};

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    width = 200;
    height = 200;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    if (tools[tool_default]) {
        tool = new tools['bucket']();
    };

    canvas.addEventListener('mousedown', ev_canvas, false);
}

function ev_canvas(ev) {
    if (ev.layerX || ev.layerX == 0) {
        ev._x = ev.layerX;
        ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) {
        ev._x = ev.offsetX;
        ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
        func(ev);
    }
}


function setColor(value) {
    var color = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
    curColor.r = parseInt(color[1], 16);
    curColor.g = parseInt(color[2], 16);
    curColor.b = parseInt(color[3], 16);
}

$(function () {
    tools.bucket = function () {
        this.mousedown = function (e) {
            var drawingBoundTop = 0;
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
    }

    init();
});