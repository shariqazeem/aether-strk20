'use client'

import { Container, Reveal, SectionHeading, StateBadge } from '@/components/ui/primitives'

/**
 * The claim, made inspectable: your ledger next to what a chain observer sees
 * of it, row for row. This panel ships inside the app — the landing page shows
 * a slice of the product, not an illustration of it.
 */

interface Row {
  time: string
  action: string
  detail: string
  asset: string
  amount: string
  observed: string
  observedNote: string
  /** The deposit genuinely is public — honesty beats a clean story. */
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
    detail: 'USDC → strkBTC via AVNU',
    asset: 'sBTC',
    amount: '0.03502',
    observed: 'Pool → executor → AMM',
    observedNote: 'Caller is the executor contract. No link to you.',
  },
  {
    time: '21:03',
    action: 'Private swap',
    detail: 'Second tranche, different size',
    asset: 'sBTC',
    amount: '0.02708',
    observed: 'Pool → executor → AMM',
    observedNote: 'Amount, owner and route stay inside the pool.',
  },
  {
    time: '02:38',
    action: 'Rebalance',
    detail: 'Note-to-note, internal',
    asset: 'sBTC',
    amount: '0.01104',
    observed: '—',
    observedNote: 'Nothing. No contract call, no event, no public leg.',
  },
  {
    time: '11:55',
    action: 'Stealth DCA',
    detail: 'Tranche 3 of 7',
    asset: 'sBTC',
    amount: '0.00918',
    observed: '—',
    observedNote: 'Nothing.',
  },
]

export function AttackerView() {
  return (
    <section id="attacker" className="scroll-mt-14 border-t border-rule py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Attacker view"
          title="Everything you did. Almost nothing they saw."
          lede="A privacy claim you can't inspect is marketing. Aether ships the adversary's console next to your own, built from the same data — check the asymmetry yourself."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Your ledger */}
          <Reveal>
            <div className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-rule px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-veil" />
                  <h3 className="text-[13.5px] font-semibold tracking-tight">Your ledger</h3>
                </div>
                <StateBadge state="private">encrypted to you</StateBadge>
              </header>

              <ul className="divide-y divide-rule">
                {ROWS.map((row, index) => (
                  <Reveal as="li" key={row.time} delay={index * 50} className="px-5 py-3.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{row.action}</p>
                        <p className="mt-0.5 truncate text-[12px] text-ink-faint">{row.detail}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular font-mono text-[12.5px] font-medium">
                          {row.amount} <span className="text-ink-faint">{row.asset}</span>
                        </p>
                        <p className="tabular mt-0.5 font-mono text-[11px] text-ink-faint">
                          {row.time}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Observer */}
          <Reveal delay={80}>
            <div className="card overflow-hidden bg-paper-sunk/40">
              <header className="flex items-center justify-between border-b border-rule px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-ink-faint" />
                  <h3 className="text-[13.5px] font-semibold tracking-tight">
                    What a chain observer sees
                  </h3>
                </div>
                <StateBadge state="neutral">public data</StateBadge>
              </header>

              <ul className="divide-y divide-rule">
                {ROWS.map((row, index) => (
                  <Reveal as="li" key={row.time} delay={index * 50} className="px-5 py-3.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[13.5px] font-medium ${
                            row.publiclyVisible ? 'text-exposed' : 'text-ink-faint'
                          }`}
                        >
                          {row.observed}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-ink-faint text-pretty">
                          {row.observedNote}
                        </p>
                      </div>
                      {row.publiclyVisible ? (
                        <StateBadge state="public">public</StateBadge>
                      ) : (
                        <span className="shrink-0 font-mono text-[11px] text-ink-faint">hidden</span>
                      )}
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-ink-muted text-pretty">
            <span className="font-medium text-ink">The deposit is public, and Aether says so.</span>{' '}
            It is the one moment your address appears — which is why shielding happens well ahead of
            the strategy it funds. Every private transaction is submitted by a relayer, so the
            sender field is the relayer&rsquo;s account for every user of the pool.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
