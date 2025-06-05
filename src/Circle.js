export default class Circle {
    constructor(
        x,
        y,
        radius,
        color = "rgb(255, 255, 255)",
        opacity = 1,
        isFilled = false,
        growthRate = 0,
        lifetime = Infinity
    ) {
        this.x = x
        this.y = y
        this.radius = radius
        this.opacity = opacity
        this.isFilled = isFilled
        this.growthRate = growthRate
        this.lifetime = lifetime

        this.baseColor = color
    }

    draw(ctx) {
        this.radius += this.growthRate
        const colorWithOpacity = `rgba(${this.baseColor
            .match(/\d+/g)
            .join(", ")}, ${this.opacity})`
        ctx.fillStyle = colorWithOpacity
        ctx.strokeStyle = colorWithOpacity
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        this.isFilled ? ctx.fill() : ctx.stroke()
    }
}
