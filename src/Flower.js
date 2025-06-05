import * as Tone from "tone"
import Circle from "./Circle.js"

export default class Flower {
    constructor(x, y, ctx, width, height) {
        this.x = x
        this.y = y
        this.ctx = ctx
        this.width = width
        this.height = height

        this.opacity = 1

        this.points = []
        this.originalPoints = []
        this.clickedCircles = []
        this.hoverRadius = 30

        this.scale = [
            "D1",
            "E1",
            "F1",
            "G1",
            "A1",
            "B1",
            "C2",
            "D2",
            "E2",
            "F2",
            "G2",
            "A2",
            "B2",
            "C3",
            "D3",
            "E3",
            "F3",
            "G3",
            "A3",
            "B3",
        ]

        this.Cmaj7 = ["C2", "E2", "G2", "B2"]
        this.Am7 = ["A2", "C2", "E2", "G2"]
        this.Dm7 = ["D2", "F2", "A2", "C2"]
        this.G7 = ["G2", "B2", "D2", "F2"]

        this.randomChords = [this.Cmaj7, this.Am7, this.Dm7, this.G7] // for random notes
        this.hoverChords = [this.Am7, this.Dm7, this.Cmaj7, this.G7] // for hover
        this.intersectionChords = [this.Cmaj7, this.Am7, this.Dm7, this.G7] // for intersection

        // State for random chords
        this.currentRandomChordIndex = 0
        this.currentRandomChord =
            this.randomChords[this.currentRandomChordIndex]
        this.currentRandomNoteIndex = 0

        // State for hover chords
        this.currentHoverChordIndex = 0
        this.currentHoverChord = this.hoverChords[this.currentHoverChordIndex]
        this.currentHoverNoteIndex = 0

        // State for intersection chord
        this.currentIntersectionChordIndex = 0
        this.currentIntersectionChord =
            this.intersectionChords[this.currentIntersectionChordIndex]
        this.currentIntersectionNoteIndex = 0

        this.lastHoverTriggerTime = 0
        this.hoverTriggerCooldown = 100

        this.bpm = 240
        this.playingPoint = 1

        this.echelle = 30
        this.echelleOscillationSpeed = 0.01
        this.time = 0

        this.glowBlur = 100
        this.glowColor = "rgba(255, 255, 255, 1)"

        this.setup()
    }

    setup() {
        // Hover sampler
        this.hoverSampler = new Tone.Sampler({
            urls: {
                A2: "Another_Dimension_A2.mp3",
                B2: "Another_Dimension_B2.mp3",
                C2: "Another_Dimension_C2.mp3",
                C3: "Another_Dimension_C3.mp3",
                D2: "Another_Dimension_D2.mp3",
                D3: "Another_Dimension_D3.mp3",
                E2: "Another_Dimension_E2.mp3",
                F2: "Another_Dimension_F2.mp3",
                G2: "Another_Dimension_G2.mp3",
            },
            release: 1,
            baseUrl: "/sounds/",
        })

        // Random sampler
        this.randomSampler = new Tone.Sampler({
            urls: {
                C2: "Midnight_Mallets_C2.mp3",
                D2: "Midnight_Mallets_D2.mp3",
                E2: "Midnight_Mallets_E2.mp3",
                F2: "Midnight_Mallets_F2.mp3",
                G2: "Midnight_Mallets_G2.mp3",
                A2: "Midnight_Mallets_A2.mp3",
                B2: "Midnight_Mallets_B2.mp3",
                C3: "Midnight_Mallets_C3.mp3",
            },
            release: 1,
            baseUrl: "/sounds/",
        })

        // Intersection Sampler
        this.intersectionSampler = new Tone.Sampler({
            urls: {
                A2: "Dark_Glide_Bass_A2.mp3",
                B2: "Dark_Glide_Bass_B2.mp3",
                C2: "Dark_Glide_Bass_C2.mp3",
                C3: "Dark_Glide_Bass_C3.mp3",
                D2: "Dark_Glide_Bass_D2.mp3",
                D3: "Dark_Glide_Bass_D3.mp3",
                E2: "Dark_Glide_Bass_E2.mp3",
                F2: "Dark_Glide_Bass_F2.mp3",
                G2: "Dark_Glide_Bass_G2.mp3",
            },
            release: 1,
            baseUrl: "/sounds/",
        })

        // Reverb
        this.reverb = new Tone.Reverb({
            decay: 2,
            wet: 0.2,
        })
        // Delay
        this.delay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.15,
            wet: 0.1,
        })

        // Compressor
        this.compressor = new Tone.Compressor({
            threshold: -24,
            ratio: 4, // Compression ratio
            attack: 0.03, // Attack time in seconds
            release: 0.25, // Release time in seconds
        })

        // Limiter
        this.limiter = new Tone.Limiter(-6) // Limit the output to -6 dB

        // Connect hover sampler
        this.hoverSampler.chain(
            this.reverb,
            this.delay,
            this.compressor,
            this.limiter,
            Tone.Destination
        )

        // Connect random sampler
        this.randomSampler.chain(
            this.reverb,
            this.delay,
            this.compressor,
            this.limiter,
            Tone.Destination
        )

        // Connect intersection sampler
        this.intersectionSampler.chain(
            this.reverb,
            this.delay,
            this.compressor,
            this.limiter,
            Tone.Destination
        )

        // Oscillator
        this.oscillator = new Tone.Oscillator({
            type: "sine",
            frequency: 200,
            volume: -30,
        }).toDestination()

        this.oscillator.start()

        // Deep Synth
        this.deepSynth = new Tone.Synth({
            oscillator: {
                type: "triangle",
            },
            envelope: {
                attack: 0.3,
                decay: 0.5,
                sustain: 0.4,
                release: 2,
            },
        })

        // Deep synth reverb
        this.deepReverb = new Tone.Reverb({
            decay: 8,
            wet: 0.8,
        })

        // Deep synth Filter
        this.deepFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 80,
            rolloff: -24,
        })

        // Connect deep synth
        this.deepSynth.chain(
            this.deepReverb,
            this.deepFilter,
            this.compressor,
            this.limiter,
            Tone.Destination
        )

        // Point Visual
        this.numPoints = 200
        this.echelle = 20
        this.goldenAngle = Math.PI * (3 - Math.sqrt(5))
        this.useGoldenAngle = false
        this.customAngle = Math.random() * Math.PI * 2
        this.circleRadius = 5
        this.linearRadius = false
        this.scaleRadius = false
        this.inverseScaling = false
        this.circleOpacity = 0.5

        // Stroke
        this.pointConnectionLenght = 5

        // Forces
        this.springStrength = 0.05
        this.influenceRadius = 250
        this.attractionStrength = 0.15

        // Initialize points array
        this.initializePoints()

        // Wait for user interaction to start the Tone.Transport
        const startTransport = () => {
            Tone.start().then(() => {
                Tone.Transport.bpm.value = this.bpm
                Tone.Transport.scheduleRepeat(
                    () => this.triggerRandomPoint(),
                    "4n"
                )
                Tone.Transport.start()
            })
            window.removeEventListener("click", startTransport)
            window.removeEventListener("touchstart", startTransport)
        }

        // Add event listeners for user interaction
        window.addEventListener("click", startTransport)
        window.addEventListener("touchstart", startTransport)
    }

    initializePoints() {
        this.points = []
        this.originalPoints = []

        // Phyllotaxis flower !!!!
        for (let i = 0; i < this.numPoints; i++) {
            const angle =
                i * (this.useGoldenAngle ? this.goldenAngle : this.customAngle)
            const radius = this.linearRadius
                ? this.echelle * Math.sqrt(i)
                : 0.07 * this.echelle * i

            const x = radius * Math.cos(angle) + this.x
            const y = radius * Math.sin(angle) + this.y

            this.points.push({
                x,
                y,
                radius: this.circleRadius,
                color: "rgb(255, 255, 255)",
                isFilled: false,
                repulsionForce: { x: 0, y: 0 },
            })
            this.originalPoints.push({ x, y })
        }
    }

    triggerRandomPoint() {
        if (this.points.length === 0) return

        // Create a set to store unique random indices
        const randomIndices = new Set()

        // Select `this.playingPoint` unique random indices
        while (randomIndices.size < this.playingPoint) {
            const randomIndex = Math.floor(Math.random() * this.points.length)
            randomIndices.add(randomIndex)
        }

        // Trigger the points corresponding to the selected indices
        let delay = 0 // Initialize delay
        randomIndices.forEach((index) => {
            const randomPoint = this.points[index]
            this.triggerRandomChordPoint(randomPoint, delay)
            delay += 0.15 // Add a small delay (50ms) between each note
        })
    }

    triggerRandomChordPoint(point, delay = 0) {
        const note = this.currentRandomChord[this.currentRandomNoteIndex]
        this.currentRandomNoteIndex++
        if (this.currentRandomNoteIndex >= this.currentRandomChord.length) {
            this.currentRandomChordIndex =
                (this.currentRandomChordIndex + 1) % this.randomChords.length
            this.currentRandomChord =
                this.randomChords[this.currentRandomChordIndex]
            this.currentRandomNoteIndex = 0
        }
        // Use the randomSampler for random notes
        this.randomSampler.triggerAttackRelease(
            note,
            "4n",
            Tone.now() + delay,
            0.03
        )
        point.isFilled = true
        point.radius = 20
        setTimeout(() => {
            point.isFilled = false
        }, 500)
    }

    setBPM(newBPM) {
        this.bpm = newBPM
        Tone.Transport.bpm.value = newBPM
    }

    draw() {
        this.customAngle += 0.00002

        // Oscillate this.echelle between 15 and 25
        this.time += this.echelleOscillationSpeed
        this.echelle = 30 + 3 * Math.sin(this.time) // Oscillates between 15 and 25

        // Apply spring force to points
        this.applySpringForce()

        // Apply attraction force only if dragging
        if (this.isDragging && this.attractionPoint) {
            this.applyAttractionForce()
        }

        this.drawLines(this.points)

        // Draw all points
        this.drawPoint()

        this.drawWave()

        this.drawIntersectionPoint()

        // Gradually fade the repulsion force for each point
        this.points.forEach((point) => {
            point.repulsionForce.x *= 0.95 // Reduce the force over time
            point.repulsionForce.y *= 0.95
            point.x += point.repulsionForce.x // Apply the force to the point's position
            point.y += point.repulsionForce.y
        })
    }

    drawPoint() {
        // Gradually shrink triggered points' radius back to normal
        this.points.forEach((point, i) => {
            // Only shrink if radius is larger than normal
            if (point.radius > this.circleRadius) {
                point.radius = point.radius * 0.97 + this.circleRadius * 0.03
                if (Math.abs(point.radius - this.circleRadius) < 0.5) {
                    point.radius = this.circleRadius
                }
            }

            // --- Glow effect for triggered points ---
            if (point.isFilled) {
                this.ctx.save()
                this.ctx.shadowBlur = this.glowBlur
                this.ctx.shadowColor = this.glowColor
            }

            const circle = new Circle(
                point.x,
                point.y,
                this.scaleRadius
                    ? (this.inverseScaling
                          ? 1 - i / this.numPoints
                          : i / this.numPoints) * point.radius
                    : point.radius,
                point.color,
                this.opacity,
                point.isFilled
            )
            circle.draw(this.ctx)

            if (point.isFilled) {
                this.ctx.restore()
            }
        })
    }

    drawWave() {
        // Draw all clicked circles and remove expired ones
        this.clickedCircles = this.clickedCircles.filter((circle) => {
            if (!circle.hitPoints) {
                circle.hitPoints = new Set() // Initialize a set to track affected points
            }

            circle.draw(this.ctx)

            // Trigger repulsion wave for points within the circle's radius
            this.points.forEach((point, index) => {
                const dx = point.x - circle.x
                const dy = point.y - circle.y
                const distance = Math.sqrt(dx ** 2 + dy ** 2)

                if (distance < circle.radius && !circle.hitPoints.has(index)) {
                    // Mark the point as affected by this wave
                    circle.hitPoints.add(index)

                    // Calculate the age of the wave
                    const waveAge = 300 - circle.lifetime

                    // Scale the force magnitude inversely with the wave's age
                    const waveAgeFactor = 1 - waveAge / 300

                    // Smooth the distance factor using a quadratic function
                    const normalizedDistance = distance / circle.radius
                    const distanceFactor = Math.max(
                        0.2,
                        1 - normalizedDistance ** 2
                    ) // Quadratic falloff with a minimum threshold

                    // Combine the factors to calculate the force magnitude
                    let forceMagnitude = waveAgeFactor * distanceFactor * 70

                    // Apply a threshold to the force magnitude
                    const maxForce = 20 // Set the maximum allowed force
                    forceMagnitude = Math.min(forceMagnitude, maxForce)

                    // Apply the repulsion force
                    point.repulsionForce.x += (dx / distance) * forceMagnitude
                    point.repulsionForce.y += (dy / distance) * forceMagnitude

                    point.radius = 20

                    setTimeout(() => {
                        point.isFilled = false
                        // point.radius = this.circleRadius
                    }, 500)
                }
            })

            return circle.lifetime > 0 // Keep circles with remaining lifetime
        })
    }

    drawIntersectionPoint() {
        // --- Detect and draw intersections between waves ---
        for (let i = 0; i < this.clickedCircles.length; i++) {
            for (let j = i + 1; j < this.clickedCircles.length; j++) {
                const c1 = this.clickedCircles[i]
                const c2 = this.clickedCircles[j]
                const dx = c2.x - c1.x
                const dy = c2.y - c1.y
                const d = Math.sqrt(dx * dx + dy * dy)

                // Check if circles intersect
                if (
                    d < c1.radius + c2.radius &&
                    d > Math.abs(c1.radius - c2.radius)
                ) {
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

                    // --- Trigger only one point per intersection circle per frame ---
                    const intersectionRadius = c1.lifetime * 0.2
                    const maxIntersectionRadius = 60

                    // Check cooldown before triggering
                    const now = Date.now()
                    if (
                        now - this.lastHoverTriggerTime <
                        this.hoverTriggerCooldown
                    ) {
                        continue // Skip triggering if cooldown not elapsed
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
                            this.triggerPoint(
                                hitPoint,
                                null,
                                0,
                                intersectionRadius,
                                maxIntersectionRadius,
                                "intersection"
                            )
                            this.lastHoverTriggerTime = now // Update cooldown timestamp
                            noteTriggered = true
                            break
                        }
                    }
                }
            }
        }
    }

    triggerPoint(
        point,
        circle = null,
        delay = 0,
        intersectionRadius = null,
        maxIntersectionRadius = null,
        triggerType = "hover" // "hover" or "intersection"
    ) {
        const currentTime = Date.now()
        if (
            !point.isFilled &&
            (!point.lastTriggered || currentTime - point.lastTriggered > 1000)
        ) {
            point.isFilled = true
            point.radius = 20
            point.lastTriggered = currentTime

            let note
            if (triggerType === "hover") {
                // Pick a random chord from hoverChords
                if (
                    !this.currentHoverChord ||
                    this.currentHoverNoteIndex == null ||
                    this.currentHoverNoteIndex >= this.currentHoverChord.length
                ) {
                    const randomChordIndex = Math.floor(
                        Math.random() * this.hoverChords.length
                    )
                    this.currentHoverChord = this.hoverChords[randomChordIndex]
                    this.currentHoverNoteIndex = 0
                }
                note = this.currentHoverChord[this.currentHoverNoteIndex]
                this.currentHoverNoteIndex++
            } else if (triggerType === "intersection") {
                note =
                    this.currentIntersectionChord[
                        this.currentIntersectionNoteIndex
                    ]
                this.currentIntersectionNoteIndex++
                if (
                    this.currentIntersectionNoteIndex >=
                    this.currentIntersectionChord.length
                ) {
                    this.currentIntersectionChordIndex =
                        (this.currentIntersectionChordIndex + 1) %
                        this.intersectionChords.length
                    this.currentIntersectionChord =
                        this.intersectionChords[
                            this.currentIntersectionChordIndex
                        ]
                    this.currentIntersectionNoteIndex = 0
                }
            } else {
                note = this.scale[0] // fallback
            }

            let volume = 1
            if (intersectionRadius && maxIntersectionRadius) {
                volume = Math.max(
                    0,
                    Math.min(1, intersectionRadius / maxIntersectionRadius)
                )
            } else if (circle) {
                const dx = point.x - circle.x
                const dy = point.y - circle.y
                const distance = Math.sqrt(dx ** 2 + dy ** 2)
                const distanceFactor = distance / circle.radius
                const adjustedDistanceFactor = Math.pow(1 - distanceFactor, 10)
                volume = adjustedDistanceFactor
            }

            // Make intersection notes louder
            let volumeMultiplier = 0.1
            if (triggerType === "intersection") {
                volumeMultiplier = 0.3
            }

            // Use intersectionSampler for intersection, sampler otherwise
            const sampler =
                triggerType === "intersection"
                    ? this.intersectionSampler
                    : this.hoverSampler

            sampler.triggerAttackRelease(
                note,
                "4n",
                Tone.now() + delay,
                volume * volumeMultiplier
            )

            setTimeout(() => {
                point.isFilled = false
            }, 500)
        }
    }

    drawLines(points) {
        this.ctx.beginPath()
        for (let i = 0; i < points.length - this.pointConnectionLenght; i++) {
            const start = points[i]
            const end = points[i + this.pointConnectionLenght]
            this.ctx.moveTo(start.x, start.y)
            this.ctx.lineTo(end.x, end.y)
        }
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`
        this.ctx.stroke()
    }

    calculateDesiredPosition(index) {
        const angle =
            index * (this.useGoldenAngle ? this.goldenAngle : this.customAngle)
        const radius = this.linearRadius
            ? this.echelle * Math.sqrt(index)
            : 0.07 * this.echelle * index

        const x = radius * Math.cos(angle) + this.x
        const y = radius * Math.sin(angle) + this.y

        return { x, y }
    }

    applySpringForce() {
        let totalWeightedSpeed = 0
        let totalWeight = 0

        this.points.forEach((point, i) => {
            const desired = this.calculateDesiredPosition(i)

            // Calculate the spring force toward the desired position
            const dx = desired.x - point.x
            const dy = desired.y - point.y

            // Apply the spring force
            point.x += dx * this.springStrength
            point.y += dy * this.springStrength

            // Calculate the speed of the point
            const speed = Math.sqrt(
                Math.pow(point.x - (point.previousX || point.x), 2) +
                    Math.pow(point.y - (point.previousY || point.y), 2)
            )

            // Use the square of the speed as the weight
            const weight = speed * speed
            totalWeightedSpeed += speed * weight
            totalWeight += weight

            // Update the previous position
            point.previousX = point.x
            point.previousY = point.y
        })

        // Calculate the weighted average speed
        const weightedAverageSpeed =
            totalWeight > 0 ? totalWeightedSpeed / totalWeight : 0

        // Scale down the weighted average speed to reduce its impact
        const scaledSpeed = weightedAverageSpeed * 0.2 // Adjust the factor (e.g., 0.2) as needed

        // Map the scaled speed to a frequency range (e.g., 200 Hz to 800 Hz)
        const minFrequency = 200
        const maxFrequency = 800
        const mappedFrequency =
            minFrequency + scaledSpeed * (maxFrequency - minFrequency)

        // Update the oscillator frequency
        this.oscillator.frequency.value = Math.min(
            mappedFrequency,
            maxFrequency
        )

        // Track recent frequencies to calculate variance
        if (!this.recentFrequencies) {
            this.recentFrequencies = []
        }
        this.recentFrequencies.push(mappedFrequency)
        if (this.recentFrequencies.length > 10) {
            this.recentFrequencies.shift() // Keep only the last 10 frequencies
        }

        // Calculate variance of recent frequencies
        const meanFrequency =
            this.recentFrequencies.reduce((sum, freq) => sum + freq, 0) /
            this.recentFrequencies.length
        const variance =
            this.recentFrequencies.reduce(
                (sum, freq) => sum + Math.pow(freq - meanFrequency, 2),
                0
            ) / this.recentFrequencies.length

        // Adjust oscillator volume based on frequency stability
        if (variance < 10) {
            // If variance is low, reduce volume
            this.oscillator.volume.value = Math.max(
                this.oscillator.volume.value - 1,
                -80
            ) // Gradually decrease volume to a minimum of -60 dB
        } else {
            // If variance is high, restore volume
            this.oscillator.volume.value = Math.min(
                this.oscillator.volume.value + 1,
                -40
            ) // Gradually increase volume to a maximum of -30 dB
        }

        // console.log(mappedFrequency, this.oscillator.volume.value)
    }

    applyAttractionForce() {
        this.points.forEach((point) => {
            const dx = this.attractionPoint.x - point.x
            const dy = this.attractionPoint.y - point.y
            const distance = Math.sqrt(dx ** 2 + dy ** 2)

            if (distance < this.influenceRadius) {
                // Calculate the influence factor (closer points have more influence)
                const influence = 1 - distance / this.influenceRadius

                // Apply the attraction force
                point.x += dx * influence * this.attractionStrength
                point.y += dy * influence * this.attractionStrength
            }
        })
    }

    onMouseDown(event) {
        const rect = this.ctx.canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Add the circle to the clickedCircles array with a finite lifetime
        const newCircle = new Circle(
            mouseX,
            mouseY,
            this.circleRadius,
            "rgb(255, 255, 255)",
            this.opacity,
            false,
            3, // Growth rate
            300 // Lifetime (frames)
        )
        this.clickedCircles.push(newCircle)

        // Trigger the deep aquatic sound
        const randomFrequency = Math.random() * 50 + 100 // Random frequency between 100Hz and 150Hz
        this.deepSynth.triggerAttackRelease(randomFrequency, "2n") // Play the sound for a half note duration

        // Start dragging
        this.isDragging = true
        this.updateAttractionPoint(event)
    }

    onMouseMove(event) {
        if (this.isDragging) {
            this.updateAttractionPoint(event)
        }

        // --- Trigger note on hover (only once per event, with cooldown) ---
        const rect = this.ctx.canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const now = Date.now()
        if (now - this.lastHoverTriggerTime < this.hoverTriggerCooldown) {
            return // Too soon since last hover-trigger
        }

        for (const point of this.points) {
            const dx = point.x - mouseX
            const dy = point.y - mouseY
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < this.hoverRadius) {
                this.triggerPoint(point)
                this.lastHoverTriggerTime = now
                break // Stop after triggering one note
            }
        }
    }

    onMouseUp() {
        this.isDragging = false
        this.attractionPoint = null
    }

    updateAttractionPoint(event) {
        const rect = this.ctx.canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        this.attractionPoint = { x: mouseX, y: mouseY }
    }
}
