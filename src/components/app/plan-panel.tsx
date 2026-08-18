'use client'

import { useState } from 'react'
import type { ActionIntent, StrategyMode } from '@/lib/engine'
import { usePlan } from '@/lib/store/plan'
import { useAether } from '@/lib/store/aether'
import { TOKEN_LIST, explorerTx, type TokenSymbol } from '@/lib/strk20/config'
import { formatUnits } from '@/lib/strk20/wallet'
import { Button, Hex, Segmented, StateBadge } from '@/components/ui/primitives'

/**
 * The strategy surface: choose a posture, generate a plan, execute it.
 *
 * Everything the engine decides is shown with its reasons — including what it
 * refused and why. A privacy tool that hides its refusals is indistinguishable
 * from one that never enforces anything.
 */

const MODE_OPTIONS: Array<{ value: StrategyMode; label: string }> = [
  { value: 'PRIVACY_FIRST', label: 'Privacy' },
  { value: 'STEALTH_DCA', label: 'DCA' },
  { value: 'WHALE_DISTRIBUTION', label: 'Whale' },
  { value: 'YIELD_MAX', label: 'Yield' },
  { value: 'BALANCED', label: 'Balanced' },
]

const TYPE_LABEL: Record<ActionIntent['type'], string> = {
  SWAP: 'Private swap',
  LEND: 'Private lend',
  REBALANCE: 'Rebalance',
  COMPACT: 'Compact notes',
}

function windowLabel(start: number, end: number): string {
  const format = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${format(start)} – ${format(end)}`
}

export function PlanPanel() {
  const { account, address, balances } = useAether()
  const {
    activity,
    activityLoading,
    plan,
    planning,
    planError,
    executing,
    lastTxHash,
    loadActivity,
    generate,
    executeIntent,
  } = usePlan()

  const [mode, setMode] = useState<StrategyMode>('BALANCED')
  const [privacyFloor, setPrivacyFloor] = useState(55)
  const [targetAsset, setTargetAsset] = useState<TokenSymbol>('strkBTC')

  const canGenerate = !!address && balances.length > 0 && !planning

  async function onGenerate() {
    if (!address) return
    await generate({
      address,
      balances: balances.map((balance) => ({ symbol: balance.symbol, raw: balance.raw })),
      mode,
      privacyFloor,
      targetAsset,
    })
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13.5px] font-semibold tracking-tight">Strategy</h2>
          <ActivityChip
            loading={activityLoading}
            live={activity?.live ?? false}
            eventCount={activity?.eventCount ?? 0}
            fromBlock={activity?.fromBlock ?? 0}
            toBlock={activity?.toBlock ?? 0}
            onRefresh={loadActivity}
          />
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div>
              <p className="list-header">Mode</p>
              <Segmented
                className="mt-2"
                ariaLabel="Strategy mode"
                value={mode}
                onChange={setMode}
                options={MODE_OPTIONS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="list-header">Privacy floor</p>
                  <span className="tabular font-mono text-[12px] font-semibold">{privacyFloor}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={5}
                  value={privacyFloor}
                  onChange={(event) => setPrivacyFloor(Number(event.target.value))}
                  aria-label="Privacy floor"
                  className="mt-2.5 w-full accent-[var(--color-ink)]"
                />
                <p className="mt-1 text-[11px] leading-snug text-ink-faint">
                  The engine refuses any action that would land the score below this.
                </p>
              </div>

              <div>
                <p className="list-header">Accumulate</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TOKEN_LIST.map((token) => {
                    const selected = token.symbol === targetAsset
                    return (
                      <button
                        key={token.symbol}
                        onClick={() => setTargetAsset(token.symbol)}
                        className={`h-8 rounded-full px-3 text-[12.5px] font-medium transition-all ${
                          selected
                            ? 'bg-ink text-paper-raised'
                            : 'bg-ink/[0.05] text-ink-soft hover:bg-ink/[0.08]'
                        }`}
                      >
                        {token.symbol}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={onGenerate} disabled={!canGenerate}>
              {planning ? 'Planning…' : plan ? 'Regenerate plan' : 'Generate plan'}
            </Button>
          </div>
        </div>

        {balances.length === 0 && (
          <p className="mt-3 text-[12.5px] text-ink-muted">
            Read your balances first — the planner works from what you actually hold.
          </p>
        )}
      </section>

      {planError && (
        <div className="rounded-xl bg-ember-soft px-4 py-3">
          <p className="text-[13px] leading-snug text-ember text-pretty">{planError}</p>
        </div>
      )}

      {lastTxHash && (
        <div className="rounded-xl bg-ink/[0.06] px-4 py-3">
          <p className="text-[13px] font-semibold text-ink-soft">Action submitted to mainnet</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <Hex value={lastTxHash} href={explorerTx(lastTxHash)} chars={8} />
            <span className="text-[11.5px] text-ink-muted">
              Copy this hash into strk20.json.
            </span>
          </div>
        </div>
      )}

      {/* Plan result */}
      {plan && (
        <>
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[13.5px] font-semibold tracking-tight">Projection</h2>
              <span className="font-mono text-[11px] text-ink-faint">
                mode {plan.mode.toLowerCase().replace(/_/g, ' ')}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="tabular text-[26px] font-semibold tracking-tight">
                {plan.baselineScore.toFixed(1)}
              </span>
              <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true" className="text-ink-faint">
                <path d="M2 6h18m0 0-5-4m5 4-5 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="tabular text-[26px] font-semibold tracking-tight text-ink">
                {plan.projectedScore.toFixed(1)}
              </span>
              <span className="text-[12px] text-ink-muted">
                effective privacy after {plan.intents.length}{' '}
                {plan.intents.length === 1 ? 'action' : 'actions'}
              </span>
            </div>
          </section>

          {plan.intents.length > 0 && (
            <section className="panel">
              <div className="border-b border-rule px-5 py-3">
                <span className="mono-label">Recommended sequence</span>
              </div>
              {plan.intents.map((intent, index) => (
                <IntentRow
                  key={intent.id}
                  intent={intent}
                  index={index}
                  last={index === plan.intents.length - 1}
                  executing={executing === intent.id}
                  disabled={executing !== null || !account}
                  onExecute={async () => {
                    if (!account || !address) return
                    await executeIntent({ account, address, intent })
                  }}
                />
              ))}
            </section>
          )}

          {plan.refused.length > 0 && (
            <section className="panel">
              <div className="flex items-center justify-between border-b border-rule px-5 py-3">
                <span className="mono-label">Refused by the engine</span>
                <StateBadge state="public">{plan.refused.length}</StateBadge>
              </div>
              <ul className="divide-y divide-rule">
                {plan.refused.map((refused, index) => (
                  <li key={index} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-medium">
                        {TYPE_LABEL[refused.type]} · {refused.asset}
                      </span>
                      <span className="tabular shrink-0 font-mono text-[11px] text-ink-faint">
                        would score {refused.wouldScore.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug text-ink-muted text-pretty">
                      {refused.reason}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan.intents.length === 0 && plan.refused.length === 0 && (
            <div className="card-flat border-dashed p-6 text-center">
              <p className="text-[13.5px] font-medium">Nothing to do right now</p>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                The engine found no action worth taking under this mode and floor.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActivityChip({
  loading,
  live,
  eventCount,
  fromBlock,
  toBlock,
  onRefresh,
}: {
  loading: boolean
  live: boolean
  eventCount: number
  fromBlock: number
  toBlock: number
  onRefresh: () => void
}) {
  if (loading) {
    return <span className="font-mono text-[11px] text-ink-faint">reading pool…</span>
  }

  if (!live) {
    return (
      <button onClick={onRefresh} className="font-mono text-[11px] text-ember hover:underline">
        pool not measured — retry
      </button>
    )
  }

  return (
    <span className="font-mono text-[11px] text-ink-muted">
      pool · {eventCount} events · blocks {fromBlock.toLocaleString()}–{toBlock.toLocaleString()}
    </span>
  )
}

function IntentRow({
  intent,
  index,
  last,
  executing,
  disabled,
  onExecute,
}: {
  intent: ActionIntent
  index: number
  last: boolean
  executing: boolean
  disabled: boolean
  onExecute: () => Promise<void>
}) {
  const sourceToken = TOKEN_LIST.find((token) => token.symbol === intent.sourceAsset)
  const amount = sourceToken
    ? formatUnits(intent.inputAmount, sourceToken.decimals)
    : intent.inputAmount.toString()

  const crossAsset = intent.sourceAsset !== intent.targetAsset

  return (
    <div className={`px-5 py-4 ${last ? '' : 'border-b border-rule'}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-[11px] text-ink-faint">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-[14px] font-semibold tracking-tight">
              {TYPE_LABEL[intent.type]}
            </span>
            <span className="tabular font-mono text-[12.5px] text-ink-soft">
              {amount} {intent.sourceAsset}
              {crossAsset ? ` → ${intent.targetAsset}` : ''}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-ink-faint">
            <span>window {windowLabel(intent.recommendedWindowStart, intent.recommendedWindowEnd)}</span>
            <span>ΔS {intent.expectedPrivacyDelta >= 0 ? '+' : ''}{intent.expectedPrivacyDelta.toFixed(1)}</span>
            <span>cost {intent.expectedCostBps}bps</span>
            <span>via {intent.route}</span>
          </div>
        </div>

        <Button size="sm" onClick={onExecute} disabled={disabled}>
          {executing ? 'Confirm in wallet…' : 'Execute'}
        </Button>
      </div>

      <p className="mt-2.5 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted text-pretty">
        {intent.rationale}
      </p>
    </div>
  )
}
