export function width() {
    const canvas = document.getElementById('mycanvas');
    return canvas.width;
}

export function height() {
    const canvas = document.getElementById('mycanvas');
    return canvas.height;
}

export function time() {
    return Date.now()
}
