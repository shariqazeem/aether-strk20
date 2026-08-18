'use client'

import { useCountUp, useReveal } from '@/lib/hooks/use-motion'

/**
 * The Effective Privacy Score: a ring plus its full breakdown.
 *
 * The breakdown is not decoration. A lone number invites trust without giving
 * grounds for it; showing every term, its weight, and whether it is counted
 * directly or inverted is what makes the score auditable.
 */

export interface ScoreDimensions {
  anonymitySet: number
  amountEntropy: number
  timingEntropy: number
  /** Raw uniqueness — higher is worse, inverted by the formula. */
  behavioralUniqueness: number
  /** Raw risk — higher is worse, inverted by the formula. */
  exitCorrelationRisk: number
}

export const DIMENSION_META = [
  {
    key: 'anonymitySet' as const,
    label: 'Anonymity set',
    weight: 0.3,
    inverted: false,
    hint: 'How many other notes yours is indistinguishable from, log-scaled across the tier.',
  },
  {
    key: 'amountEntropy' as const,
    label: 'Amount entropy',
    weight: 0.25,
    inverted: false,
    hint: 'Spread of your split sizes. Round human numbers cost you here.',
  },
  {
    key: 'timingEntropy' as const,
    label: 'Timing entropy',
    weight: 0.2,
    inverted: false,
    hint: 'Irregularity of your intervals against background pool traffic.',
  },
  {
    key: 'behavioralUniqueness' as const,
    label: 'Behavioural uniqueness',
    weight: 0.15,
    inverted: true,
    hint: 'Repeated asset, route and size triples — or a fixed hour of day — identify you.',
  },
  {
    key: 'exitCorrelationRisk' as const,
    label: 'Exit correlation',
    weight: 0.1,
    inverted: true,
    hint: 'Whether an amount leaving resembles one that recently entered.',
  },
]

/** Mirrors `computeEffectivePrivacy` in the engine. Kept in lockstep by tests. */
export function scoreFromDimensions(d: ScoreDimensions): number {
  const raw =
    0.3 * d.anonymitySet +
    0.25 * d.amountEntropy +
    0.2 * d.timingEntropy +
    0.15 * (100 - d.behavioralUniqueness) +
    0.1 * (100 - d.exitCorrelationRisk)
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10
}

function bandFor(score: number): { label: string; className: string } {
  if (score >= 78) return { label: 'Strong', className: 'text-good' }
  if (score >= 58) return { label: 'Adequate', className: 'text-veil' }
  if (score >= 38) return { label: 'Thin', className: 'text-exposed' }
  return { label: 'Exposed', className: 'text-warn' }
}

export function PrivacyScore({
  dimensions,
  compact = false,
}: {
  dimensions: ScoreDimensions
  compact?: boolean
}) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const target = scoreFromDimensions(dimensions)
  const animated = useCountUp(target, shown, 1200)
  const band = bandFor(target)

  const radius = 62
  const circumference = 2 * Math.PI * radius
  const filled = circumference * (animated / 100)

  return (
    <div ref={ref} className={compact ? '' : 'grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-12'}>
      {/* Ring */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="152" height="152" viewBox="0 0 152 152" className="-rotate-90">
            <circle
              cx="76"
              cy="76"
              r={radius}
              fill="none"
              stroke="var(--color-paper-deep)"
              strokeWidth="10"
            />
            <circle
              cx="76"
              cy="76"
              r={radius}
              fill="none"
              stroke="var(--color-veil)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              style={{ transition: 'stroke-dasharray 100ms linear' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-[34px] font-semibold tracking-tight">
              {animated.toFixed(1)}
            </span>
            <span className={`text-[12px] font-semibold ${band.className}`}>{band.label}</span>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] font-medium text-ink-faint">Effective privacy · 0–100</p>
      </div>

      {/* Breakdown */}
      {!compact && (
        <div className="min-w-0">
          <ul className="space-y-3.5">
            {DIMENSION_META.map((meta, index) => {
              const raw = dimensions[meta.key]
              const contributing = meta.inverted ? 100 - raw : raw
              return (
                <li
                  key={meta.key}
                  className="reveal"
                  data-shown={shown}
                  style={{ ['--reveal-delay' as string]: `${120 + index * 60}ms` }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium">{meta.label}</span>
                      <span className="tabular font-mono text-[10.5px] text-ink-faint">
                        ×{meta.weight.toFixed(2)}
                      </span>
                      {meta.inverted && (
                        <span className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[9.5px] text-ink-muted">
                          inverted
                        </span>
                      )}
                    </div>
                    <span className="tabular font-mono text-[12.5px] font-medium">
                      {contributing.toFixed(0)}
                    </span>
                  </div>

                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full bg-veil"
                      style={{
                        width: shown ? `${contributing}%` : '0%',
                        transition: `width 0.9s var(--ease-out-quart) ${160 + index * 60}ms`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-[11.5px] leading-snug text-ink-faint text-pretty">
                    {meta.hint}
                  </p>
                </li>
              )
            })}
          </ul>

          <code
            className="reveal mt-5 block rounded-lg bg-paper-sunk px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-ink-muted"
            data-shown={shown}
            style={{ ['--reveal-delay' as string]: '480ms' }}
          >
            S_eff = 0.30·A + 0.25·H<sub>amt</sub> + 0.20·H<sub>time</sub> + 0.15·(100−U) +
            0.10·(100−R)
          </code>
        </div>
      )}
    </div>
  )
}
