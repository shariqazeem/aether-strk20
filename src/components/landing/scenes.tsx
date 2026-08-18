'use client'

import { usePrefersReducedMotion, useScrollProgress } from '@/lib/hooks/use-motion'
import { LiveDemo } from '@/components/landing/live-demo'
import { Button } from '@/components/ui/primitives'

/**
 * The cinematic opening: two pinned scroll scenes.
 *
 * Scene one holds the viewport while the headline gives way to the running
 * app — the product literally rises into the claim. Scene two pins the app
 * and walks three callouts past it, each pointing at something the demo is
 * actually doing at that moment.
 *
 * Scroll position drives every transform directly — nothing autoplays; the
 * reader scrubs the film and can play it backwards. Each scene owns its own
 * fallbacks: small screens get a static column (pinned scenes are jank on
 * mobile), and reduced motion gets the same static column at every width.
 */

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** Progress p mapped into [from, to] as 0→1. */
function span(p: number, from: number, to: number): number {
  return clamp01((p - from) / (to - from))
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function OpeningScene() {
  const reduced = usePrefersReducedMotion()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  if (reduced) return <StaticOpening />

  const p = progress

  // Headline: present immediately, recedes as the app arrives.
  const headlineFade = 1 - span(p, 0.3, 0.46)
  const headlineRise = -easeOut(span(p, 0.3, 0.46)) * 60
  const headlineScale = 1 - span(p, 0.3, 0.46) * 0.04

  // The app: rises from below the fold, lands center, holds.
  const demoIn = easeOut(span(p, 0.32, 0.58))
  const demoY = (1 - demoIn) * 46 // vh
  const demoScale = 0.92 + demoIn * 0.08
  const demoFade = span(p, 0.32, 0.44)

  // Closing line fades in once the app has settled.
  const captionIn = span(p, 0.62, 0.74)

  return (
    <>
      <section ref={ref} className="relative hidden lg:block" style={{ height: '260vh' }}>
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
          {/* Headline layer */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{
              opacity: headlineFade,
              transform: `translateY(${headlineRise}px) scale(${headlineScale})`,
              pointerEvents: headlineFade < 0.4 ? 'none' : 'auto',
            }}
          >
            <p className="mono-label flex items-center gap-2">
              <span className="pulse-dot size-1.5 rounded-full bg-ink" />
              STRK20 · Starknet mainnet
            </p>
            <h1 className="display-xl mt-6 text-balance">
              Shielded isn&rsquo;t
              <br />
              <span className="text-ink-faint">private.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
              The pool gives you an anonymity set. Your behaviour spends it. Aether runs the real
              deanonymization attacks against your own footprint — then closes every leak it finds.
            </p>
            <div className="mt-8 flex items-center gap-2.5">
              <Button href="/app" size="lg">
                Open App
              </Button>
              <Button href="#engine" variant="secondary" size="lg">
                How it works
              </Button>
            </div>
            <p className="absolute bottom-8 font-mono text-[10.5px] tracking-[0.2em] text-ink-faint uppercase">
              Scroll
            </p>
          </div>

          {/* The product layer */}
          <div
            className="relative w-full max-w-3xl px-6"
            style={{
              opacity: demoFade,
              transform: `translateY(${demoY}vh) scale(${demoScale})`,
            }}
          >
            <LiveDemo />
            <p className="mt-6 text-center text-[15px] text-ink-muted" style={{ opacity: captionIn }}>
              This is Aether, running. Watch the score.
            </p>
          </div>
        </div>
      </section>

      {/* Small screens: same content, no pinning. */}
      <StaticOpening className="lg:hidden" />
    </>
  )
}

const CALLOUTS = [
  {
    title: 'The attack runs first.',
    body: 'Amount correlation, timing windows, round numbers, cadence, thin anonymity sets — the heuristics that deanonymized pool users are run against your real footprint before anything else.',
  },
  {
    title: 'Every leak names its fix.',
    body: 'A finding is not a warning. It carries the exact remedy — the mode, the sizing, the window — and hands it to the planner ready to execute.',
  },
  {
    title: 'Then it re-attacks.',
    body: 'Act on the plan and the adversary runs again over your new footprint. The loop closes only when it stops finding you.',
  },
]

export function CalloutScene() {
  const reduced = usePrefersReducedMotion()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  if (reduced) return <StaticCallouts />

  const p = span(progress, 0.18, 0.82)

  return (
    <>
      <section ref={ref} className="relative hidden lg:block" style={{ height: '300vh' }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[0.85fr_1fr] items-center gap-16 px-10">
            {/* Cycling callouts */}
            <div className="relative h-52">
              {CALLOUTS.map((callout, index) => {
                const from = index / CALLOUTS.length
                const to = (index + 1) / CALLOUTS.length
                const local = span(p, from, to)

                const fadeIn = index === 0 ? 1 : span(local, 0, 0.22) * 1.5
                const fadeOut = 1 - span(local, 0.78, 1) * 1.5
                const opacity = clamp01(Math.min(fadeIn, fadeOut))
                const rise = index === 0 ? 0 : (1 - clamp01(span(local, 0, 0.22))) * 18

                return (
                  <div
                    key={callout.title}
                    className="absolute inset-0 flex flex-col justify-center"
                    style={{ opacity, transform: `translateY(${rise}px)` }}
                  >
                    <p className="mono-label">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {String(CALLOUTS.length).padStart(2, '0')}
                    </p>
                    <h2 className="display-md mt-3 text-balance">{callout.title}</h2>
                    <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-muted text-pretty">
                      {callout.body}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* The pinned product */}
            <div style={{ transform: 'scale(0.97)' }}>
              <LiveDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Small screens: plain three-up. */}
      <StaticCallouts className="lg:hidden" />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Static fallbacks                                                   */
/* ------------------------------------------------------------------ */

function StaticOpening({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-6 sm:px-8">
        <p className="mono-label flex items-center gap-2">
          <span className="pulse-dot size-1.5 rounded-full bg-ink" />
          STRK20 · Starknet mainnet
        </p>
        <h1 className="display-xl mt-5">
          Shielded isn&rsquo;t
          <br />
          <span className="text-ink-faint">private.</span>
        </h1>
        <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-ink-muted text-pretty">
          The pool gives you an anonymity set. Your behaviour spends it. Aether runs the real
          deanonymization attacks against your own footprint — then closes every leak it finds.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <Button href="/app" size="lg">
            Open App
          </Button>
          <Button href="#engine" variant="secondary" size="lg">
            How it works
          </Button>
        </div>
        <div className="mt-10">
          <LiveDemo />
        </div>
      </div>
    </section>
  )
}

function StaticCallouts({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {CALLOUTS.map((callout, index) => (
            <div key={callout.title}>
              <p className="mono-label">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="mt-2 text-[19px] font-semibold tracking-tight">{callout.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted text-pretty">
                {callout.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
