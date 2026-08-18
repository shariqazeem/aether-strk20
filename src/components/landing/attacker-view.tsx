'use client'

import { useScrollProgress } from '@/lib/hooks/use-motion'
import { Container, Eyebrow, Reveal, StateBadge } from '@/components/ui/primitives'

/**
 * The claim, made inspectable.
 *
 * Left: what actually happened. Right: everything a chain observer can see of
 * it. The rows are paired one-to-one and revealed together as you scroll, so
 * the asymmetry accumulates in front of you rather than being asserted in a
 * paragraph. This is the same panel that ships inside the app — the landing
 * page is a slice of the product, not a brochure for it.
 */

interface Row {
  time: string
  /** What the user did. */
  action: string
  detail: string
  asset: string
  amount: string
  /** What the chain reveals. */
  observed: string
  observedNote: string
  /** A deposit is genuinely public — honesty matters more than a clean story. */
  publiclyVisible?: boolean
}

const ROWS: Row[] = [
  {
    time: '09:12',
    action: 'Shield',
    detail: 'Deposit into the pool',
    asset: 'USDC',
    amount: '4,182.44',
    observed: 'Deposit — 4,182.44 USDC',
    observedNote: 'Public. Your address is visible here, and only here.',
    publiclyVisible: true,
  },
  {
    time: '14:47',
    action: 'Private swap',
    detail: 'USDC → ETH via AVNU',
    asset: 'ETH',
    amount: '0.7431',
    observed: 'Pool → executor → AMM',
    observedNote: 'Caller is the executor contract. No link to you.',
  },
  {
    time: '21:03',
    action: 'Private lend',
    detail: 'Deposit to Vesu',
    asset: 'USDC',
    amount: '1,617.09',
    observed: 'Pool → helper',
    observedNote: 'Amount, asset and owner all stay inside the pool.',
  },
  {
    time: '02:38',
    action: 'Rebalance',
    detail: 'Note-to-note, internal',
    asset: 'ETH',
    amount: '0.2094',
    observed: '—',
    observedNote: 'Nothing. No contract call, no event, no public leg.',
  },
  {
    time: '11:55',
    action: 'Stealth DCA',
    detail: 'Tranche 3 of 7',
    asset: 'ETH',
    amount: '0.1188',
    observed: '—',
    observedNote: 'Nothing.',
  },
]

export function AttackerView() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  // Rows arrive as the section is scrubbed through, between 18% and 78%.
  const span = 0.6
  const visibleCount = Math.max(
    0,
    Math.min(ROWS.length, Math.ceil(((progress - 0.18) / span) * ROWS.length)),
  )

  return (
    <section ref={ref} className="relative py-28 sm:py-36">
      <Container>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>Attacker view</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-md mt-4 text-balance">
              Everything you did. <span className="text-veil-gradient">Almost nothing they saw.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-muted text-pretty">
              A privacy claim you cannot inspect is a marketing claim. Aether ships the
              adversary&rsquo;s console next to your own, built from the same data, so you can
              check the asymmetry yourself instead of trusting it.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {/* Your side */}
          <div className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-rule px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-veil" />
                <h3 className="text-[13px] font-semibold tracking-tight">Your ledger</h3>
              </div>
              <StateBadge state="private">encrypted to you</StateBadge>
            </header>

            <ul className="divide-y divide-rule">
              {ROWS.map((row, index) => {
                const shown = index < visibleCount
                return (
                  <li
                    key={row.time}
                    className="px-5 py-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      opacity: shown ? 1 : 0.12,
                      transform: shown ? 'none' : 'translateY(7px)',
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium">{row.action}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-faint">{row.detail}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular font-mono text-[13.5px] font-medium">
                          {row.amount}
                          <span className="ml-1 text-ink-faint">{row.asset}</span>
                        </p>
                        <p className="tabular mt-0.5 font-mono text-[11.5px] text-ink-faint">
                          {row.time}
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Their side */}
          <div className="card overflow-hidden bg-paper-sunk/55">
            <header className="flex items-center justify-between border-b border-rule px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-ink-faint" />
                <h3 className="text-[13px] font-semibold tracking-tight">
                  What a chain observer sees
                </h3>
              </div>
              <StateBadge state="neutral">public data</StateBadge>
            </header>

            <ul className="divide-y divide-rule">
              {ROWS.map((row, index) => {
                const shown = index < visibleCount
                return (
                  <li
                    key={row.time}
                    className="px-5 py-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      opacity: shown ? 1 : 0.12,
                      transform: shown ? 'none' : 'translateY(7px)',
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[14px] font-medium ${
                            row.publiclyVisible ? 'text-exposed' : 'text-ink-faint'
                          }`}
                        >
                          {row.observed}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-faint text-pretty">
                          {row.observedNote}
                        </p>
                      </div>
                      {row.publiclyVisible ? (
                        <StateBadge state="public">public</StateBadge>
                      ) : (
                        <span className="shrink-0 font-mono text-[11.5px] text-ink-faint">
                          hidden
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <Reveal delay={120}>
          <p className="mt-7 max-w-3xl text-[13.5px] leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">The deposit is public, and Aether says so.</span>{' '}
            It is the one moment your address appears, which is exactly why shielding is a separate
            transaction that happens well ahead of the strategy it funds — nothing on-chain ties the
            two together. Every private transaction is submitted by a relayer, so the sender field
            is the relayer&rsquo;s account for every user of the pool.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
