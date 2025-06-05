import BaseApp from "./BaseApp.js"
import Flower from "./Flower.js"

export default class App extends BaseApp {
    constructor() {
        super()

        this.flower = null

        this.setup()
    }

    setup() {
        this.flower = new Flower(
            this.width / 2,
            this.height / 2,
            this.ctx,
            this.width,
            this.height
        )

        this.addEventListeners()
        this.draw()
    }

    addEventListeners() {
        this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e))
        this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e))
        this.canvas.addEventListener("mouseup", () => this.onMouseUp())
    }

    onMouseDown(event) {
        this.flower.onMouseDown(event)
    }

    onMouseMove(event) {
        this.flower.onMouseMove(event)
    }

    onMouseUp() {
        this.flower.onMouseUp()
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height)

        this.flower.draw()

        requestAnimationFrame(this.draw.bind(this))
    }
}
