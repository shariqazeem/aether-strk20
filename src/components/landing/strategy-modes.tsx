'use client'

import { useState } from 'react'
import { Container, Reveal, SectionHeading } from '@/components/ui/primitives'

/**
 * The five strategy modes.
 *
 * Modes shift the weighting between expected return and privacy delta and
 * nothing else — they never relax the hard constraints. The card makes that
 * explicit with a weighting bar, because "privacy mode" in most products means
 * an unspecified vibe rather than a specific trade.
 */

interface Mode {
  id: string
  name: string
  tagline: string
  /** 0 = purely return-weighted, 1 = purely privacy-weighted. */
  privacyWeight: number
  behaviour: string
  suits: string
}

const MODES: Mode[] = [
  {
    id: 'PRIVACY_FIRST',
    name: 'Privacy first',
    tagline: 'Maximum anonymity, cost accepted',
    privacyWeight: 0.95,
    behaviour:
      'Takes the highest-entropy split and the widest timing window available, even when a cheaper route exists. Will sit idle rather than act inside a thin anonymity set.',
    suits: 'Large balances that should never become identifiable.',
  },
  {
    id: 'STEALTH_DCA',
    name: 'Stealth DCA',
    tagline: 'Accumulate without a cadence',
    privacyWeight: 0.78,
    behaviour:
      'Many small buys toward a target asset, deliberately irregular in both size and interval so no schedule can be inferred from the sequence.',
    suits: 'Building a position over weeks without announcing it.',
  },
  {
    id: 'WHALE_DISTRIBUTION',
    name: 'Whale distribution',
    tagline: 'Break the size signature',
    privacyWeight: 0.85,
    behaviour:
      'Fragments a large position into many decorrelated tranches across tiers, compacting notes before fragmentation starts to shrink the anonymity set.',
    suits: 'Positions large enough that the amount alone identifies you.',
  },
  {
    id: 'YIELD_MAX',
    name: 'Yield max',
    tagline: 'Return-weighted, floor respected',
    privacyWeight: 0.3,
    behaviour:
      'Prefers the best available return and accepts a lower privacy delta — but still refuses any action that would push the score below your floor.',
    suits: 'Working capital where yield leads and privacy is the constraint.',
  },
  {
    id: 'BALANCED',
    name: 'Balanced',
    tagline: 'Even weighting',
    privacyWeight: 0.55,
    behaviour:
      'Weights privacy delta and expected return equally, taking the higher-entropy option whenever the cost difference is marginal.',
    suits: 'A sensible default for a mixed portfolio.',
  },
]

export function StrategyModes() {
  const [active, setActive] = useState(0)
  const mode = MODES[active]

  return (
    <section id="strategies" className="scroll-mt-20 border-y border-rule bg-paper-raised py-28 sm:py-36">
      <Container>
        <SectionHeading
          eyebrow="Strategy modes"
          title="Five postures. One set of rules none of them can break."
          lede="A mode changes how Aether weighs return against privacy. It never changes the hard constraints — those hold in every mode, including the yield-seeking one."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-10">
          <Reveal>
            <ul
              role="tablist"
              aria-label="Strategy modes"
              className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {MODES.map((item, index) => {
                const selected = index === active
                return (
                  <li key={item.id} className="shrink-0 lg:shrink">
                    <button
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActive(index)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                        selected
                          ? 'border-veil-mid bg-veil-soft'
                          : 'border-rule bg-paper hover:border-rule-strong hover:bg-paper-sunk'
                      }`}
                    >
                      <span
                        className={`block text-[14px] font-medium ${selected ? 'text-veil-deep' : 'text-ink'}`}
                      >
                        {item.name}
                      </span>
                      <span className="mt-0.5 block whitespace-nowrap text-[12px] text-ink-faint lg:whitespace-normal">
                        {item.tagline}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <div className="card h-full p-7 sm:p-9">
              <h3 className="display-md text-[1.7rem]">{mode.name}</h3>

              <div className="mt-7">
                <div className="flex items-baseline justify-between text-[11.5px] tracking-wide text-ink-faint">
                  <span>Return-weighted</span>
                  <span>Privacy-weighted</span>
                </div>
                <div className="relative mt-2 h-1.5 rounded-full bg-paper-deep">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full veil-gradient transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${mode.privacyWeight * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper-raised bg-veil shadow-sm transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ left: `${mode.privacyWeight * 100}%` }}
                  />
                </div>
              </div>

              <dl className="mt-8 space-y-5">
                <div>
                  <dt className="eyebrow">What it does</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-ink-soft text-pretty">
                    {mode.behaviour}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Suits</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-ink-soft text-pretty">
                    {mode.suits}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 border-t border-rule pt-5">
                <p className="eyebrow">Holds in every mode</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    'Never unshields unless you ask',
                    'No exact amount reused within 48h',
                    'Refuses actions below your privacy floor',
                    'Compacts notes before fragmentation bites',
                  ].map((rule) => (
                    <li key={rule} className="flex items-start gap-2 text-[13px] text-ink-muted">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                      >
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          stroke="var(--color-good)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-pretty">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
