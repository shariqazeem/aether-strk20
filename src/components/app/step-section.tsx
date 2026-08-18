'use client'

import type { ReactNode } from 'react'
import { StateBadge } from '@/components/ui/primitives'

/**
 * One stage of the loop.
 *
 * The dashboard is a single sequence, not a tab bar: exposure is measured,
 * the remedy is planned against what it found, the action is executed, the
 * ledger records what an observer saw, and the adversary runs again. Numbering
 * the stages and keeping them on one page is what makes that circuit legible —
 * tabs would let a user believe the steps are independent, and they are not.
 */

export type StepState = 'idle' | 'active' | 'done' | 'blocked'

export function StepSection({
  index,
  label,
  title,
  lede,
  state = 'idle',
  status,
  children,
}: {
  index: string
  label: string
  title: string
  lede?: string
  state?: StepState
  /** Short right-aligned status, e.g. "3 leaks" or "awaiting wallet". */
  status?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={`step-${index}`} className="scroll-mt-20 border-t border-rule pt-8">
      <div className="grid gap-5 md:grid-cols-[112px_1fr] md:gap-8">
        <div className="md:pt-1">
          <p className="mono-label leading-relaxed">
            {index}
            <br />
            {label}
          </p>
          {state === 'done' && (
            <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-ink-muted uppercase">
              <Check /> done
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="display-md text-balance">{title}</h2>
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
          {lede ? (
            <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted text-pretty">
              {lede}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  )
}

/** A stage that cannot run yet, with the reason stated rather than a dead control. */
export function StepBlocked({ reason, hint }: { reason: string; hint?: string }) {
  return (
    <div className="card-flat border-dashed p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <StateBadge state="neutral">waiting</StateBadge>
        <p className="text-[13.5px] font-medium">{reason}</p>
      </div>
      {hint ? (
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-muted text-pretty">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function Check() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
