export default class BaseApp {
    constructor() {
        this.createCanvas()
    }

    createCanvas(width = window.innerWidth, height = window.innerHeight) {
        const dpr = window.devicePixelRatio || 1
        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")
        this.width = width
        this.height = height
        this.canvas.width = width * dpr
        this.canvas.height = height * dpr
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`
        this.ctx.scale(dpr, dpr)
        document.body.appendChild(this.canvas)
    }
}
