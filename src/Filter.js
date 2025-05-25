export default class Filter {
    constructor(ctx, width, height, dpr = 1) {
        this.ctx = ctx
        this.width = width * dpr // Scale width by dpr
        this.height = height * dpr // Scale height by dpr
        this.dpr = dpr // Store the dpr for pixel adjustments
    }

    applyChromaticAberration(offset = 3) {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height)
        const data = imageData.data
        const width = this.width
        const height = this.height

        // Create a copy for each channel
        const red = new Uint8ClampedArray(data)
        const green = new Uint8ClampedArray(data)
        const blue = new Uint8ClampedArray(data)

        // Shift channels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4

                // Red channel: shift right
                const rx = Math.min(width - 1, x + offset)
                const ri = (y * width + rx) * 4
                data[i] = red[ri]

                // Green channel: shift left
                const gx = Math.max(0, x - offset)
                const gi = (y * width + gx) * 4
                data[i + 1] = green[gi + 1]

                // Blue channel: shift down
                const by = Math.min(height - 1, y + offset)
                const bi = (by * width + x) * 4
                data[i + 2] = blue[bi + 2]
            }
        }

        this.ctx.putImageData(imageData, 0, 0)
    }
}
