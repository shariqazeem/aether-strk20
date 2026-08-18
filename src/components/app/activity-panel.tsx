'use client'

import { useEffect, useState } from 'react'
import { useAether } from '@/lib/store/aether'
import { loadLedger, clearLedger, type LedgerEntry } from '@/lib/history'
import { usePlan } from '@/lib/store/plan'
import { TOKENS, explorerTx } from '@/lib/strk20/config'
import { formatUnits } from '@/lib/strk20/wallet'
import { Button, Hex, StateBadge } from '@/components/ui/primitives'

/**
 * Your ledger, with the observer column beside it — the attacker view over
 * your real actions rather than a demo. The ledger lives in this browser:
 * the chain deliberately cannot reconstruct it, which is the entire point.
 */

const TYPE_LABEL: Record<LedgerEntry['type'], string> = {
  SHIELD: 'Shield',
  SWAP: 'Private swap',
  REBALANCE: 'Rebalance',
  COMPACT: 'Compact',
  TRANSFER: 'Private transfer',
}

export function ActivityPanel() {
  const { address } = useAether()
  const lastTxHash = usePlan((state) => state.lastTxHash)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (address) setEntries(loadLedger(address))
  }, [address, lastTxHash])

  if (!address) return null

  return (
    <div className="space-y-5">
      <section className="panel">
        <div className="grid border-b border-rule md:grid-cols-[1fr_260px]">
          <div className="flex items-center justify-between border-b border-rule px-5 py-3 md:border-r md:border-b-0">
            <span className="mono-label">Your actions</span>
            <StateBadge state="private">local only</StateBadge>
          </div>
          <div className="flex items-center px-5 py-3">
            <span className="mono-label">Observer saw</span>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13.5px] font-medium">No actions yet</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Shield once, then execute the plan — every action lands here with what the chain saw
              of it.
            </p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const token = TOKENS[entry.asset]
            return (
              <div
                key={entry.id}
                className={`grid md:grid-cols-[1fr_260px] ${
                  index < entries.length - 1 ? 'border-b border-rule' : ''
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule/60 px-5 py-3.5 md:border-r md:border-b-0">
                  <span className="tabular shrink-0 font-mono text-[10.5px] text-ink-faint">
                    {new Date(entry.timestamp).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[13.5px] font-medium">{TYPE_LABEL[entry.type]}</span>
                  <span className="tabular font-mono text-[12.5px] text-ink-soft">
                    {token ? formatUnits(entry.amount, token.decimals) : entry.amount.toString()}{' '}
                    {entry.asset}
                  </span>
                  {entry.txHash && (
                    <Hex value={entry.txHash} href={explorerTx(entry.txHash)} chars={6} />
                  )}
                </div>
                <div className="flex items-center bg-paper-sunk/50 px-5 py-3.5">
                  <span
                    className={`font-mono text-[12px] ${
                      entry.observer === '—'
                        ? 'text-ink-faint'
                        : entry.observer.includes('public')
                          ? 'text-ember'
                          : 'text-ink-muted'
                    }`}
                  >
                    {entry.observer}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </section>

      {entries.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-[12px] leading-relaxed text-ink-faint text-pretty">
            This ledger exists only in this browser. The chain cannot reconstruct it — that
            asymmetry is the product. Clearing it also resets the behavioural terms of your score.
          </p>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">Erase local history?</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  clearLedger(address)
                  setEntries([])
                  setConfirmClear(false)
                }}
              >
                Yes, clear
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                Keep
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear ledger
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
