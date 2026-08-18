'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/use-motion'

/**
 * The signature visual: a single identifiable transaction dissolving into a
 * crowd of identical ones.
 *
 * One dot starts bright and alone. As the field fills, it dims to match its
 * neighbours until it can no longer be picked out — which is precisely what
 * the anonymity set does to a real transaction. The loop restarts slowly, so
 * the page always shows the idea mid-motion rather than as a static diagram.
 *
 * Canvas rather than DOM because this runs a few hundred particles at 60fps
 * behind the hero; the same thing in divs drops frames on a laptop.
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  /** When in the cycle this particle joins the crowd, 0–1. */
  entersAt: number
  phase: number
}

const PARTICLE_COUNT = 190
const CYCLE_MS = 15_000

export function AnonymityField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1

    const particles: Particle[] = []
    // Deterministic layout — a seeded PRNG keeps the composition stable
    // between renders instead of reshuffling on every mount.
    let seed = 0x5eed
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 0xffffffff
    }

    const build = () => {
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        particles.push({
          x: random(),
          y: random(),
          vx: (random() - 0.5) * 0.00013,
          vy: (random() - 0.5) * 0.00013,
          radius: 1.1 + random() * 1.7,
          // The hero particle (index 0) is present from the start.
          entersAt: i === 0 ? 0 : 0.12 + random() * 0.55,
          phase: random() * Math.PI * 2,
        })
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    build()
    resize()

    let raf = 0
    let start: number | null = null
    let running = true

    const draw = (timestamp: number) => {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const cycle = (elapsed % CYCLE_MS) / CYCLE_MS

      ctx.clearRect(0, 0, width, height)

      // How far the crowd has assembled. Eased so the fill feels like it
      // settles rather than stops dead.
      const fill = Math.min(1, cycle / 0.72)
      const eased = 1 - Math.pow(1 - fill, 3)

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]
        const isHero = i === 0

        // Presence: 0 before it joins, ramping to 1 shortly after.
        let presence = 0
        if (cycle >= p.entersAt) {
          presence = Math.min(1, (cycle - p.entersAt) / 0.14)
        }
        if (presence <= 0) continue

        const drift = reducedMotion ? 0 : elapsed
        const x = (p.x + p.vx * drift) % 1
        const y = (p.y + p.vy * drift) % 1
        const px = ((x + 1) % 1) * width
        const py = ((y + 1) % 1) * height

        const twinkle = reducedMotion
          ? 1
          : 0.82 + Math.sin(elapsed / 1400 + p.phase) * 0.18

        if (isHero) {
          // The hero dot starts fully saturated and converges on the crowd's
          // appearance as the set grows — the whole argument, in one dot.
          const distinctness = 1 - eased
          const radius = p.radius + 1.5 * distinctness
          const alpha = (0.3 + 0.62 * distinctness) * twinkle

          if (distinctness > 0.02) {
            const halo = ctx.createRadialGradient(px, py, 0, px, py, 26 * distinctness + 5)
            halo.addColorStop(0, `rgba(79, 70, 229, ${0.3 * distinctness})`)
            halo.addColorStop(1, 'rgba(79, 70, 229, 0)')
            ctx.fillStyle = halo
            ctx.beginPath()
            ctx.arc(px, py, 26 * distinctness + 5, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.fillStyle = `rgba(79, 70, 229, ${alpha})`
          ctx.beginPath()
          ctx.arc(px, py, radius, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = `rgba(79, 70, 229, ${0.3 * presence * twinkle})`
          ctx.beginPath()
          ctx.arc(px, py, p.radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (running) raf = requestAnimationFrame(draw)
    }

    // Static composition for reduced motion: draw the settled crowd once.
    if (reducedMotion) {
      start = 0
      draw(CYCLE_MS * 0.8)
      running = false
    } else {
      raf = requestAnimationFrame(draw)
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    // Stop burning frames when the hero scrolls away.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (reducedMotion) return
        if (entry.isIntersecting && !running) {
          running = true
          raf = requestAnimationFrame(draw)
        } else if (!entry.isIntersecting && running) {
          running = false
          cancelAnimationFrame(raf)
        }
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full ${className}`}
    />
  )
}
