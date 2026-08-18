'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAether } from '@/lib/store/aether'
import { buildShield, describeActions, explainWalletError } from '@/lib/strk20/actions'
import { readPoolFee } from '@/lib/strk20/pool'
import { formatUnits, parseUnits } from '@/lib/strk20/wallet'
import { TOKENS, TOKEN_LIST, explorerTx, type TokenSymbol } from '@/lib/strk20/config'
import { Button, Hex, StateBadge } from '@/components/ui/primitives'

/**
 * Shield: the one public step.
 *
 * Deliberately its own transaction, never bundled with the strategy it funds.
 * A deposit names the depositor on-chain; a later private action has no public
 * leg. Because they are separate transactions nothing ties them together, and
 * that separation is the whole basis of the anonymity set.
 */

type Phase = 'idle' | 'building' | 'awaiting-wallet' | 'submitted' | 'error'

export function ShieldPanel() {
  const { account, address, refreshBalances } = useAether()

  const [symbol, setSymbol] = useState<TokenSymbol>('USDC')
  const [amount, setAmount] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fee, setFee] = useState<{ fee: bigint; live: boolean } | null>(null)

  const token = TOKENS[symbol]

  useEffect(() => {
    let cancelled = false
    readPoolFee().then((result) => {
      if (!cancelled) setFee(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const parsed = useMemo(() => {
    try {
      return parseUnits(amount, token.decimals)
    } catch {
      return 0n
    }
  }, [amount, token.decimals])

  const preview = useMemo(
    () => (parsed > 0n ? describeActions(buildShield(token.address, parsed)) : []),
    [parsed, token.address],
  )

  const canSubmit = parsed > 0n && phase !== 'awaiting-wallet' && phase !== 'building' && !!account

  async function submit() {
    if (!account || parsed <= 0n) return

    setError(null)
    setTxHash(null)
    setPhase('building')

    try {
      const actions = buildShield(token.address, parsed)

      setPhase('awaiting-wallet')
      const { transaction_hash } = await account.strk20InvokeTransaction(actions)

      setTxHash(transaction_hash)
      setPhase('submitted')

      // Deliberately do not block the UI on confirmation. Paymaster-relayed
      // hashes can take a while to surface at the selected RPC, and a spinner
      // that never resolves reads as a failure when the transaction is fine.
      // The explorer link is live immediately; balances refresh in the
      // background once it lands.
      void refreshBalances()
    } catch (caught) {
      setError(explainWalletError(caught))
      setPhase('error')
    }
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold tracking-tight">Shield</h2>
        <StateBadge state="public">this step is public</StateBadge>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-muted text-pretty">
        A deposit names your address on-chain — it is the one moment you are visible, and Aether
        does not pretend otherwise. Shield well ahead of the strategy it funds so nothing on-chain
        connects the two.
      </p>

      {/* Asset */}
      <div className="mt-5">
        <label className="eyebrow" htmlFor="shield-asset">
          Asset
        </label>
        <div id="shield-asset" className="mt-2 flex flex-wrap gap-2">
          {TOKEN_LIST.map((entry) => {
            const selected = entry.symbol === symbol
            return (
              <button
                key={entry.symbol}
                onClick={() => setSymbol(entry.symbol)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                  selected
                    ? 'border-veil-mid bg-veil-soft text-veil-deep'
                    : 'border-rule bg-paper hover:border-rule-strong hover:bg-paper-sunk'
                }`}
              >
                {entry.symbol}
              </button>
            )
          })}
        </div>
      </div>

      {/* Amount */}
      <div className="mt-5">
        <label className="eyebrow" htmlFor="shield-amount">
          Amount
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-4 focus-within:border-veil-mid">
          <input
            id="shield-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
            className="tabular h-12 flex-1 bg-transparent font-mono text-[15px] outline-none placeholder:text-ink-faint"
          />
          <span className="text-[13px] font-medium text-ink-muted">{token.symbol}</span>
        </div>

        <p className="mt-2 text-[12px] leading-snug text-ink-faint text-pretty">
          Round numbers are the easiest thing to fingerprint. Aether splits amounts for you once a
          strategy is running, but for the initial deposit prefer something irregular over{' '}
          <span className="font-mono">1000</span>.
        </p>
      </div>

      {/* Fee */}
      <div className="mt-5 rounded-lg border border-rule bg-paper-sunk/60 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] text-ink-muted">Pool fee per private operation</span>
          <span className="tabular font-mono text-[13px] font-medium">
            {fee ? `${formatUnits(fee.fee, 18, 2)} STRK` : '…'}
          </span>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-ink-faint text-pretty">
          {fee?.live
            ? 'Read live from the pool. Gas is sponsored by the wallet; this fee is not.'
            : 'Could not reach the RPC — showing the last known value. Verify before a large deposit.'}
        </p>
      </div>

      {/* What will happen */}
      {preview.length > 0 && (
        <div className="mt-5">
          <p className="eyebrow">This will submit</p>
          <ol className="mt-2 space-y-1.5">
            {preview.map((line, index) => (
              <li key={line} className="flex gap-2.5 text-[12.5px] text-ink-muted">
                <span className="font-mono text-ink-faint">{index + 1}.</span>
                <span className="text-pretty">{line}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg border border-rule bg-paper-sunk/60 px-3.5 py-2.5 text-[12px] leading-snug text-ink-muted text-pretty">
            <span className="font-medium text-ink">Your wallet will prompt twice.</span> The ERC-20
            approval has to land on-chain before the deposit itself. The second prompt is expected,
            not a duplicate.
          </p>
        </div>
      )}

      {/* Action */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!canSubmit}>
          {phase === 'awaiting-wallet'
            ? 'Confirm in your wallet…'
            : phase === 'building'
              ? 'Preparing…'
              : 'Shield'}
        </Button>
        {address && <Hex value={address} chars={4} />}
      </div>

      {/* Result */}
      {txHash && (
        <div className="mt-5 rounded-lg border border-good/25 bg-good-soft px-4 py-3">
          <p className="text-[13px] font-medium text-good">Submitted to mainnet</p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted text-pretty">
            Notes take roughly 10 blocks to mature before they can be spent.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <Hex value={txHash} href={explorerTx(txHash)} chars={8} />
            <button
              onClick={() => navigator.clipboard?.writeText(txHash)}
              className="text-[12px] font-medium text-veil hover:underline underline-offset-2"
            >
              Copy hash for strk20.json
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-exposed-mid/50 bg-exposed-soft px-4 py-3">
          <p className="text-[13px] leading-snug text-exposed text-pretty">{error}</p>
        </div>
      )}
    </section>
  )
}
