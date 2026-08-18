'use client'

import { Container, Reveal, SectionIndex, StateBadge } from '@/components/ui/primitives'

/**
 * The claim, made inspectable: your ledger and the chain's view of it, row for
 * row inside one panel. The observer column is mostly em-dashes — that empty
 * space is the product, so the layout gives it room instead of decorating it.
 */

interface Row {
  time: string
  action: string
  detail: string
  amount: string
  observed: string
  observedNote: string
  publiclyVisible?: boolean
}

const ROWS: Row[] = [
  {
    time: '09:12:44',
    action: 'Shield',
    detail: 'Deposit into the pool',
    amount: '4,182.44 USDC',
    observed: 'Deposit · 4,182.44 USDC',
    observedNote: 'Your address appears here, and only here.',
    publiclyVisible: true,
  },
  {
    time: '14:47:03',
    action: 'Private swap',
    detail: 'USDC → strkBTC via AVNU',
    amount: '0.03502 sBTC',
    observed: 'executor → AMM',
    observedNote: 'Caller is the executor contract. No link to you.',
  },
  {
    time: '21:03:57',
    action: 'Private swap',
    detail: 'Second tranche, different size',
    amount: '0.02708 sBTC',
    observed: 'executor → AMM',
    observedNote: 'Amount, owner and route stay inside the pool.',
  },
  {
    time: '02:38:19',
    action: 'Rebalance',
    detail: 'Note-to-note, internal',
    amount: '0.01104 sBTC',
    observed: '—',
    observedNote: 'No contract call. No event. No public leg.',
  },
  {
    time: '11:55:36',
    action: 'Stealth DCA',
    detail: 'Tranche 3 of 7',
    amount: '0.00918 sBTC',
    observed: '—',
    observedNote: 'Nothing.',
  },
]

export function AttackerView() {
  return (
    <section id="attacker" className="scroll-mt-14 py-20 sm:py-28">
      <Container>
        <SectionIndex
          index="02"
          label="Attacker"
          title="Everything you did. Almost nothing they saw."
          lede="A privacy claim you can't inspect is marketing. This panel ships inside the app, built from the same data — check the asymmetry yourself."
        />

        <Reveal delay={120}>
          <div className="panel mt-10">
            {/* Panel header */}
            <div className="grid border-b border-rule md:grid-cols-2">
              <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3 md:border-r md:border-b-0">
                <span className="mono-label">Your ledger</span>
                <StateBadge state="private">encrypted to you</StateBadge>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="mono-label">Chain observer</span>
                <StateBadge state="neutral">public data</StateBadge>
              </div>
            </div>

            {ROWS.map((row, index) => (
              <Reveal
                key={row.time}
                delay={index * 50}
                className={index < ROWS.length - 1 ? 'border-b border-rule' : ''}
              >
                <div className="grid md:grid-cols-2">
                  {/* Yours */}
                  <div className="flex items-baseline justify-between gap-4 border-b border-rule/60 px-5 py-3.5 md:border-r md:border-b-0">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="tabular shrink-0 font-mono text-[10.5px] text-ink-faint">
                        {row.time}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{row.action}</p>
                        <p className="truncate text-[11.5px] text-ink-faint">{row.detail}</p>
                      </div>
                    </div>
                    <span className="tabular shrink-0 font-mono text-[12px] font-medium">
                      {row.amount}
                    </span>
                  </div>

                  {/* Theirs */}
                  <div className="flex items-baseline justify-between gap-4 bg-paper-sunk/50 px-5 py-3.5">
                    <div className="min-w-0">
                      <p
                        className={`truncate font-mono text-[12.5px] ${
                          row.publiclyVisible
                            ? 'font-medium text-ember'
                            : row.observed === '—'
                              ? 'text-ink-faint'
                              : 'text-ink-muted'
                        }`}
                      >
                        {row.observed}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-faint">
                        {row.observedNote}
                      </p>
                    </div>
                    {row.publiclyVisible && (
                      <StateBadge state="public">public</StateBadge>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-ink-muted text-pretty">
            <span className="font-medium text-ink">The deposit is public, and Aether says so.</span>{' '}
            It is the one moment your address appears — which is why shielding happens well ahead
            of the strategy it funds. Every private transaction is submitted by a relayer, so the
            sender field is the relayer&rsquo;s account for every user of the pool.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
