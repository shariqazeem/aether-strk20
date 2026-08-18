'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/use-motion'
import { AetherMark } from '@/components/ui/primitives'

/**
 * A running instance of the product, not a screenshot of it.
 *
 * The hero plays Aether's whole loop on a 14-second cycle: an action waits for
 * its window, executes, settles into a fresh note, the score ticks up, and the
 * observer column records almost nothing. Every value is derived from elapsed
 * time through pure functions, so the simulation is deterministic, pausable,
 * and renders a fixed frame under reduced motion.
 *
 * It is aria-hidden: this is a picture that moves, not an interface. The data
 * is representative, and the one honest asymmetry — the executor being visible
 * on swaps — is shown rather than hidden.
 */

const CYCLE_MS = 14_000

/** Score keyframes: 900ms eased ramp after each settlement. */
const SCORE_KEYS: Array<[number, number]> = [
  [0, 62.4],
  [5600, 62.4],
  [6500, 68.9],
  [9400, 68.9],
  [10300, 74.8],
  [12400, 74.8],
  [13300, 79.6],
  [14000, 79.6],
]

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function scoreAt(elapsed: number): number {
  for (let i = SCORE_KEYS.length - 1; i >= 0; i -= 1) {
    const [at, value] = SCORE_KEYS[i]
    if (elapsed >= at) {
      const next = SCORE_KEYS[i + 1]
      if (!next || next[1] === value) return value
      const t = (elapsed - at) / (next[0] - at)
      return value + (next[1] - value) * easeOutCubic(Math.min(1, t))
    }
  }
  return SCORE_KEYS[0][1]
}

interface Balances {
  usdc: string
  sbtc: string
  strk: string
  usdcShare: number
  sbtcShare: number
  notes: number
}

function balancesAt(elapsed: number): Balances {
  if (elapsed >= 12_400)
    return { usdc: '4,716.92', sbtc: '0.04175', strk: '1,204.70', usdcShare: 38, sbtcShare: 40, notes: 4 }
  if (elapsed >= 9_400)
    return { usdc: '5,204.11', sbtc: '0.03754', strk: '1,204.70', usdcShare: 42, sbtcShare: 36, notes: 3 }
  if (elapsed >= 5_600)
    return { usdc: '5,204.11', sbtc: '0.03754', strk: '1,204.70', usdcShare: 42, sbtcShare: 36, notes: 4 }
  return { usdc: '6,412.77', sbtc: '0.02710', strk: '1,204.70', usdcShare: 52, sbtcShare: 26, notes: 3 }
}

type PlanStatus = 'queued' | 'window' | 'executing'

interface PlanRow {
  title: string
  status: PlanStatus
  /** 0–1 progress of the current status bar, for window/executing states. */
  progress: number
}

interface Action {
  title: string
  queuedAt: number
  windowAt: number
  execAt: number
  settleAt: number
  ledger: string
  observer: string
}

const ACTIONS: Action[] = [
  {
    title: 'Private swap · USDC → strkBTC',
    queuedAt: 0,
    windowAt: 2000,
    execAt: 3600,
    settleAt: 5600,
    ledger: 'Private swap · 1,208.66 USDC → 0.01044 sBTC',
    observer: 'executor → AMM',
  },
  {
    title: 'Rebalance · merge 2 notes',
    queuedAt: 5600,
    windowAt: 7000,
    execAt: 8000,
    settleAt: 9400,
    ledger: 'Rebalance · merged 2 notes',
    observer: '—',
  },
  {
    title: 'Stealth DCA · tranche 2/7',
    queuedAt: 9400,
    windowAt: 10_200,
    execAt: 11_000,
    settleAt: 12_400,
    ledger: 'Stealth DCA · 487.19 USDC → 0.00421 sBTC',
    observer: 'executor → AMM',
  },
]

function planAt(elapsed: number): PlanRow[] {
  const rows: PlanRow[] = []

  for (const action of ACTIONS) {
    if (elapsed >= action.settleAt || elapsed < action.queuedAt) continue

    if (elapsed >= action.execAt) {
      rows.push({
        title: action.title,
        status: 'executing',
        progress: (elapsed - action.execAt) / (action.settleAt - action.execAt),
      })
    } else if (elapsed >= action.windowAt) {
      rows.push({
        title: action.title,
        status: 'window',
        progress: (elapsed - action.windowAt) / (action.execAt - action.windowAt),
      })
    } else {
      rows.push({ title: action.title, status: 'queued', progress: 0 })
    }
  }

  // Show the next queued action alongside the active one.
  const nextAction = ACTIONS.find((action) => action.queuedAt > elapsed)
  if (nextAction && rows.length < 2) {
    rows.push({ title: nextAction.title, status: 'queued', progress: 0 })
  }

  return rows.slice(0, 2)
}

function ledgerAt(elapsed: number): Array<{ text: string; observer: string }> {
  return ACTIONS.filter((action) => elapsed >= action.settleAt).map((action) => ({
    text: action.ledger,
    observer: action.observer,
  }))
}

/** Dimension bars track the score linearly between their start and end values. */
const DIMS: Array<{ label: string; from: number; to: number }> = [
  { label: 'Anonymity set', from: 71, to: 82 },
  { label: 'Amount entropy', from: 78, to: 91 },
  { label: 'Timing entropy', from: 60, to: 76 },
  { label: 'Behaviour', from: 74, to: 86 },
  { label: 'Exit corr.', from: 88, to: 94 },
]

function dimsAt(score: number): Array<{ label: string; value: number }> {
  const k = Math.min(1, Math.max(0, (score - 62.4) / (79.6 - 62.4)))
  return DIMS.map((dim) => ({ label: dim.label, value: Math.round(dim.from + (dim.to - dim.from) * k) }))
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  queued: 'Queued',
  window: 'Window open',
  executing: 'Executing',
}

export function LiveDemo() {
  const reducedMotion = usePrefersReducedMotion()
  // SSR renders t=0; the clock starts after mount so hydration matches.
  const [elapsed, setElapsed] = useState(0)
  const [clock, setClock] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) {
      setElapsed(13_500)
      return
    }

    let raf = 0
    let start = performance.now()
    let pausedAt: number | null = null
    let running = true

    const frame = (t: number) => {
      if (running) setElapsed((t - start) % CYCLE_MS)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const pause = () => {
      if (running) {
        pausedAt = performance.now()
        running = false
      }
    }
    const resume = () => {
      if (!running && pausedAt !== null) {
        start += performance.now() - pausedAt
        pausedAt = null
        running = true
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? resume() : pause()),
      { threshold: 0 },
    )
    if (rootRef.current) observer.observe(rootRef.current)

    const onVisibility = () => (document.hidden ? pause() : resume())
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const score = scoreAt(elapsed)
  const balances = balancesAt(elapsed)
  const plan = planAt(elapsed)
  const ledger = ledgerAt(elapsed)
  const dims = dimsAt(score)

  const radius = 30
  const circumference = 2 * Math.PI * radius

  return (
    <div ref={rootRef} aria-hidden="true" className="relative select-none">
      {/* Atmosphere */}
      <div className="aurora absolute -inset-10 -z-10 rounded-[40px]" />

      <div className="overflow-hidden rounded-[20px] border border-rule bg-paper-raised/[0.9] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_28px_80px_-20px_rgba(23,23,26,0.25)] backdrop-blur-xl">
        {/* App bar */}
        <div className="flex h-11 items-center justify-between border-b border-rule px-4">
          <div className="flex items-center gap-2">
            <AetherMark size={20} />
            <span className="text-[12.5px] font-semibold tracking-tight">Aether</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-ink-soft">
              <span className="pulse-dot size-1.5 rounded-full bg-ink" />
              LIVE
            </span>
            <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 font-mono text-[10.5px] text-ink-muted">
              0x04d2…9c1a
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1.2fr_0.9fr]">
          {/* Left: portfolio + plan */}
          <div className="border-b border-rule p-4 sm:border-r sm:border-b-0">
            <p className="font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
              Shielded portfolio
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="tabular text-[23px] font-semibold tracking-tight">$12,438.02</span>
              <span className="tabular font-mono text-[10.5px] text-ink-faint">
                {balances.notes} notes
              </span>
            </div>

            <ul className="mt-3 space-y-2.5">
              {[
                { symbol: 'USDC', amount: balances.usdc, share: balances.usdcShare },
                { symbol: 'strkBTC', amount: balances.sbtc, share: balances.sbtcShare },
                { symbol: 'STRK', amount: balances.strk, share: 100 - balances.usdcShare - balances.sbtcShare },
              ].map((asset) => (
                <li key={asset.symbol} className="flex items-center gap-2.5">
                  <span className="w-14 shrink-0 text-[11.5px] font-medium text-ink-soft">
                    {asset.symbol}
                  </span>
                  <div className="h-1 flex-1 rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      style={{ width: `${asset.share}%` }}
                    />
                  </div>
                  <span className="tabular w-20 shrink-0 text-right font-mono text-[11.5px] font-medium">
                    {asset.amount}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
              Plan
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {plan.map((row) => (
                <li
                  key={row.title}
                  className="rounded-lg border border-rule bg-paper-raised px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11.5px] font-medium">{row.title}</span>
                    <span
                      className={`shrink-0 font-mono text-[9.5px] tracking-wider uppercase ${
                        row.status === 'executing'
                          ? 'text-ink'
                          : row.status === 'window'
                            ? 'text-ink-soft'
                            : 'text-ink-faint'
                      }`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>
                  {row.status !== 'queued' && (
                    <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-paper-deep">
                      <div
                        className={`h-full rounded-full ${row.status === 'executing' ? 'bg-ink' : 'bg-ink'}`}
                        style={{ width: `${Math.round(row.progress * 100)}%` }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: score */}
          <div className="p-4">
            <p className="font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
              Effective privacy
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative shrink-0">
                <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
                  <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--color-paper-deep)" strokeWidth="6" />
                  <circle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference * (score / 100)} ${circumference}`}
                  />
                </svg>
                <span className="tabular absolute inset-0 grid place-items-center text-[17px] font-semibold tracking-tight">
                  {score.toFixed(1)}
                </span>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {dims.map((dim) => (
                  <li key={dim.label} className="flex items-center gap-2">
                    <span className="w-[86px] shrink-0 truncate text-[10px] font-medium text-ink-muted">
                      {dim.label}
                    </span>
                    <div className="h-[3px] flex-1 rounded-full bg-paper-deep">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${dim.value}%` }} />
                    </div>
                    <span className="tabular w-5 shrink-0 text-right font-mono text-[9.5px] text-ink-faint">
                      {dim.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
              Settled · observer sees
            </p>
            <ul className="mt-1.5 space-y-1">
              {ledger.length === 0 ? (
                <li className="text-[11px] text-ink-faint">Awaiting first execution…</li>
              ) : (
                ledger.map((entry) => (
                  <li key={entry.text} className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[11px] font-medium text-ink-soft">
                      {entry.text}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[10px] ${
                        entry.observer === '—' ? 'text-ink-faint' : 'text-ember'
                      }`}
                    >
                      {entry.observer}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-rule bg-paper-sunk/70 px-4 py-1.5 font-mono text-[10px] text-ink-muted">
          <span>anonymity set 2,847 · pool fee 6 STRK</span>
          <span className="tabular">{clock ?? '—:—:—'}</span>
        </div>
      </div>
    </div>
  )
}
