import * as Tone from "tone"
import Circle from "./Circle.js"
import Wave from "./Wave.js"

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

        this.wave = null

        this.keyAngles = [
            // Simple geometric symmetry
            0.5236, // π/6      — 30°, triangle grid
            0.6283, // 2π/10    — 36°, decagon star
            0.6667, // 2π/9     — 40°, enneagon fractals
            0.7854, // π/4      — 45°, square/diagonal cross
            0.9425, // 3π/10    — 54°, star pattern
            1.0472, // π/3      — 60°, hexagon tiling
            1.2566, // 2π/5     — 72°, pentagon rotation
            1.5708, // π/2      — 90°, perpendicular grid
            1.884, // 3π/5     — 108°, fivefold starburst
            2.0944, // 2π/3     — 120°, triangle repeat
            2.2214, // π/√2     — folding spirals
            2.3998, // Golden angle — 137.5°, sunflower vortex
            2.5133, // 4π/5     — 144°, star-arm spacing
            2.618, // π/φ      — irrational symmetry
            3.0, // gentle spiral collapse
            3.1255, // slightly less than π — tight reflection
            3.1416, // π        — mirror fold
            3.4, // asymmetric helix
            3.618, // φ        — golden ratio expansion
            3.9269, // 5π/4     — diagonal inverse
            4.1888, // 4π/3     — triangular counter-rotation
            4.398, // pseudo star-lattice
            4.7124, // 3π/2     — mirrored Y-axis
            5.0, // slow swirl rotation
            5.236, // 5π/3     — sixfold flower
            5.4, // fivefold radial bursts
            5.6, // nested orbit
            5.76, // inverted S symmetry
            6.0, // almost full loop
            6.2, // high-density near-loop
            6.2831, // 2π       — total rotational overlap
        ]
        this.lastKeyAngleIndex = -1
        this.useCoolColors = true

        this.setup()
        this.setRandomBackgroundColors()
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
                C2: "Marimba_C2.mp3",
                C3: "Marimba_C3.mp3",
                C4: "Marimba_C4.mp3",
                F2: "Marimba_F2.mp3",
                F3: "Marimba_F3.mp3",
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

        // Intersection gain
        this.intersectionGain = new Tone.Gain(0.5)

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
            this.intersectionGain,
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

        // Stroke
        this.pointConnectionLenght = 5

        // Forces
        this.springStrength = 0.05
        this.influenceRadius = 250
        this.attractionStrength = 0.15

        // Initialize points array
        this.initializePoints()

        // Instantiate Wave
        this.wave = new Wave(
            this.ctx,
            this.points,
            this.clickedCircles,
            this.circleRadius,
            this.opacity,
            this.deepSynth,
            this.glowBlur,
            this.glowColor,
            this.hoverTriggerCooldown
        )

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

        // Trigger the points
        let delay = 0
        randomIndices.forEach((index) => {
            const randomPoint = this.points[index]
            this.triggerRandomChordPoint(randomPoint, delay)
            delay += 0.15
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

    draw() {
        // Changing phyllotaxis angle
        this.customAngle += 0.00002
        // console.log(this.customAngle)

        // Check for key angle crossing
        const idx = this.keyAngles.findIndex(
            (angle) => Math.abs(this.customAngle - angle) < 0.00002
        )
        if (idx !== -1 && idx !== this.lastKeyAngleIndex) {
            this.setRandomBackgroundColors()
            this.lastKeyAngleIndex = idx

            // Shift 1 or 2 notes in each chord by a semitone (up or down)
            this.randomChords = this.randomChords.map((chord) => {
                // Pick 1 or 2 unique indices
                const numToShift = Math.random() < 0.5 ? 1 : 2
                const indices = []
                while (indices.length < numToShift) {
                    const idx = Math.floor(Math.random() * chord.length)
                    if (!indices.includes(idx)) indices.push(idx)
                }
                // Shift selected notes by +1 or -1 semitone
                return chord.map((note, i) => {
                    if (indices.includes(i)) {
                        const semitone = Math.random() < 0.5 ? 1 : -1
                        return this.shiftNoteBySemitones(note, semitone)
                    }
                    return note
                })
            })
            // Reset current chord state to use new chords
            this.currentRandomChordIndex = 0
            this.currentRandomChord =
                this.randomChords[this.currentRandomChordIndex]
            this.currentRandomNoteIndex = 0
        }

        // Breathing scale
        this.time += this.echelleOscillationSpeed
        this.echelle = 30 + 3 * Math.sin(this.time)

        // Spring force
        this.applySpringForce()

        // Attraction force if dragging
        if (this.isDragging && this.attractionPoint) {
            this.applyAttractionForce()
        }

        // Draw lines
        this.drawLines(this.points)

        // Draw phyllotaxis points
        this.drawPoint()

        // Draw waves
        this.wave.setRepulsionForce()

        // Draw intersection points
        this.wave.drawIntersection(
            this.triggerPoint.bind(this),
            this.hoverTriggerCooldown,
            this.lastHoverTriggerTime,
            (now) => {
                this.lastHoverTriggerTime = now
            }
        )
    }

    drawPoint() {
        // Shrink triggered points back to normal
        this.points.forEach((point, i) => {
            // Only if radius is larger than normal
            if (point.radius > this.circleRadius) {
                point.radius = point.radius * 0.97 + this.circleRadius * 0.03
                if (Math.abs(point.radius - this.circleRadius) < 0.5) {
                    point.radius = this.circleRadius
                }
            }

            // Glow effect
            if (point.isFilled) {
                this.ctx.save()
                this.ctx.shadowBlur = this.glowBlur
                this.ctx.shadowColor = this.glowColor
            }

            // Draw circles
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

    triggerPoint(
        point,
        circle = null,
        delay = 0,
        intersectionRadius = null,
        maxIntersectionRadius = null,
        triggerType = "hover"
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

            // Intersection notes louder
            let volumeMultiplier = 0.1
            if (triggerType === "intersection") {
                volumeMultiplier = 0.3
            }

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

    applySpringForce() {
        let totalWeightedSpeed = 0
        let totalWeight = 0

        this.points.forEach((point, i) => {
            const desired = this.calculateDesiredPosition(i)

            const dx = desired.x - point.x
            const dy = desired.y - point.y

            // Apply spring force
            point.x += dx * this.springStrength
            point.y += dy * this.springStrength

            // Calculate speed
            const speed = Math.sqrt(
                Math.pow(point.x - (point.previousX || point.x), 2) +
                    Math.pow(point.y - (point.previousY || point.y), 2)
            )

            // Calculate the weight of the point for the oscillator
            const weight = speed * speed
            totalWeightedSpeed += speed * weight
            totalWeight += weight

            // Update previous position
            point.previousX = point.x
            point.previousY = point.y
        })

        const weightedAverageSpeed =
            totalWeight > 0 ? totalWeightedSpeed / totalWeight : 0

        const scaledSpeed = weightedAverageSpeed * 0.2

        // Map the scaled speed to a frequency range
        const minFrequency = 200
        const maxFrequency = 800
        const mappedFrequency =
            minFrequency + scaledSpeed * (maxFrequency - minFrequency)

        // Update the oscillator frequency
        this.oscillator.frequency.value = Math.min(
            mappedFrequency,
            maxFrequency
        )

        if (!this.recentFrequencies) {
            this.recentFrequencies = []
        }
        this.recentFrequencies.push(mappedFrequency)
        if (this.recentFrequencies.length > 10) {
            this.recentFrequencies.shift()
        }

        const meanFrequency =
            this.recentFrequencies.reduce((sum, freq) => sum + freq, 0) /
            this.recentFrequencies.length
        const variance =
            this.recentFrequencies.reduce(
                (sum, freq) => sum + Math.pow(freq - meanFrequency, 2),
                0
            ) / this.recentFrequencies.length

        // Adjust oscillator volume
        if (variance < 10) {
            // If variance is low reduce volume
            this.oscillator.volume.value = Math.max(
                this.oscillator.volume.value - 1,
                -80
            )
        } else {
            // If variance is high restore volume
            this.oscillator.volume.value = Math.min(
                this.oscillator.volume.value + 1,
                -40
            )
        }
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

    applyAttractionForce() {
        this.points.forEach((point) => {
            const dx = this.attractionPoint.x - point.x
            const dy = this.attractionPoint.y - point.y
            const distance = Math.sqrt(dx ** 2 + dy ** 2)

            if (distance < this.influenceRadius) {
                const influence = 1 - distance / this.influenceRadius

                point.x += dx * influence * this.attractionStrength
                point.y += dy * influence * this.attractionStrength
            }
        })
    }

    onMouseDown(event) {
        const rect = this.ctx.canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Waves
        this.wave.drawWave(mouseX, mouseY)

        // Start dragging
        this.isDragging = true
        this.updateAttractionPoint(event)
    }

    onMouseMove(event) {
        if (this.isDragging) {
            this.updateAttractionPoint(event)
        }

        // Trigger note on hover
        const rect = this.ctx.canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const now = Date.now()
        if (now - this.lastHoverTriggerTime < this.hoverTriggerCooldown) {
            return
        }

        for (const point of this.points) {
            const dx = point.x - mouseX
            const dy = point.y - mouseY
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < this.hoverRadius) {
                this.triggerPoint(point)
                this.lastHoverTriggerTime = now
                break
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

    setRandomBackgroundColors() {
        // Helper to parse rgba string to array
        function parseRgba(rgba) {
            return rgba.match(/[\d.]+/g).map(Number)
        }
        // Helper to interpolate between two rgba arrays
        function lerpColor(a, b, t) {
            return a.map((v, i) => v + (b[i] - v) * t)
        }
        // Helper to convert rgba array to string
        function rgbaToString([r, g, b, a]) {
            return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(
                b
            )}, ${a})`
        }

        // Color families
        const coolHueRanges = [
            [200, 260], // Blue
        ]
        const warmHueRanges = [
            [20, 65], // Yellow
        ]
        const hueRanges = this.useCoolColors ? coolHueRanges : warmHueRanges
        this.useCoolColors = !this.useCoolColors
        const [hueMin, hueMax] =
            hueRanges[Math.floor(Math.random() * hueRanges.length)]
        const h = Math.floor(Math.random() * (hueMax - hueMin)) + hueMin
        const s = Math.floor(Math.random() * 30) + 40
        const l = Math.floor(Math.random() * 15) + 10

        function hslToRgba({ h, s, l }, alpha = 1) {
            s /= 100
            l /= 100
            const k = (n) => (n + h / 30) % 12
            const a = s * Math.min(l, 1 - l)
            const f = (n) =>
                l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1))
            const r = Math.round(255 * f(0))
            const g = Math.round(255 * f(8))
            const b = Math.round(255 * f(4))
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        const base = { h, s, l }
        const lighter = { ...base, l: Math.min(base.l + 25, 100) }
        const darker = { ...base, l: Math.max(base.l - 5, 8) }

        // Get current colors
        const root = document.documentElement
        const style = getComputedStyle(root)
        const current1 = parseRgba(
            style.getPropertyValue("--background_color1")
        )
        const current2 = parseRgba(
            style.getPropertyValue("--background_color2")
        )
        const current3 = parseRgba(
            style.getPropertyValue("--background_color3")
        )

        // Target colors
        const target1 = parseRgba(hslToRgba(lighter))
        const target2 = parseRgba(hslToRgba(base))
        const target3 = parseRgba(hslToRgba(darker))

        // Animate transition
        const duration = 500 // ms
        const steps = 30
        let frame = 0

        function animate() {
            frame++
            const t = Math.min(frame / steps, 1)
            root.style.setProperty(
                "--background_color1",
                rgbaToString(lerpColor(current1, target1, t))
            )
            root.style.setProperty(
                "--background_color2",
                rgbaToString(lerpColor(current2, target2, t))
            )
            root.style.setProperty(
                "--background_color3",
                rgbaToString(lerpColor(current3, target3, t))
            )
            if (t < 1) {
                requestAnimationFrame(animate)
            }
        }
        animate()
    }

    shiftNoteBySemitones(note, semitones) {
        // Chromatic scale
        const scale = [
            "C",
            "C#",
            "D",
            "D#",
            "E",
            "F",
            "F#",
            "G",
            "G#",
            "A",
            "A#",
            "B",
        ]
        const match = note.match(/^([A-G]#?)(\d)$/)
        if (!match) return note
        let [, name, octave] = match
        octave = parseInt(octave)
        let idx = scale.indexOf(name)
        if (idx === -1) return note
        let newIdx = idx + semitones
        while (newIdx < 0) {
            newIdx += 12
            octave -= 1
        }
        while (newIdx > 11) {
            newIdx -= 12
            octave += 1
        }
        return `${scale[newIdx]}${octave}`
    }
}
