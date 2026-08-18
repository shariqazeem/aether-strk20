'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAether, useTargetAddress } from '@/lib/store/aether'
import { usePlan } from '@/lib/store/plan'
import { formatUnits } from '@/lib/strk20/wallet'
import { PrivacyScore, type ScoreDimensions } from '@/components/privacy-score'
import { ShieldPanel } from '@/components/app/shield-panel'
import { PlanPanel } from '@/components/app/plan-panel'
import { ActivityPanel } from '@/components/app/activity-panel'
import { DisclosePanel } from '@/components/app/disclose-panel'
import { TargetBar } from '@/components/app/target-bar'
import { StepBlocked, StepSection } from '@/components/app/step-section'
import { AetherMark, Button, Container, Hex, StateBadge } from '@/components/ui/primitives'
import { POOL_ADDRESS, explorerContract, NOTE_MATURITY_BLOCKS } from '@/lib/strk20/config'

/**
 * The loop, on one page.
 *
 * Exposure is measured, the remedy is planned against what it found, the
 * action executes, the ledger records what an observer saw, and the adversary
 * runs again. Tabs would imply these are independent surfaces; they are one
 * circuit, and the numbering says so.
 */
export default function AppPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="pb-24">
        <Container>
          <Intro />
          <div className="mt-8 space-y-10">
            <TargetBar />
            <ExposureStep />
            <PositionStep />
            <RemedyStep />
            <LedgerStep />
            <DiscloseStep />
          </div>
        </Container>
      </main>
    </div>
  )
}

function AppHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-rule">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AetherMark />
            <span className="text-[15px] font-semibold tracking-tight">Aether</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {[
              ['Exposure', '#step-01'],
              ['Remedy', '#step-03'],
              ['Ledger', '#step-04'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  )
}

function Intro() {
  return (
    <div className="pt-10">
      <p className="mono-label">The loop</p>
      <h1 className="display-lg mt-2 max-w-2xl text-balance">
        Measure the exposure. Close it. Measure again.
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted text-pretty">
        Everything below is one circuit. The adversary reads public chain data and needs no
        wallet; only the stages that move value do.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  01 · Exposure                                                      */
/* ------------------------------------------------------------------ */

function ExposureStep() {
  const target = useTargetAddress()

  return (
    <StepSection
      index="01"
      label="Exposure"
      title="What an adversary can already tell"
      lede="The published deanonymization heuristics — amount correlation, timing windows, round numbers, cadence, thin anonymity sets — run against this address's real public footprint."
      state={target ? 'active' : 'idle'}
      status={target ? <StateBadge state="neutral">ready</StateBadge> : undefined}
    >
      {target ? (
        <StepBlocked
          reason="Adversary engine is being wired in"
          hint="The heuristics and their scoring are implemented and unit-tested; this panel is the last piece connecting them to the live footprint."
        />
      ) : (
        <StepBlocked
          reason="Choose a target above"
          hint="Paste any Starknet address — exposure analysis reads only public data, so it needs no wallet and no permission."
        />
      )}
    </StepSection>
  )
}

/* ------------------------------------------------------------------ */
/*  02 · Position                                                      */
/* ------------------------------------------------------------------ */

const EMPTY_DIMENSIONS: ScoreDimensions = {
  anonymitySet: 0,
  amountEntropy: 0,
  timingEntropy: 0,
  behavioralUniqueness: 0,
  exitCorrelationRisk: 0,
}

function PositionStep() {
  const { status, address, balances, balancesLoading, balancesRequestedAt, refreshBalances, error } =
    useAether()
  const { loadActivity, refreshScore, activity, breakdown } = usePlan()
  const connected = status === 'connected'
  const hasRead = balancesRequestedAt !== null

  useEffect(() => {
    if (!activity) void loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (address && balancesRequestedAt !== null) {
      refreshScore(
        address,
        balances.map((balance) => ({ symbol: balance.symbol, raw: balance.raw })),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, balancesRequestedAt])

  return (
    <StepSection
      index="02"
      label="Position"
      title="What you hold, and how well it hides"
      lede="Shielded balances are read only when you ask — the request is a wallet consent prompt for data Aether otherwise has no reason to see."
      state={hasRead ? 'done' : connected ? 'active' : 'blocked'}
      status={
        connected ? (
          <Button variant="secondary" size="sm" onClick={refreshBalances} disabled={balancesLoading}>
            {balancesLoading ? 'Waiting for wallet…' : hasRead ? 'Refresh' : 'Read balances'}
          </Button>
        ) : undefined
      }
    >
      {!connected ? (
        <StepBlocked
          reason="Connect a wallet to see your shielded position"
          hint="Exposure analysis above works without one. Balances, shielding and execution need a privacy-enabled wallet speaking Wallet API 0.10.3 or newer."
        />
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl bg-ember-soft px-4 py-3">
              <p className="text-[13px] leading-snug text-ember text-pretty">{error}</p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-semibold tracking-tight">Private balances</h3>
                <StateBadge state="private">inside the pool</StateBadge>
              </div>

              {balancesLoading ? (
                <div className="mt-4 space-y-2.5">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="h-11 rounded-xl shimmer" />
                  ))}
                </div>
              ) : balances.length > 0 ? (
                <ul className="mt-3 divide-y divide-rule">
                  {balances.map((balance) => (
                    <li key={balance.address} className="flex items-center gap-3 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-[10.5px] font-semibold text-ink-soft">
                        {balance.symbol.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium">{balance.symbol}</p>
                        <Hex value={balance.address} chars={5} />
                      </div>
                      <p className="tabular font-mono text-[14px] font-medium">
                        {formatUnits(balance.raw, balance.decimals)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[13px] leading-relaxed text-ink-muted text-pretty">
                  {hasRead
                    ? 'No shielded balance yet. Shield once to begin — the deposit is public, everything after it is not.'
                    : 'Not read yet.'}
                </p>
              )}

              <div className="mt-5 border-t border-rule pt-3.5">
                <p className="text-[11.5px] leading-relaxed text-ink-faint text-pretty">
                  New notes need ~{NOTE_MATURITY_BLOCKS} blocks to mature. Pool ·{' '}
                  <Hex value={POOL_ADDRESS} href={explorerContract(POOL_ADDRESS)} chars={5} />
                </p>
              </div>
            </section>

            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-semibold tracking-tight">Effective privacy</h3>
                <StateBadge state={breakdown ? 'private' : 'neutral'}>
                  {breakdown ? 'live' : 'awaiting data'}
                </StateBadge>
              </div>
              <div className="mt-5">
                <PrivacyScore dimensions={breakdown ?? EMPTY_DIMENSIONS} compact />
              </div>
              <p className="mt-5 text-[12px] leading-relaxed text-ink-muted text-pretty">
                Computed from your local action ledger and live pool activity. It stays at zero
                until there is real data behind it — never an invented number.
              </p>
            </section>
          </div>

          <ShieldPanel />
        </div>
      )}
    </StepSection>
  )
}

/* ------------------------------------------------------------------ */
/*  03 · Remedy                                                        */
/* ------------------------------------------------------------------ */

function RemedyStep() {
  const status = useAether((state) => state.status)
  const plan = usePlan((state) => state.plan)
  const connected = status === 'connected'

  return (
    <StepSection
      index="03"
      label="Remedy"
      title="The sequence that closes the leaks"
      lede="A deterministic plan: what to do, split how, in which window, and why. Actions that would breach your privacy floor are refused and shown with their reason."
      state={plan ? 'done' : connected ? 'active' : 'blocked'}
      status={
        plan ? (
          <span className="font-mono text-[11px] text-ink-muted">
            {plan.intents.length} planned · {plan.refused.length} refused
          </span>
        ) : undefined
      }
    >
      {connected ? (
        <PlanPanel />
      ) : (
        <StepBlocked
          reason="Planning needs a connected wallet"
          hint="The engine plans against what you actually hold, and executing writes to the pool through your wallet."
        />
      )}
    </StepSection>
  )
}

/* ------------------------------------------------------------------ */
/*  04 · Ledger                                                        */
/* ------------------------------------------------------------------ */

function LedgerStep() {
  const target = useTargetAddress()

  return (
    <StepSection
      index="04"
      label="Ledger"
      title="What you did, beside what they saw"
      lede="Your actions live only in this browser — the chain cannot reconstruct them, and that asymmetry is the product. Each row shows the observer's view of it."
      state={target ? 'active' : 'blocked'}
    >
      {target ? <ActivityPanel /> : <StepBlocked reason="Choose a target above to see its ledger" />}
    </StepSection>
  )
}

/* ------------------------------------------------------------------ */
/*  05 · Disclose                                                      */
/* ------------------------------------------------------------------ */

function DiscloseStep() {
  return (
    <StepSection
      index="05"
      label="Disclose"
      title="Prove one fact, keep the key"
      lede="Counterparties usually need a single fact, not your history. Build the exact statement they would verify."
    >
      <DisclosePanel />
    </StepSection>
  )
}
