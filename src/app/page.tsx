import Link from 'next/link'
import { AnonymityField } from '@/components/landing/anonymity-field'
import { AttackerView } from '@/components/landing/attacker-view'
import { LifecycleDiagram } from '@/components/landing/lifecycle-diagram'
import { StrategyModes } from '@/components/landing/strategy-modes'
import { CompoundingPrivacy } from '@/components/landing/compounding-privacy'
import { PrivacyScore } from '@/components/privacy-score'
import { Button, Container, Eyebrow, Reveal, SectionHeading } from '@/components/ui/primitives'
import { POOL_ADDRESS, explorerContract } from '@/lib/strk20/config'

/** Representative state used for the marketing surface. The app computes this live. */
const SAMPLE_DIMENSIONS = {
  anonymitySet: 82,
  amountEntropy: 91,
  timingEntropy: 76,
  behavioralUniqueness: 14,
  exitCorrelationRisk: 6,
}

export default function LandingPage() {
  return (
    <div className="relative">
      <SiteNav />
      <Hero />
      <Ledes />
      <LifecycleDiagram />
      <ScoreSection />
      <AttackerView />
      <StrategyModes />
      <DisclosureSection />
      <CompoundingPrivacy />
      <ClosingCta />
      <SiteFooter />
    </div>
  )
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule/70 bg-paper/80 backdrop-blur-xl">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <AetherMark />
            <span className="font-display text-[19px] tracking-tight">Aether</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {[
              ['How it works', '#lifecycle'],
              ['Privacy score', '#score'],
              ['Strategies', '#strategies'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-2 text-[13.5px] text-ink-muted transition-colors hover:bg-paper-sunk hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <Button href="https://github.com/shariqazeem/aether-strk20" variant="ghost" size="sm">
              GitHub
            </Button>
            <Button href="/app" size="sm">
              Open Aether
            </Button>
          </div>
        </nav>
      </Container>
    </header>
  )
}

function AetherMark() {
  return (
    <span className="relative grid size-7 place-items-center">
      <span className="absolute inset-0 rounded-full veil-gradient opacity-90" />
      <span className="absolute inset-[5px] rounded-full bg-paper" />
      <span className="absolute inset-[10px] rounded-full bg-veil breathe" />
    </span>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="aether-wash absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 opacity-[0.55]">
        <AnonymityField />
      </div>

      <Container>
        <div className="flex min-h-[calc(100svh-4rem)] flex-col justify-center py-16 sm:py-20">
          <Reveal blur>
            <div className="inline-flex items-center gap-2 rounded-full border border-rule-strong bg-paper-raised/80 px-3 py-1.5 backdrop-blur">
              <span className="size-1.5 rounded-full bg-good breathe" />
              <span className="text-[12px] font-medium tracking-wide text-ink-soft">
                Live on Starknet mainnet
              </span>
            </div>
          </Reveal>

          <Reveal blur delay={110}>
            <h1 className="display-xl mt-7 max-w-4xl text-balance">
              Shield once.
              <br />
              <span className="italic text-veil-gradient">Stay unseen.</span>
            </h1>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-6 max-w-xl text-[17.5px] leading-relaxed text-ink-soft text-pretty sm:text-[19px]">
              Aether runs continuous private strategies — DCA, yield, rebalancing — entirely
              inside the STRK20 pool. Every action is chosen to protect your{' '}
              <span className="font-medium text-ink">effective anonymity under repeated use</span>,
              so your financial behaviour never becomes a fingerprint.
            </p>
          </Reveal>

          <Reveal delay={380}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/app" size="lg">
                Open Aether
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
              <Button href="#lifecycle" variant="secondary" size="lg">
                Why unshielding leaks
              </Button>
            </div>
          </Reveal>

          <Reveal delay={520}>
            <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-7 border-t border-rule pt-8 sm:grid-cols-4">
              {[
                ['Capital unshielded', '0', 'by default, for the whole lifecycle'],
                ['Privacy dimensions', '5', 'scored live from real pool data'],
                ['Custom Cairo', 'None', 'existing audited anonymizers'],
                ['Viewing keys held', '0', 'the wallet keeps them, never Aether'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <dt className="text-[11.5px] tracking-wide text-ink-faint">{label}</dt>
                  <dd className="mt-1.5 font-display text-[2rem] leading-none">{value}</dd>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-ink-faint text-pretty">
                    {note}
                  </p>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/** The argument, stated plainly before any diagram earns its place. */
function Ledes() {
  return (
    <section className="border-y border-rule bg-paper-raised py-24 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <Reveal>
            <p className="display-md text-balance">
              Privacy is not a property of a transaction. It is a property of a{' '}
              <span className="italic">sequence</span>.
            </p>
          </Reveal>
          <div className="space-y-5 text-[16.5px] leading-relaxed text-ink-muted">
            <Reveal delay={120}>
              <p className="text-pretty">
                Shield 1,000 USDC every Monday at 09:00 and every single transaction is
                cryptographically private. You still have no privacy, because the pattern is the
                fingerprint — same amount, same cadence, same hour.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-pretty">
                Most tooling treats the shielded pool as a waiting room: value goes in, waits, comes
                out, and the moment it touches a public protocol the link re-forms. The privacy was
                real and it was spent in a single transaction.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <p className="text-pretty text-ink">
                Aether never leaves. Swaps, lending and rebalancing all happen inside the pool, and
                each action is sized and timed against your own history and live pool traffic — so
                privacy accumulates with use instead of draining away.
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

function ScoreSection() {
  return (
    <section id="score" className="scroll-mt-20 py-28 sm:py-36">
      <Container>
        <SectionHeading
          eyebrow="Effective privacy score"
          title={
            <>
              A number you can <span className="text-veil-gradient">audit</span>, not one you have
              to believe.
            </>
          }
          lede="Six terms, published weights, computed client-side from live pool data and your own history. The formula is in the README because a privacy score you cannot check is a slogan."
        />
        <div className="mt-16">
          <PrivacyScore dimensions={SAMPLE_DIMENSIONS} />
        </div>
      </Container>
    </section>
  )
}

function DisclosureSection() {
  const statements = [
    { claim: 'Private balance of USDC ≥ 10,000', reveals: 'A single boolean. Not the balance.' },
    { claim: 'This strategy returned +8.4% since June', reveals: 'The return. Not the positions.' },
    { claim: 'No interaction with any address in set S', reveals: 'Non-membership. Nothing else.' },
  ]

  return (
    <section className="border-y border-rule bg-paper-raised py-28 sm:py-36">
      <Container>
        <SectionHeading
          eyebrow="Selective disclosure"
          title="Prove the one thing. Reveal nothing else."
          lede="Compliance, lenders and counterparties usually want a single fact — not your history. Hand over that fact as a statement, and keep the viewing key."
        />

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {statements.map((statement, index) => (
            <Reveal as="li" key={statement.claim} delay={index * 110}>
              <div className="card flex h-full flex-col p-6">
                <span className="eyebrow">Statement</span>
                <p className="mt-3 flex-1 text-[15.5px] leading-snug font-medium text-pretty">
                  {statement.claim}
                </p>
                <div className="mt-5 border-t border-rule pt-4">
                  <span className="eyebrow">Reveals</span>
                  <p className="mt-2 text-[13px] leading-snug text-ink-muted text-pretty">
                    {statement.reveals}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="relative overflow-hidden py-32 sm:py-40">
      <div className="aether-wash absolute inset-0 -z-10" />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal blur>
            <h2 className="display-lg text-balance">
              Your capital should be able to <span className="italic text-veil-gradient">work</span>{' '}
              without announcing itself.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-ink-muted text-pretty">
              Connect a privacy-enabled wallet, shield once, and let Aether handle the sizing and the
              timing from there.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button href="/app" size="lg">
                Open Aether
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
    <footer className="border-t border-rule bg-paper-raised py-14">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <AetherMark />
              <span className="font-display text-[18px] tracking-tight">Aether</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted text-pretty">
              Continuous private portfolio strategy, running entirely inside the STRK20 pool on
              Starknet mainnet.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-[13px] sm:gap-x-16">
            <div>
              <Eyebrow>Protocol</Eyebrow>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href={explorerContract(POOL_ADDRESS)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink-muted transition-colors hover:text-veil"
                  >
                    STRK20 pool
                  </a>
                </li>
                <li>
                  <a
                    href="https://strk20-by-example.org/what-is-strk20"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink-muted transition-colors hover:text-veil"
                  >
                    STRK20 docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <Eyebrow>Project</Eyebrow>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="https://github.com/shariqazeem/aether-strk20"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-ink-muted transition-colors hover:text-veil"
                  >
                    Source
                  </a>
                </li>
                <li>
                  <Link href="/app" className="text-ink-muted transition-colors hover:text-veil">
                    Open the app
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-rule pt-6 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>MIT licensed. Built for the STRK20 Private Sprint.</p>
          <p className="text-pretty">
            Deposits and withdrawals are public by design. Aether tells you exactly what is visible.
          </p>
        </div>
      </Container>
    </footer>
  )
}
