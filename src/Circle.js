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

        this.baseColor = color // Store the base color
    }

    draw(ctx) {
        if (this.lifetime > 0) {
            this.lifetime -= 1 // Decrease lifetime
            this.opacity = Math.max(0, this.opacity - 0.5 / this.lifetime) // Slower fade (was 1 / this.lifetime)
        }

        if (this.growthRate > 0) {
            // console.log(this.radius)
        }

        this.radius += this.growthRate
        const colorWithOpacity = `rgba(${this.baseColor
            .match(/\d+/g)
            .join(", ")}, ${this.opacity})` // Combine base color with opacity
        ctx.fillStyle = colorWithOpacity
        ctx.strokeStyle = colorWithOpacity
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        this.isFilled ? ctx.fill() : ctx.stroke()
    }
}
