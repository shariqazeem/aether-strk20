'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppMockup } from '@/components/landing/app-mockup'
import { AttackerView } from '@/components/landing/attacker-view'
import {
  AetherMark,
  Button,
  Container,
  Hex,
  Reveal,
  SectionHeading,
  Segmented,
  StateBadge,
} from '@/components/ui/primitives'
import { POOL_ADDRESS, explorerContract } from '@/lib/strk20/config'

export default function LandingPage() {
  return (
    <div className="relative">
      <SiteNav />
      <Hero />
      <StatStrip />
      <BentoSection />
      <HowItWorks />
      <AttackerView />
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
        <nav className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AetherMark />
            <span className="text-[15px] font-semibold tracking-tight">Aether</span>
          </Link>

          <div className="hidden items-center md:flex">
            {[
              ['Product', '#product'],
              ['How it works', '#how'],
              ['Attacker view', '#attacker'],
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
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="hero-wash relative">
      <Container>
        <div className="pt-16 pb-10 sm:pt-24 sm:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal blur>
              <span className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3 py-1.5 text-[12px] font-medium text-ink-soft">
                <span className="size-1.5 rounded-full bg-good" />
                Live on Starknet mainnet · built on STRK20
              </span>
            </Reveal>

            <Reveal blur delay={70}>
              <h1 className="display-xl mt-6 text-balance">
                Shield once. <span className="text-veil">Stay unseen.</span>
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-ink-muted text-pretty sm:text-[18px]">
                Aether is a private portfolio engine. Swaps, DCA and rebalancing run entirely
                inside the STRK20 pool — sized and timed so your behaviour never becomes a
                fingerprint.
              </p>
            </Reveal>

            <Reveal delay={230}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                <Button href="/app" size="lg">
                  Open App
                </Button>
                <Button
                  href="https://github.com/shariqazeem/aether-strk20"
                  variant="secondary"
                  size="lg"
                >
                  View source
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={320} className="mx-auto mt-12 max-w-4xl sm:mt-16">
            <AppMockup />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Stat strip                                                         */
/* ------------------------------------------------------------------ */

function StatStrip() {
  const stats = [
    ['0', 'viewing keys held — the wallet keeps them'],
    ['0', 'custom Cairo — audited anonymizers only'],
    ['81', 'engine tests on the hard constraints'],
    ['6 STRK', 'pool fee, read live from the contract'],
  ]

  return (
    <section className="border-y border-rule">
      <Container>
        <dl className="grid grid-cols-2 divide-x divide-rule lg:grid-cols-4">
          {stats.map(([value, label], index) => (
            <Reveal
              key={label}
              delay={index * 60}
              className={`px-4 py-6 sm:px-6 ${index >= 2 ? 'border-t border-rule lg:border-t-0' : ''}`}
            >
              <dd className="tabular text-[22px] font-semibold tracking-tight">{value}</dd>
              <dt className="mt-1 text-[12.5px] leading-snug text-ink-muted text-pretty">{label}</dt>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Bento                                                              */
/* ------------------------------------------------------------------ */

type ModeKey = 'PRIVACY_FIRST' | 'STEALTH_DCA' | 'WHALE_DISTRIBUTION' | 'YIELD_MAX' | 'BALANCED'

const MODES: Record<ModeKey, { weight: number; text: string }> = {
  PRIVACY_FIRST: {
    weight: 0.95,
    text: 'Highest-entropy splits, widest windows. Sits idle rather than act inside a thin anonymity set.',
  },
  STEALTH_DCA: {
    weight: 0.78,
    text: 'Accumulates a target asset in small buys with no inferable schedule — irregular in size and interval.',
  },
  WHALE_DISTRIBUTION: {
    weight: 0.85,
    text: 'Breaks a large position into decorrelated tranches, compacting notes before fragmentation bites.',
  },
  YIELD_MAX: {
    weight: 0.3,
    text: 'Prefers the best return, but still refuses any action that would breach your privacy floor.',
  },
  BALANCED: {
    weight: 0.55,
    text: 'Weights privacy delta and expected return evenly. The sensible default.',
  },
}

function BentoSection() {
  return (
    <section id="product" className="scroll-mt-14 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="The engine"
          title="Privacy is a sequence, not a transaction."
          lede="Shield 1,000 USDC every Monday at 09:00 and each transaction is cryptographically private — and the pattern still gives you away. Aether optimises the sequence."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          <BentoCell span={3} delay={0}>
            <ScoreCell />
          </BentoCell>
          <BentoCell span={3} delay={60}>
            <StrategyCell />
          </BentoCell>
          <BentoCell span={2} delay={0}>
            <SplitterCell />
          </BentoCell>
          <BentoCell span={2} delay={60}>
            <TimingCell />
          </BentoCell>
          <BentoCell span={2} delay={120}>
            <GuaranteeCell />
          </BentoCell>
          <BentoCell span={6} delay={0}>
            <LoopCell />
          </BentoCell>
        </div>
      </Container>
    </section>
  )
}

function BentoCell({
  children,
  span,
  delay,
}: {
  children: React.ReactNode
  span: 2 | 3 | 6
  delay: number
}) {
  const spans = { 2: 'md:col-span-2', 3: 'md:col-span-3', 6: 'md:col-span-6' }
  return (
    <Reveal delay={delay} className={spans[span]}>
      <div className="card flex h-full flex-col p-6">{children}</div>
    </Reveal>
  )
}

function CellTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-[13px] leading-snug text-ink-muted text-pretty">{sub}</p>
    </div>
  )
}

function ScoreCell() {
  const dimensions = [
    { label: 'Anonymity set', weight: '0.30', value: 82 },
    { label: 'Amount entropy', weight: '0.25', value: 91 },
    { label: 'Timing entropy', weight: '0.20', value: 76 },
    { label: 'Behaviour (inv.)', weight: '0.15', value: 86 },
    { label: 'Exit corr. (inv.)', weight: '0.10', value: 94 },
  ]

  return (
    <>
      <CellTitle
        title="A score you can audit"
        sub="Five weighted terms, computed client-side from live pool data. The formula is in the README — a score you can't check is a slogan."
      />
      <ul className="mt-5 flex-1 space-y-2.5">
        {dimensions.map((dimension) => (
          <li key={dimension.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-[12.5px] font-medium text-ink-soft">{dimension.label}</span>
              <span className="tabular font-mono text-[11px] text-ink-muted">
                ×{dimension.weight}
              </span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-paper-deep">
              <div className="h-full rounded-full bg-veil" style={{ width: `${dimension.value}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <code className="mt-4 block rounded-lg bg-paper-sunk px-3 py-2 font-mono text-[10.5px] leading-relaxed text-ink-muted">
        S = 0.30·A + 0.25·H<sub>amt</sub> + 0.20·H<sub>time</sub> + 0.15·(100−U) + 0.10·(100−R)
      </code>
    </>
  )
}

function StrategyCell() {
  const [mode, setMode] = useState<ModeKey>('BALANCED')
  const active = MODES[mode]

  return (
    <>
      <CellTitle
        title="Five modes, one set of rules"
        sub="A mode only re-weights return against privacy. The hard constraints hold in every one."
      />
      <div className="mt-4">
        <Segmented
          ariaLabel="Strategy mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'PRIVACY_FIRST', label: 'Privacy' },
            { value: 'STEALTH_DCA', label: 'DCA' },
            { value: 'WHALE_DISTRIBUTION', label: 'Whale' },
            { value: 'YIELD_MAX', label: 'Yield' },
            { value: 'BALANCED', label: 'Balanced' },
          ]}
        />
      </div>
      <p className="mt-4 min-h-[3.5rem] flex-1 text-[13.5px] leading-relaxed text-ink-soft text-pretty">
        {active.text}
      </p>
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-medium text-ink-faint">
          <span>Return</span>
          <span>Privacy</span>
        </div>
        <div className="relative mt-1.5 h-1 rounded-full bg-paper-deep">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-veil transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ width: `${active.weight * 100}%` }}
          />
        </div>
        <ul className="mt-4 grid gap-1.5 border-t border-rule pt-3.5 sm:grid-cols-2">
          {[
            'Never unshields unasked',
            'No amount reused in 48h',
            'Privacy floor enforced',
            'Notes compacted early',
          ].map((rule) => (
            <li key={rule} className="flex items-center gap-1.5 text-[12px] text-ink-muted">
              <Check />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function SplitterCell() {
  const splits = [
    { amount: '1,412.77', width: 72 },
    { amount: '987.14', width: 50 },
    { amount: '1,782.53', width: 90 },
  ]

  return (
    <>
      <CellTitle title="No round numbers" sub="Amounts are split to blend with pool activity." />
      <div className="mt-5 flex-1 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-paper-sunk px-3 py-2">
          <span className="tabular font-mono text-[12.5px] text-ink-faint line-through">
            1,000.00
          </span>
          <span className="text-[11px] font-semibold text-exposed">fingerprint</span>
        </div>
        {splits.map((split) => (
          <div key={split.amount}>
            <span className="tabular font-mono text-[12.5px] font-medium">{split.amount}</span>
            <div className="mt-1 h-1 rounded-full bg-paper-deep">
              <div className="h-full rounded-full bg-veil" style={{ width: `${split.width}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11.5px] leading-snug text-ink-faint">
        Sums exactly. Never repeats an amount within 48 hours.
      </p>
    </>
  )
}

function TimingCell() {
  const regular = [10, 25, 40, 55, 70, 85]
  const irregular = [7, 18, 46, 54, 79, 92]

  return (
    <>
      <CellTitle title="No cadence" sub="Windows are irregular against your own history and pool traffic." />
      <div className="mt-5 flex-1 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-ink-faint line-through">
              Every Monday, 09:00
            </span>
            <span className="text-[11px] font-semibold text-exposed">detectable</span>
          </div>
          <svg viewBox="0 0 100 10" className="mt-1.5 h-4 w-full" aria-hidden="true">
            {regular.map((x) => (
              <rect key={x} x={x} y="1" width="1.6" height="8" rx="0.8" fill="var(--color-ink-faint)" />
            ))}
          </svg>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-ink-soft">Aether&rsquo;s windows</span>
            <span className="text-[11px] font-semibold text-good">high entropy</span>
          </div>
          <svg viewBox="0 0 100 10" className="mt-1.5 h-4 w-full" aria-hidden="true">
            {irregular.map((x) => (
              <rect key={x} x={x} y="1" width="1.6" height="8" rx="0.8" fill="var(--color-veil)" />
            ))}
          </svg>
        </div>
      </div>
      <p className="mt-4 text-[11.5px] leading-snug text-ink-faint">
        Inter-arrival entropy is a scored term, not a vibe.
      </p>
    </>
  )
}

function GuaranteeCell() {
  return (
    <>
      <CellTitle title="Never unshields" sub="Enforced in code, immediately before signature." />
      <div className="mt-5 flex-1">
        <pre className="overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[11px] leading-relaxed text-white/90">
          {`assertNeverUnshields(
  actions, allowlist
)
// withdraw to a non-helper
// address → throws`}
        </pre>
      </div>
      <p className="mt-4 text-[11.5px] leading-snug text-ink-faint">
        Unshielding exists only as a separate, explicit user request.
      </p>
    </>
  )
}

function LoopCell() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[280px_1fr]">
      <CellTitle
        title="Capital never exits"
        sub="The pool routes value to a helper's privacy_invoke and credits the result into a fresh note — one atomic transaction. Observers see the pool and the helper. Never you."
      />
      <div className="overflow-x-auto">
        <svg viewBox="0 0 760 132" className="w-full min-w-[560px]" role="img" aria-label="Value flows from the wallet into the pool and cycles between notes and DeFi without exiting">
          <rect x="180" y="8" width="572" height="100" rx="14" fill="var(--color-veil-soft)" stroke="var(--color-veil-mid)" strokeDasharray="3 4" />
          <text x="196" y="28" fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-veil-deep)">
            STRK20 shielded pool
          </text>

          <LoopNode x={8} y={40} w={130} label="Wallet" sub="one deposit" tone="gray" />
          <LoopNode x={200} y={40} w={130} label="Note" sub="private" tone="veil" />
          <LoopNode x={390} y={40} w={170} label="privacy_invoke" sub="AVNU · Ekubo" tone="veil" />
          <LoopNode x={610} y={40} w={126} label="New note" sub="private" tone="veil" />

          <LoopArrow x1={138} x2={200} />
          <LoopArrow x1={330} x2={390} />
          <LoopArrow x1={560} x2={610} />

          <path
            d="M 673 92 C 673 122, 265 122, 265 92"
            fill="none"
            stroke="var(--color-veil)"
            strokeWidth="1.5"
            markerEnd="url(#loop-arrow)"
          />
          <defs>
            <marker id="loop-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7" fill="none" stroke="var(--color-veil)" strokeWidth="1.3" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  )
}

function LoopNode({
  x,
  y,
  w,
  label,
  sub,
  tone,
}: {
  x: number
  y: number
  w: number
  label: string
  sub: string
  tone: 'gray' | 'veil'
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={44}
        rx={10}
        fill={tone === 'veil' ? 'white' : 'var(--color-paper-sunk)'}
        stroke="var(--color-rule-strong)"
      />
      <text x={x + w / 2} y={y + 19} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-ink)">
        {label}
      </text>
      <text x={x + w / 2} y={y + 33} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--color-ink-muted)">
        {sub}
      </text>
    </g>
  )
}

function LoopArrow({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <line
      x1={x1}
      y1={62}
      x2={x2 - 2}
      y2={62}
      stroke="var(--color-ink-faint)"
      strokeWidth="1.5"
      markerEnd="url(#loop-arrow)"
    />
  )
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="var(--color-good)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  How it works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Shield',
      body: 'One public deposit into the pool. The only moment your address appears — done well ahead of anything it funds, so nothing on-chain connects the two.',
      badge: <StateBadge state="public">public · once</StateBadge>,
    },
    {
      number: '02',
      title: 'Plan',
      body: 'The engine sizes and times every action against your history and live pool traffic. Deterministic, seeded, reproducible — and it refuses actions below your privacy floor.',
      badge: <StateBadge state="neutral">client-side</StateBadge>,
    },
    {
      number: '03',
      title: 'Execute privately',
      body: 'Your wallet proves and submits through a relayer. Swaps and rebalances settle back into fresh notes without value ever leaving the shielded environment.',
      badge: <StateBadge state="private">private</StateBadge>,
    },
  ]

  return (
    <section id="how" className="scroll-mt-14 border-t border-rule bg-paper-sunk/50 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps. One is public, by design."
          lede="Aether never holds viewing keys and never generates proofs — your wallet does both. The app's job is deciding what's worth signing."
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal as="li" key={step.number} delay={index * 80}>
              <div className="card flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-ink-faint">{step.number}</span>
                  {step.badge}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted text-pretty">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Disclosure                                                         */
/* ------------------------------------------------------------------ */

function DisclosureSection() {
  const statements = [
    { claim: 'Private balance of USDC ≥ 10,000', reveals: 'A single boolean. Not the balance.' },
    { claim: 'This strategy returned +8.4% since June', reveals: 'The return. Not the positions.' },
    { claim: 'No interaction with any address in set S', reveals: 'Non-membership. Nothing else.' },
  ]

  return (
    <section className="border-t border-rule py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Selective disclosure"
          title="Prove the one thing. Keep the key."
          lede="Counterparties usually need a single fact, not your history. Hand over the fact as a statement — the viewing key stays in your wallet."
        />
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {statements.map((statement, index) => (
            <Reveal as="li" key={statement.claim} delay={index * 80}>
              <div className="card flex h-full flex-col p-6">
                <span className="list-header">Statement</span>
                <p className="mt-2.5 flex-1 text-[15px] leading-snug font-medium text-pretty">
                  {statement.claim}
                </p>
                <div className="mt-4 border-t border-rule pt-3.5">
                  <span className="list-header">Reveals</span>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">{statement.reveals}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  CTA + footer                                                       */
/* ------------------------------------------------------------------ */

function ClosingCta() {
  return (
    <section className="border-t border-rule bg-paper-sunk/50 py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal blur>
            <h2 className="display-lg text-balance">
              Your capital shouldn&rsquo;t announce itself.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-ink-muted text-pretty">
              Connect a privacy-enabled wallet, shield once, and let the engine handle sizing and
              timing from there.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
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
        </div>
      </Container>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-rule py-12">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <AetherMark size={22} />
              <span className="text-[14px] font-semibold tracking-tight">Aether</span>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted text-pretty">
              Private portfolio engine on the STRK20 pool, Starknet mainnet.
            </p>
            <div className="mt-3">
              <Hex value={POOL_ADDRESS} href={explorerContract(POOL_ADDRESS)} chars={6} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-6 text-[13px]">
            <div>
              <p className="list-header">Protocol</p>
              <ul className="mt-2.5 space-y-2">
                <li>
                  <a
                    href={explorerContract(POOL_ADDRESS)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink-muted transition-colors hover:text-ink"
                  >
                    STRK20 pool
                  </a>
                </li>
                <li>
                  <a
                    href="https://strk20-by-example.org/what-is-strk20"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink-muted transition-colors hover:text-ink"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="list-header">Project</p>
              <ul className="mt-2.5 space-y-2">
                <li>
                  <a
                    href="https://github.com/shariqazeem/aether-strk20"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink-muted transition-colors hover:text-ink"
                  >
                    Source
                  </a>
                </li>
                <li>
                  <Link href="/app" className="text-ink-muted transition-colors hover:text-ink">
                    Open App
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-5 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>MIT licensed · built for the STRK20 Private Sprint</p>
          <p>Deposits and withdrawals are public by design. Aether says exactly what is visible.</p>
        </div>
      </Container>
    </footer>
  )
}
