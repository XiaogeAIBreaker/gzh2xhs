'use client'

import { useEffect, useRef } from 'react'

interface Props {
    enabled?: boolean
}

export default function ParticlesBackground({ enabled = true }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const c = canvasRef.current as HTMLCanvasElement
        let cleanup = () => {}
        if (!enabled) {
            return cleanup
        }
        const context = c.getContext('2d') as CanvasRenderingContext2D | null
        if (!context) {
            return cleanup
        }
        const ctx: CanvasRenderingContext2D = context

        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = []

        function resize() {
            const { width, height } = c.getBoundingClientRect()
            c.width = Math.floor(width * dpr)
            c.height = Math.floor(height * dpr)
        }

        function init() {
            particles.length = 0
            const { width, height } = c
            const count = prefersReduced ? 40 : 100
            for (let i = 0; i < count; i++) {
                const r = Math.random() * 2 + 0.5
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * (prefersReduced ? 0.2 : 0.6),
                    vy: (Math.random() - 0.5) * (prefersReduced ? 0.2 : 0.6),
                    r,
                })
            }
        }

        function step() {
            const { width, height } = c
            ctx.clearRect(0, 0, width, height)
            for (const p of particles) {
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0 || p.x > width) p.vx *= -1
                if (p.y < 0 || p.y > height) p.vy *= -1
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r * dpr, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(96,165,250,0.65)'
                ctx.shadowColor = 'rgba(96,165,250,0.6)'
                ctx.shadowBlur = 12 * dpr
                ctx.fill()
            }
            rafRef.current = requestAnimationFrame(step)
        }

        const onResize = () => {
            resize()
            init()
        }
        resize()
        init()
        step()
        window.addEventListener('resize', onResize)
        cleanup = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', onResize)
        }
        return cleanup
    }, [enabled])

    return <canvas ref={canvasRef} className="h-full w-full" />
}
