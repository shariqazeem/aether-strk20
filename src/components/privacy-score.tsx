'use client'

import { useCountUp, useReveal } from '@/lib/hooks/use-motion'

/**
 * The Effective Privacy Score, rendered as an arc plus its full breakdown.
 *
 * The breakdown is not optional decoration. A single number invites trust
 * without giving grounds for it; showing every term, its weight, and whether
 * it is counted directly or inverted is what makes the score auditable.
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
    hint: 'How many other notes yours is indistinguishable from, log-scaled across the denomination tier.',
  },
  {
    key: 'amountEntropy' as const,
    label: 'Amount entropy',
    weight: 0.25,
    inverted: false,
    hint: 'Spread of your split sizes. Round human numbers — 100, 500, 1,000 — cost you here.',
  },
  {
    key: 'timingEntropy' as const,
    label: 'Timing entropy',
    weight: 0.2,
    inverted: false,
    hint: 'Irregularity of your intervals measured against background pool traffic. Clockwork scores badly.',
  },
  {
    key: 'behavioralUniqueness' as const,
    label: 'Behavioural uniqueness',
    weight: 0.15,
    inverted: true,
    hint: 'Repeating the same asset, route and size — or always acting at the same hour — makes you identifiable.',
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
  const animated = useCountUp(target, shown, 1600)
  const band = bandFor(target)

  // Arc geometry: a 240° sweep starting bottom-left, which reads as a gauge
  // without the dial-face literalism of a full circle.
  const radius = 78
  const circumference = 2 * Math.PI * radius
  const sweep = 0.667
  const arcLength = circumference * sweep
  const filled = arcLength * (animated / 100)

  return (
    <div ref={ref} className={compact ? '' : 'grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-14'}>
      {/* Arc */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="196" height="196" viewBox="0 0 196 196" className="-rotate-[210deg]">
            <circle
              cx="98"
              cy="98"
              r={radius}
              fill="none"
              stroke="var(--color-rule)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
            />
            <circle
              cx="98"
              cy="98"
              r={radius}
              fill="none"
              stroke="url(#score-gradient)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              style={{ transition: 'stroke-dasharray 120ms linear' }}
            />
            <defs>
              <linearGradient id="score-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-veil-deep)" />
                <stop offset="55%" stopColor="var(--color-veil)" />
                <stop offset="100%" stopColor="#3f9fd4" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular font-display text-[3.4rem] leading-none tracking-tight">
              {animated.toFixed(1)}
            </span>
            <span className={`mt-1.5 text-[12px] font-semibold tracking-wide ${band.className}`}>
              {band.label}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] tracking-wide text-ink-faint">Effective privacy · 0–100</p>
      </div>

      {/* Breakdown */}
      {!compact && (
        <div className="min-w-0">
          <ul className="space-y-4">
            {DIMENSION_META.map((meta, index) => {
              const raw = dimensions[meta.key]
              const contributing = meta.inverted ? 100 - raw : raw
              return (
                <li
                  key={meta.key}
                  className="reveal"
                  data-shown={shown}
                  style={{ ['--reveal-delay' as string]: `${180 + index * 90}ms` }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[13.5px] font-medium">{meta.label}</span>
                      <span className="tabular font-mono text-[11px] text-ink-faint">
                        ×{meta.weight.toFixed(2)}
                      </span>
                      {meta.inverted && (
                        <span className="rounded bg-paper-sunk px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                          inverted
                        </span>
                      )}
                    </div>
                    <span className="tabular font-mono text-[13px] font-medium">
                      {contributing.toFixed(0)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full veil-gradient"
                      style={{
                        width: shown ? `${contributing}%` : '0%',
                        transition: `width 1.1s var(--ease-cinematic) ${240 + index * 90}ms`,
                      }}
                    />
                  </div>

                  <p className="mt-1.5 text-[12px] leading-snug text-ink-faint text-pretty">
                    {meta.hint}
                  </p>
                </li>
              )
            })}
          </ul>

          <div
            className="reveal mt-6 rounded-lg border border-rule bg-paper-sunk/60 px-4 py-3"
            data-shown={shown}
            style={{ ['--reveal-delay' as string]: '700ms' }}
          >
            <code className="font-mono text-[11.5px] leading-relaxed text-ink-muted">
              S_eff = 0.30·A + 0.25·H<sub>amt</sub> + 0.20·H<sub>time</sub> + 0.15·(100−U) +
              0.10·(100−R)
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
