'use client'

import { useScrollProgress } from '@/lib/hooks/use-motion'
import { Container, Eyebrow, Reveal } from '@/components/ui/primitives'

/**
 * Why Aether is worth opening tomorrow.
 *
 * The honest retention argument for a privacy product is not a streak badge —
 * it is that the anonymity set is a shared resource which genuinely grows with
 * participation, and that a plan left unexecuted decays as the pool state it
 * was computed against moves on. The curve below is the product's actual
 * mechanic, so the hook and the value are the same thing.
 */

/** Modelled score trajectory for a wallet acting on its plan versus one that stalls. */
const ACTIVE = [31, 38, 44, 51, 55, 61, 66, 69, 73, 76, 79, 81, 84, 86]
const DORMANT = [31, 33, 34, 34, 33, 32, 31, 29, 28, 27, 26, 25, 24, 23]

const WIDTH = 720
const HEIGHT = 210
const PAD = { top: 16, right: 16, bottom: 26, left: 30 }

function toPath(series: number[], visibleCount: number): string {
  const points = series.slice(0, Math.max(2, visibleCount))
  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  return points
    .map((value, index) => {
      const x = PAD.left + (index / (series.length - 1)) * innerW
      const y = PAD.top + innerH - (value / 100) * innerH
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function CompoundingPrivacy() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  const draw = Math.min(1, Math.max(0, (progress - 0.2) / 0.5))
  const visible = Math.max(2, Math.ceil(draw * ACTIVE.length))
  const activeScore = ACTIVE[Math.min(ACTIVE.length - 1, visible - 1)]
  const dormantScore = DORMANT[Math.min(DORMANT.length - 1, visible - 1)]

  return (
    <section ref={ref} className="py-28 sm:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow>Privacy compounds</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-md mt-4 text-balance">
                A plan you never run is a plan that <span className="italic">decays</span>.
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-muted text-pretty">
                Your score is computed against live pool state. As the pool moves, a plan built
                yesterday drifts out of alignment with the anonymity set it was optimised for — and
                a wallet that stops acting slowly becomes distinguishable again, simply by standing
                still while everyone else moves.
              </p>
            </Reveal>
            <Reveal delay={230}>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-muted text-pretty">
                So Aether surfaces one thing each day: the next recommended action, its expected
                privacy delta, and the window it should land in. Not a streak counter — a reason.
              </p>
            </Reveal>

            <Reveal delay={310}>
              <div className="mt-8 flex gap-8">
                <div>
                  <p className="tabular font-display text-[2.6rem] leading-none text-veil">
                    {activeScore}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-ink-muted">acting on the plan</p>
                </div>
                <div>
                  <p className="tabular font-display text-[2.6rem] leading-none text-ink-faint">
                    {dormantScore}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-ink-muted">shielded, then idle</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div className="card p-6 sm:p-7">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[13px] font-semibold tracking-tight">
                  Effective privacy over 14 days
                </h3>
                <span className="font-mono text-[11px] text-ink-faint">modelled</span>
              </div>

              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="mt-5 w-full"
                role="img"
                aria-label="Effective privacy score rising to 86 for a wallet acting on its plan, and falling to 23 for one that shields then goes idle"
              >
                {[0, 25, 50, 75, 100].map((tick) => {
                  const innerH = HEIGHT - PAD.top - PAD.bottom
                  const y = PAD.top + innerH - (tick / 100) * innerH
                  return (
                    <g key={tick}>
                      <line
                        x1={PAD.left}
                        y1={y}
                        x2={WIDTH - PAD.right}
                        y2={y}
                        stroke="var(--color-rule)"
                        strokeWidth="1"
                      />
                      <text
                        x={PAD.left - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="9.5"
                        className="font-mono"
                        fill="var(--color-ink-faint)"
                      >
                        {tick}
                      </text>
                    </g>
                  )
                })}

                <path
                  d={toPath(DORMANT, visible)}
                  fill="none"
                  stroke="var(--color-ink-faint)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 5"
                />
                <path
                  d={toPath(ACTIVE, visible)}
                  fill="none"
                  stroke="var(--color-veil)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <text
                  x={PAD.left}
                  y={HEIGHT - 6}
                  fontSize="9.5"
                  className="font-mono"
                  fill="var(--color-ink-faint)"
                >
                  day 1
                </text>
                <text
                  x={WIDTH - PAD.right}
                  y={HEIGHT - 6}
                  textAnchor="end"
                  fontSize="9.5"
                  className="font-mono"
                  fill="var(--color-ink-faint)"
                >
                  day 14
                </text>
              </svg>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-4 text-[12px]">
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="h-0.5 w-5 rounded-full bg-veil" />
                  Acting on the daily plan
                </span>
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="h-0.5 w-5 rounded-full border-t-2 border-dashed border-ink-faint" />
                  Shielded once, then idle
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
