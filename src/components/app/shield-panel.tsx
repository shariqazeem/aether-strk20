'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAether } from '@/lib/store/aether'
import { buildShield, describeActions, explainWalletError } from '@/lib/strk20/actions'
import { readPoolFee } from '@/lib/strk20/pool'
import { formatUnits, parseUnits } from '@/lib/strk20/wallet'
import { TOKENS, TOKEN_LIST, explorerTx, type TokenSymbol } from '@/lib/strk20/config'
import { Button, Hex, StateBadge } from '@/components/ui/primitives'
import { appendLedger } from '@/lib/history'

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

      // The deposit is the one public act; the ledger records it that way so
      // the attacker view over your real history stays honest.
      if (address) {
        appendLedger(address, {
          timestamp: Date.now(),
          type: 'SHIELD',
          asset: token.symbol,
          amount: parsed,
          route: 'DIRECT',
          txHash: transaction_hash,
          observer: 'deposit · public',
        })
      }

      // Deliberately do not block the UI on confirmation. Paymaster-relayed
      // hashes can take a while to surface at the selected RPC, and a spinner
      // that never resolves reads as a failure when the transaction is fine.
      void refreshBalances()
    } catch (caught) {
      setError(explainWalletError(caught))
      setPhase('error')
    }
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="text-[13.5px] font-semibold tracking-tight">Shield</h2>
        <StateBadge state="public">this step is public</StateBadge>
      </div>

      <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted text-pretty">
        A deposit names your address on-chain — the one moment you are visible. Shield well ahead
        of the strategy it funds so nothing on-chain connects the two.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          {/* Asset */}
          <p className="list-header">Asset</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Asset">
            {TOKEN_LIST.map((entry) => {
              const selected = entry.symbol === symbol
              return (
                <button
                  key={entry.symbol}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSymbol(entry.symbol)}
                  className={`h-8 rounded-full px-3.5 text-[13px] font-medium transition-all duration-150 ${
                    selected
                      ? 'bg-veil text-white'
                      : 'bg-black/[0.05] text-ink-soft hover:bg-black/[0.08]'
                  }`}
                >
                  {entry.symbol}
                </button>
              )
            })}
          </div>

          {/* Amount */}
          <p className="list-header mt-5">Amount</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/[0.04] px-4 transition-shadow focus-within:ring-2 focus-within:ring-veil/50">
            <input
              inputMode="decimal"
              aria-label={`Amount of ${token.symbol} to shield`}
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
              className="tabular h-11 flex-1 bg-transparent font-mono text-[15px] outline-none placeholder:text-ink-faint"
            />
            <span className="text-[13px] font-semibold text-ink-muted">{token.symbol}</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-ink-faint text-pretty">
            Round numbers are the easiest thing to fingerprint — prefer something irregular over{' '}
            <span className="font-mono">1000</span>.
          </p>

          {/* Fee */}
          <div className="mt-4 rounded-xl bg-paper-sunk px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] text-ink-muted">Pool fee per private operation</span>
              <span className="tabular font-mono text-[13px] font-semibold">
                {fee ? `${formatUnits(fee.fee, 18, 2)} STRK` : '…'}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-ink-faint text-pretty">
              {fee?.live
                ? 'Read live from the pool. Gas is sponsored by the wallet; this fee is not.'
                : 'RPC unreachable — showing the last known value. Verify before a large deposit.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {/* What will happen */}
          <p className="list-header">This will submit</p>
          {preview.length > 0 ? (
            <ol className="mt-2 space-y-1.5">
              {preview.map((line, index) => (
                <li key={line} className="flex gap-2 text-[12.5px] text-ink-muted">
                  <span className="font-mono text-ink-faint">{index + 1}.</span>
                  <span className="text-pretty">{line}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[12.5px] text-ink-faint">Enter an amount to preview.</p>
          )}

          <div className="mt-3 rounded-xl bg-paper-sunk px-3.5 py-2.5">
            <p className="text-[12px] leading-snug text-ink-muted text-pretty">
              <span className="font-semibold text-ink">Your wallet will prompt twice.</span> The
              ERC-20 approval must land before the deposit. The second prompt is expected, not a
              duplicate.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={!canSubmit}>
              {phase === 'awaiting-wallet'
                ? 'Confirm in your wallet…'
                : phase === 'building'
                  ? 'Preparing…'
                  : 'Shield'}
            </Button>
            {address && <Hex value={address} chars={4} />}
          </div>

          {txHash && (
            <div className="mt-4 rounded-xl bg-good-soft px-4 py-3">
              <p className="text-[13px] font-semibold text-good">Submitted to mainnet</p>
              <p className="mt-1 text-[12px] leading-snug text-ink-muted text-pretty">
                Notes take ~10 blocks to mature before they can be spent.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Hex value={txHash} href={explorerTx(txHash)} chars={8} />
                <button
                  onClick={() => navigator.clipboard?.writeText(txHash)}
                  className="text-[12px] font-semibold text-veil hover:underline underline-offset-2"
                >
                  Copy hash for strk20.json
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-exposed-soft px-4 py-3">
              <p className="text-[13px] leading-snug text-exposed text-pretty">{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
