import Circle from "./Circle.js"
import * as Tone from "tone"

export default class Wave {
    constructor(
        ctx,
        points,
        clickedCircles,
        circleRadius,
        opacity,
        deepSynth,
        glowBlur,
        glowColor,
        hoverTriggerCooldown
    ) {
        this.ctx = ctx
        this.points = points
        this.clickedCircles = clickedCircles
        this.circleRadius = circleRadius
        this.opacity = opacity
        this.deepSynth = deepSynth
        this.glowBlur = glowBlur
        this.glowColor = glowColor
        this.hoverTriggerCooldown = hoverTriggerCooldown
        this.lastHoverTriggerTime = 0

        this.popCompressor = new Tone.Compressor({
            threshold: -24,
            ratio: 4,
            attack: 0.03,
            release: 0.25,
        })
        this.popLimiter = new Tone.Limiter(0)
        this.popReverb = new Tone.Reverb({
            decay: 2,
            wet: 0.2,
        })

        // Connect
        this.popPlayer = new Tone.Player({
            url: "/sounds/Pop_01.mp3",
            autostart: false,
        })
            .connect(this.popCompressor)
            .connect(this.popLimiter)
            .connect(this.popReverb)
            .toDestination()

        // Track which pairs have already triggered the pop
        this.intersectedPairs = new Set()
    }

    drawWave(mouseX, mouseY) {
        const newCircle = new Circle(
            mouseX,
            mouseY,
            this.circleRadius,
            "rgb(255, 255, 255)",
            this.opacity,
            false,
            3,
            300
        )
        this.clickedCircles.push(newCircle)

        // Deep sound
        const randomFrequency = Math.random() * 50 + 100
        this.deepSynth.triggerAttackRelease(randomFrequency, "2n")
    }

    setRepulsionForce() {
        // Draw waves and remove expired ones
        this.clickedCircles = this.clickedCircles.filter((circle) => {
            if (!circle.hitPoints) {
                circle.hitPoints = new Set()
            }

            circle.draw(this.ctx)

            // Trigger repulsion wave for points in the wave radius
            this.points.forEach((point, index) => {
                const dx = point.x - circle.x
                const dy = point.y - circle.y
                const distance = Math.sqrt(dx ** 2 + dy ** 2)

                if (distance < circle.radius && !circle.hitPoints.has(index)) {
                    // Mark the point as affected
                    circle.hitPoints.add(index)

                    // Calculate age
                    const waveAge = 300 - circle.lifetime

                    // Scale the force compared to the age
                    const waveAgeFactor = 1 - waveAge / 300

                    const normalizedDistance = distance / circle.radius
                    const distanceFactor = Math.max(
                        0.2,
                        1 - normalizedDistance ** 2
                    )

                    let forceMagnitude = waveAgeFactor * distanceFactor * 70

                    // Threshold
                    const maxForce = 20
                    forceMagnitude = Math.min(forceMagnitude, maxForce)

                    // Apply repulsion force
                    point.repulsionForce.x += (dx / distance) * forceMagnitude
                    point.repulsionForce.y += (dy / distance) * forceMagnitude

                    point.radius = 20

                    setTimeout(() => {
                        point.isFilled = false
                    }, 500)
                }
            })

            return circle.lifetime > 0
        })

        // Fade the repulsion force for each point
        this.points.forEach((point) => {
            point.repulsionForce.x *= 0.95
            point.repulsionForce.y *= 0.95
            point.x += point.repulsionForce.x
            point.y += point.repulsionForce.y
        })
    }

    drawIntersection(
        triggerPoint,
        hoverTriggerCooldown,
        lastHoverTriggerTime,
        setIntersectionChordState
    ) {
        // Detect intersections between waves
        for (let i = 0; i < this.clickedCircles.length; i++) {
            for (let j = i + 1; j < this.clickedCircles.length; j++) {
                const c1 = this.clickedCircles[i]
                const c2 = this.clickedCircles[j]
                const dx = c2.x - c1.x
                const dy = c2.y - c1.y
                const d = Math.sqrt(dx * dx + dy * dy)

                // Unique key for this pair
                const pairKey = `${i},${j}`

                // Check if wave intersect
                if (
                    d < c1.radius + c2.radius &&
                    d > Math.abs(c1.radius - c2.radius)
                ) {
                    // Trigger pop sound
                    if (!this.intersectedPairs.has(pairKey)) {
                        const intersectionRadius = c1.lifetime * 0.2
                        const maxIntersectionRadius = 60
                        const minDb = -15
                        const maxDb = 5
                        const ratio = Math.max(
                            0,
                            Math.min(
                                1,
                                intersectionRadius / maxIntersectionRadius
                            )
                        )
                        this.popPlayer.volume.value =
                            minDb + (maxDb - minDb) * ratio

                        if (this.popPlayer.loaded) {
                            this.popPlayer.playbackRate =
                                Math.random() * 0.8 + 0.6
                            this.popPlayer.start()
                        }
                        this.intersectedPairs.add(pairKey)
                    }

                    // Find intersection points
                    const a =
                        (c1.radius * c1.radius -
                            c2.radius * c2.radius +
                            d * d) /
                        (2 * d)
                    const h = Math.sqrt(c1.radius * c1.radius - a * a)
                    const xm = c1.x + (a * dx) / d
                    const ym = c1.y + (a * dy) / d
                    const xs1 = xm + (h * dy) / d
                    const ys1 = ym - (h * dx) / d
                    const xs2 = xm - (h * dy) / d
                    const ys2 = ym + (h * dx) / d

                    // Draw intersection circles
                    this.ctx.save()
                    this.ctx.shadowBlur = this.glowBlur
                    this.ctx.shadowColor = this.glowColor
                    this.ctx.beginPath()
                    this.ctx.arc(xs1, ys1, c1.lifetime * 0.2, 0, 2 * Math.PI)
                    this.ctx.fillStyle = "white"
                    this.ctx.fill()
                    this.ctx.beginPath()
                    this.ctx.arc(xs2, ys2, c1.lifetime * 0.2, 0, 2 * Math.PI)
                    this.ctx.fillStyle = "white"
                    this.ctx.fill()
                    this.ctx.restore()

                    const intersectionRadius = c1.lifetime * 0.2
                    const maxIntersectionRadius = 60

                    const now = Date.now()
                    if (now - lastHoverTriggerTime < hoverTriggerCooldown) {
                        continue
                    }

                    let noteTriggered = false
                    const intersectionCenters = [
                        [xs1, ys1],
                        [xs2, ys2],
                    ]

                    for (const [ix, iy] of intersectionCenters) {
                        const hitPoint = this.points.find((point) => {
                            const pdx = point.x - ix
                            const pdy = point.y - iy
                            const pdist = Math.sqrt(pdx * pdx + pdy * pdy)
                            return pdist < intersectionRadius
                        })
                        if (hitPoint && !noteTriggered) {
                            triggerPoint(
                                hitPoint,
                                null,
                                0,
                                intersectionRadius,
                                maxIntersectionRadius,
                                "intersection"
                            )
                            setIntersectionChordState(now)
                            noteTriggered = true
                            break
                        }
                    }
                } else {
                    this.intersectedPairs.delete(pairKey)
                }
            }
        }
    }
}
