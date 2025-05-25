import BaseApp from "./BaseApp.js"
import Flower from "./Flower.js"
import Filter from "./Filter.js"

export default class App extends BaseApp {
    constructor() {
        super()

        this.flower = null // Declare a Flower instance

        this.setup()
    }

    setup() {
        // Create the Flower instance once
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
        this.ctx.clearRect(0, 0, this.width, this.height) // Clear the canvas
        // this.ctx.fillStyle = "rgba(0, 0, 0, 1)"
        // this.ctx.fillRect(0, 0, this.width, this.height)

        // // Create a gradient from black to grey
        // const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
        // gradient.addColorStop(0, "black")
        // gradient.addColorStop(1, "grey")

        // // Fill the canvas with the gradient
        // this.ctx.fillStyle = gradient
        // this.ctx.fillRect(0, 0, this.width, this.height)

        // Reuse the existing Flower instance
        this.flower.draw()

        requestAnimationFrame(this.draw.bind(this))
    }
}
