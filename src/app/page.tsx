'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalloutScene, OpeningScene } from '@/components/landing/scenes'
import { AttackerView } from '@/components/landing/attacker-view'
import {
  AetherMark,
  Button,
  Container,
  Hex,
  Reveal,
  SectionIndex,
  Segmented,
  StateBadge,
} from '@/components/ui/primitives'
import { POOL_ADDRESS, explorerContract } from '@/lib/strk20/config'

export default function LandingPage() {
  return (
    <div className="relative">
      <SiteNav />
      <OpeningScene />
      <CalloutScene />
      <ProtocolTicker />
      <Statement />
      <EngineSection />
      <AttackerView />
      <ProcessSection />
      <DisclosureSection />
      <ClosingCta />
      <SiteFooter />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

function SiteNav() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-rule">
      <Container>
        <nav className="flex h-13 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AetherMark size={24} />
            <span className="text-[15px] font-semibold tracking-tight">Aether</span>
          </Link>

          <div className="hidden items-center md:flex">
            {[
              ['Engine', '#engine'],
              ['Attacker view', '#attacker'],
              ['Process', '#process'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button href="https://github.com/shariqazeem/aether-strk20" variant="ghost" size="sm">
              GitHub
            </Button>
            <Button href="/app" size="sm">
              Open App
            </Button>
          </div>
        </nav>
      </Container>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/*  Protocol ticker                                                    */
/* ------------------------------------------------------------------ */

const TICKER_ITEMS = [
  'pool 0x040337b1…ffe812a',
  'fee 6 STRK · read live',
  'notes mature ~10 blocks',
  'relayer submits every private tx',
  'chain SN_MAIN',
  'starknet.js 10.4.0 · wallet api ≥ 0.10.3',
  'anonymity is a sequence property',
]

function ProtocolTicker() {
  const row = TICKER_ITEMS.map((item) => (
    <span key={item} className="flex shrink-0 items-center gap-10 pr-10">
      <span>{item}</span>
      <span className="text-white/25">·</span>
    </span>
  ))

  return (
    <div className="ticker border-y border-ink/90 bg-ink py-2.5 font-mono text-[11px] tracking-wider text-white/60">
      <div className="ticker-track">
        <div className="flex shrink-0">{row}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Statement                                                          */
/* ------------------------------------------------------------------ */

function Statement() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <Reveal>
            <p className="display-lg text-balance">
              Privacy is a sequence,
              <br />
              <span className="text-ink-faint">not a transaction.</span>
            </p>
          </Reveal>
          <div className="space-y-4 text-[15px] leading-relaxed text-ink-muted sm:text-[15.5px]">
            <Reveal delay={90}>
              <p className="text-pretty">
                Shield 1,000 USDC every Monday at 09:00 and every single transaction is
                cryptographically private. You still have no privacy — the pattern is the
                fingerprint: same amount, same cadence, same hour.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-pretty">
                Most tooling treats the pool as a waiting room. Value goes in, waits, comes out —
                and the moment it touches a public protocol, the link re-forms.{' '}
                <span className="font-medium text-ink">
                  Aether never leaves. It optimises the sequence itself.
                </span>
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  01 · Engine — one instrument panel, five rows                      */
/* ------------------------------------------------------------------ */

type ModeKey = 'PRIVACY_FIRST' | 'STEALTH_DCA' | 'WHALE_DISTRIBUTION' | 'YIELD_MAX' | 'BALANCED'

const MODES: Record<ModeKey, { weight: number; text: string }> = {
  PRIVACY_FIRST: {
    weight: 0.95,
    text: 'Highest-entropy splits, widest windows. Sits idle rather than act in a thin anonymity set.',
  },
  STEALTH_DCA: {
    weight: 0.78,
    text: 'Accumulates a target asset in small buys with no inferable schedule.',
  },
  WHALE_DISTRIBUTION: {
    weight: 0.85,
    text: 'Breaks a large position into decorrelated tranches; compacts notes before fragmentation bites.',
  },
  YIELD_MAX: {
    weight: 0.3,
    text: 'Prefers the best return — but still refuses any action below your privacy floor.',
  },
  BALANCED: {
    weight: 0.55,
    text: 'Weights privacy delta and expected return evenly. The default.',
  },
}

function EngineSection() {
  return (
    <section id="engine" className="scroll-mt-14 py-20 sm:py-28">
      <Container>
        <SectionIndex
          index="01"
          label="Engine"
          title="Deterministic. Seeded. Testable."
          lede="No Math.random, no ambient clock — every plan is reproducible, which is what lets the hard constraints be enforced by tests instead of promised in prose."
        />

        <Reveal delay={120}>
          <div className="panel mt-10">
            <EngineRow
              name="Effective privacy score"
              tag="5 terms · public weights"
              body="Computed client-side from live pool data and your own history. The formula ships in the README because a score you can't audit is a slogan."
              visual={<ScoreVisual />}
            />
            <EngineRow
              name="Amount splitter"
              tag="no round numbers"
              body="Splits sum exactly, avoid round human sizes, and never repeat an amount within 48 hours — the two easiest fingerprints to read off a chain."
              visual={<SplitVisual />}
            />
            <EngineRow
              name="Timing windows"
              tag="inter-arrival entropy"
              body="Execution windows are de-periodised against your own history and background pool traffic. Clockwork cadence scores low and gets replanned."
              visual={<TimingVisual />}
            />
            <EngineRow
              name="Strategy modes"
              tag="weights only"
              body="A mode re-weights return against privacy delta. No mode can unshield, reuse an amount, or cross the floor."
              visual={<ModesVisual />}
            />
            <EngineRow
              name="Exit guarantee"
              tag="enforced pre-signature"
              body="A withdraw is only ever permitted to a helper contract inside the same atomic transaction. Anything else throws before you're asked to sign."
              visual={<GuaranteeVisual />}
              last
            />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

function EngineRow({
  name,
  tag,
  body,
  visual,
  last = false,
}: {
  name: string
  tag: string
  body: string
  visual: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`grid gap-5 p-5 sm:p-6 md:grid-cols-[210px_1fr_290px] md:items-center md:gap-8 ${
        last ? '' : 'border-b border-rule'
      }`}
    >
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight">{name}</h3>
        <p className="mono-label mt-1.5 normal-case tracking-wide">{tag}</p>
      </div>
      <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-muted text-pretty">{body}</p>
      <div className="md:justify-self-end md:w-[290px]">{visual}</div>
    </div>
  )
}

function ScoreVisual() {
  const dims = [
    ['A', 0.3, 82],
    ['H_amt', 0.25, 91],
    ['H_time', 0.2, 76],
    ['100−U', 0.15, 86],
    ['100−R', 0.1, 94],
  ] as const

  return (
    <div className="space-y-1.5">
      {dims.map(([label, weight, value]) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="w-12 shrink-0 font-mono text-[10px] text-ink-muted">{label}</span>
          <div className="h-[3px] flex-1 rounded-full bg-paper-deep">
            <div className="h-full rounded-full bg-veil" style={{ width: `${value}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-[10px] text-ink-faint">
            ×{weight.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SplitVisual() {
  return (
    <div className="space-y-1.5 font-mono text-[11px]">
      <div className="flex items-center justify-between rounded-md bg-paper-sunk px-2.5 py-1.5">
        <span className="tabular text-ink-faint line-through">1,000.00</span>
        <span className="text-[10px] font-semibold text-exposed">fingerprint</span>
      </div>
      {[
        ['1,412.77', 72],
        ['987.14', 50],
        ['1,782.53', 90],
      ].map(([amount, width]) => (
        <div key={amount} className="flex items-center gap-2.5">
          <span className="tabular w-16 shrink-0">{amount}</span>
          <div className="h-[3px] flex-1 rounded-full bg-paper-deep">
            <div className="h-full rounded-full bg-veil" style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TimingVisual() {
  const regular = [8, 23, 38, 53, 68, 83]
  const irregular = [5, 16, 44, 52, 77, 90]

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex justify-between font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
          <span className="line-through">cadence</span>
          <span className="text-exposed">detectable</span>
        </div>
        <svg viewBox="0 0 100 8" className="mt-1 h-3 w-full" aria-hidden="true">
          {regular.map((x) => (
            <rect key={x} x={x} y="0.5" width="1.4" height="7" rx="0.7" fill="var(--color-ink-faint)" />
          ))}
        </svg>
      </div>
      <div>
        <div className="flex justify-between font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
          <span>aether</span>
          <span className="text-good">high entropy</span>
        </div>
        <svg viewBox="0 0 100 8" className="mt-1 h-3 w-full" aria-hidden="true">
          {irregular.map((x) => (
            <rect key={x} x={x} y="0.5" width="1.4" height="7" rx="0.7" fill="var(--color-veil)" />
          ))}
        </svg>
      </div>
    </div>
  )
}

function ModesVisual() {
  const [mode, setMode] = useState<ModeKey>('BALANCED')
  const active = MODES[mode]

  return (
    <div>
      <Segmented
        ariaLabel="Strategy mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'PRIVACY_FIRST', label: 'Privacy' },
          { value: 'STEALTH_DCA', label: 'DCA' },
          { value: 'WHALE_DISTRIBUTION', label: 'Whale' },
          { value: 'YIELD_MAX', label: 'Yield' },
          { value: 'BALANCED', label: 'Even' },
        ]}
      />
      <p className="mt-2.5 min-h-[3.25rem] text-[12px] leading-snug text-ink-muted text-pretty">
        {active.text}
      </p>
      <div className="mt-1.5">
        <div className="flex justify-between font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
          <span>return</span>
          <span>privacy</span>
        </div>
        <div className="relative mt-1 h-[3px] rounded-full bg-paper-deep">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-veil transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ width: `${active.weight * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function GuaranteeVisual() {
  return (
    <pre className="overflow-x-auto rounded-xl bg-ink p-3.5 font-mono text-[10.5px] leading-relaxed text-white/85">
      {`assertNeverUnshields(actions)
// withdraw to a non-helper
// address → throws`}
    </pre>
  )
}

/* ------------------------------------------------------------------ */
/*  03 · Process                                                       */
/* ------------------------------------------------------------------ */

function ProcessSection() {
  const steps = [
    {
      label: 'Shield',
      badge: <StateBadge state="public">public · once</StateBadge>,
      body: 'One deposit into the pool — the only moment your address appears. Done well ahead of anything it funds, so nothing on-chain connects the two.',
    },
    {
      label: 'Plan',
      badge: <StateBadge state="neutral">client-side</StateBadge>,
      body: 'The engine sizes and times every action against your history and live pool traffic, and refuses anything below your privacy floor.',
    },
    {
      label: 'Execute',
      badge: <StateBadge state="private">private</StateBadge>,
      body: 'Your wallet proves and submits through a relayer. Results settle into fresh notes without value ever leaving the shielded environment.',
    },
  ]

  return (
    <section id="process" className="scroll-mt-14 py-20 sm:py-28">
      <Container>
        <SectionIndex
          index="03"
          label="Process"
          title="Three steps. One is public, by design."
          lede="Aether never holds viewing keys and never generates proofs — your wallet does both. The app's job is deciding what is worth signing."
        />

        <Reveal delay={120}>
          <div className="panel mt-10 grid md:grid-cols-3 md:divide-x md:divide-rule">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`p-6 sm:p-7 ${index < steps.length - 1 ? 'border-b border-rule md:border-b-0' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="mono-label">0{index + 1} · {step.label}</span>
                  {step.badge}
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-ink-muted text-pretty">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  04 · Disclosure — receipts, not cards                              */
/* ------------------------------------------------------------------ */

function DisclosureSection() {
  const statements = [
    {
      claim: 'private balance of USDC ≥ 10,000',
      reveals: 'a single boolean — not the balance',
      id: 'stmt 0x8f2a…c41',
    },
    {
      claim: 'strategy returned +8.4% since June',
      reveals: 'the return — not the positions',
      id: 'stmt 0x3d19…7be',
    },
    {
      claim: 'no interaction with address set S',
      reveals: 'non-membership — nothing else',
      id: 'stmt 0xb460…22f',
    },
  ]

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionIndex
          index="04"
          label="Disclosure"
          title="Prove the one thing. Keep the key."
          lede="Counterparties usually need a single fact, not your history. Hand over the fact as a statement — the viewing key stays in your wallet."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {statements.map((statement, index) => (
            <Reveal key={statement.id} delay={index * 70}>
              <div className="rounded-2xl border border-rule bg-paper-raised p-5 font-mono">
                <p className="text-[9.5px] tracking-[0.14em] text-ink-faint uppercase">Statement</p>
                <p className="mt-2 min-h-[2.6rem] text-[12.5px] leading-snug font-medium text-ink">
                  {statement.claim}
                </p>
                <div className="mt-4 border-t border-dashed border-rule-strong pt-3">
                  <p className="text-[9.5px] tracking-[0.14em] text-ink-faint uppercase">Reveals</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">
                    {statement.reveals}
                  </p>
                  <p className="mt-3 text-[10px] text-ink-faint">{statement.id} · verified ✓</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  CTA + footer                                                       */
/* ------------------------------------------------------------------ */

function ClosingCta() {
  return (
    <section className="border-t border-rule py-24 sm:py-32">
      <Container>
        <div className="max-w-3xl">
          <Reveal blur>
            <h2 className="display-lg text-balance">
              Your capital shouldn&rsquo;t{' '}
              <span className="text-ink-faint">announce itself.</span>
            </h2>
          </Reveal>
          <Reveal delay={110}>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Button href="/app" size="lg">
                Open App
              </Button>
              <Button
                href="https://github.com/shariqazeem/aether-strk20"
                variant="secondary"
                size="lg"
              >
                Read the source
              </Button>
            </div>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-8 font-mono text-[11px] tracking-wide text-ink-faint">
              pool <Hex value={POOL_ADDRESS} href={explorerContract(POOL_ADDRESS)} chars={6} /> ·
              MIT · STRK20 Private Sprint
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-rule py-8">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <AetherMark size={20} />
            <span className="text-[13px] font-semibold tracking-tight">Aether</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-muted">
            <a
              href="https://strk20-by-example.org/what-is-strk20"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors hover:text-ink"
            >
              STRK20 docs
            </a>
            <a
              href="https://github.com/shariqazeem/aether-strk20"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors hover:text-ink"
            >
              Source
            </a>
            <Link href="/app" className="transition-colors hover:text-ink">
              Open App
            </Link>
          </div>

          <p className="text-[11.5px] text-ink-faint">
            Deposits and withdrawals are public by design.
          </p>
        </div>
      </Container>
    </footer>
  )
}
