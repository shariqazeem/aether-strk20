'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/** True when the user has asked the OS to reduce motion. Re-evaluates live. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Reveals an element once it enters the viewport, then stops observing.
 * Pair with the `.reveal` / `.reveal-blur` classes.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string } = {},
): { ref: RefObject<T | null>; shown: boolean } {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      {
        threshold: options.threshold ?? 0.16,
        rootMargin: options.rootMargin ?? '0px 0px -8% 0px',
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, shown }
}

/**
 * Progress of an element through the viewport, 0 → 1.
 * 0 when its top hits the bottom of the screen, 1 when its bottom leaves the top.
 * This is what makes a section feel scrubbed rather than merely faded in.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T | null>
  progress: number
} {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      frame.current = null
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight
      const total = rect.height + viewport
      const travelled = viewport - rect.top
      const next = total <= 0 ? 0 : travelled / total
      setProgress(Math.min(1, Math.max(0, next)))
    }

    const onScroll = () => {
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  return { ref, progress }
}

/**
 * Eases a number toward a target once the element is visible.
 * Respects reduced motion by jumping straight to the value.
 */
export function useCountUp(target: number, shown: boolean, durationMs = 1400): number {
  const [value, setValue] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!shown) return
    if (reduced) {
      setValue(target)
      return
    }

    let raf = 0
    let start: number | null = null

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const t = Math.min(1, elapsed / durationMs)
      // easeOutExpo — fast arrival, long settle. Reads as "measured".
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, shown, durationMs, reduced])

  return value
}
