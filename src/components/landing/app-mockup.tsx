'use client'

import { AetherMark, StateBadge } from '@/components/ui/primitives'

/**
 * The hero image is the product itself: a static, pixel-accurate render of the
 * dashboard. No screenshot tooling, no fake browser chrome — just the app's
 * real layout with representative data, so the landing page shows exactly what
 * connecting a wallet leads to.
 */

const ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', amount: '4,182.44', usd: '$4,181.90', share: 34 },
  { symbol: 'sBTC', name: 'strkBTC', amount: '0.06210', usd: '$7,412.66', share: 59 },
  { symbol: 'STRK', name: 'Starknet', amount: '1,204.70', usd: '$843.46', share: 7 },
]

const PLAN = [
  {
    title: 'Private swap · USDC → strkBTC',
    window: '14:20 – 16:05',
    delta: '+3.1',
    state: 'ready' as const,
  },
  {
    title: 'Rebalance · merge 3 notes',
    window: '21:40 – 23:10',
    delta: '+1.8',
    state: 'queued' as const,
  },
]

const DIMENSIONS = [
  { label: 'Anonymity set', value: 82 },
  { label: 'Amount entropy', value: 91 },
  { label: 'Timing entropy', value: 76 },
  { label: 'Behaviour', value: 86 },
  { label: 'Exit correlation', value: 94 },
]

export function AppMockup() {
  return (
    <div
      aria-hidden="true"
      className="shadow-stage select-none overflow-hidden rounded-[20px] border border-rule bg-paper"
    >
      {/* App bar */}
      <div className="flex h-12 items-center justify-between border-b border-rule px-4 sm:px-5">
        <div className="flex items-center gap-2">
          <AetherMark size={22} />
          <span className="text-[13px] font-semibold tracking-tight">Aether</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-semibold text-good sm:inline-flex">
            <span className="size-1.5 rounded-full bg-good" />
            Mainnet
          </span>
          <span className="rounded-full bg-black/[0.05] px-2.5 py-1 font-mono text-[11px] text-ink-muted">
            0x04d2…9c1a
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.25fr_1fr]">
        {/* Portfolio */}
        <div className="border-b border-rule p-4 sm:p-5 lg:border-r lg:border-b-0">
          <p className="text-[12px] font-medium text-ink-muted">Shielded portfolio</p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="tabular text-[27px] font-semibold tracking-tight">$12,438.02</span>
            <span className="rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good">
              +2.4% 30d
            </span>
          </div>

          <ul className="mt-4 divide-y divide-rule">
            {ASSETS.map((asset) => (
              <li key={asset.symbol} className="flex items-center gap-3 py-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.05] text-[10px] font-semibold text-ink-soft">
                  {asset.symbol.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{asset.name}</p>
                  <div className="mt-1 h-1 max-w-[120px] rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full bg-veil"
                      style={{ width: `${asset.share}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular font-mono text-[12.5px] font-medium">{asset.amount}</p>
                  <p className="tabular font-mono text-[11px] text-ink-faint">{asset.usd}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="list-header mt-4">Today&rsquo;s plan</p>
          <ul className="mt-2 space-y-2">
            {PLAN.map((item) => (
              <li
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-rule bg-paper px-3 py-2.5"
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${item.state === 'ready' ? 'bg-veil' : 'bg-ink-faint'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{item.title}</p>
                  <p className="tabular font-mono text-[10.5px] text-ink-faint">
                    window {item.window} · ΔS {item.delta}
                  </p>
                </div>
                {item.state === 'ready' ? (
                  <span className="rounded-full bg-veil px-2.5 py-1 text-[11px] font-semibold text-white">
                    Execute
                  </span>
                ) : (
                  <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                    Queued
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Score */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-ink-muted">Effective privacy</p>
            <StateBadge state="private">live</StateBadge>
          </div>

          <div className="mt-3 flex items-center gap-5">
            <MiniRing value={84.2} />
            <div>
              <p className="text-[13px] font-semibold text-good">Strong</p>
              <p className="mt-0.5 max-w-[180px] text-[11.5px] leading-snug text-ink-muted">
                Nothing in the last 30 days links your notes to your address.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {DIMENSIONS.map((dimension) => (
              <li key={dimension.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] font-medium text-ink-soft">{dimension.label}</span>
                  <span className="tabular font-mono text-[11px] text-ink-muted">
                    {dimension.value}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-paper-deep">
                  <div
                    className="h-full rounded-full bg-veil"
                    style={{ width: `${dimension.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule bg-paper-sunk/60 px-4 py-2 font-mono text-[10.5px] text-ink-muted sm:px-5">
        <span>3 notes</span>
        <span>anonymity set 2,847</span>
        <span>pool fee 6 STRK</span>
        <span className="hidden sm:inline">relayer active</span>
      </div>
    </div>
  )
}

function MiniRing({ value }: { value: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const filled = circumference * (value / 100)

  return (
    <div className="relative">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--color-paper-deep)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--color-veil)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="tabular text-[19px] font-semibold tracking-tight">{value}</span>
      </div>
    </div>
  )
}
