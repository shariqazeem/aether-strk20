'use client'

import { useMemo, useState } from 'react'
import { useAether } from '@/lib/store/aether'
import { TOKEN_LIST, type TokenSymbol } from '@/lib/strk20/config'
import { Button, Segmented, StateBadge } from '@/components/ui/primitives'

/**
 * Selective disclosure studio.
 *
 * Builds the exact statement a counterparty would verify — canonical JSON with
 * a stable field order — and is explicit about the boundary: Wallet API 0.10.3
 * exposes no statement-proof method, so Aether prepares the statement today
 * and requests the proof the moment wallets ship support. No signature
 * theatre in the meantime: an ECDSA attestation is not a ZK proof, so we
 * don't offer one dressed up as one.
 */

type StatementKind = 'balance-threshold' | 'strategy-return' | 'non-interaction'

interface BuiltStatement {
  statement: Record<string, unknown>
  reveals: string
  keeps: string
}

export function DisclosePanel() {
  const { address } = useAether()
  const [kind, setKind] = useState<StatementKind>('balance-threshold')

  // Per-template inputs
  const [asset, setAsset] = useState<TokenSymbol>('USDC')
  const [threshold, setThreshold] = useState('10000')
  const [sinceDate, setSinceDate] = useState('2026-06-01')
  const [addressSet, setAddressSet] = useState('')
  const [copied, setCopied] = useState(false)

  const built: BuiltStatement = useMemo(() => {
    const subject = address ?? '<connected address>'
    switch (kind) {
      case 'balance-threshold':
        return {
          statement: {
            kind: 'strk20/balance-threshold@1',
            subject,
            asset,
            threshold: threshold || '0',
            relation: 'gte',
            issuedAt: new Date().toISOString().slice(0, 10),
          },
          reveals: 'One boolean: whether the shielded balance meets the threshold.',
          keeps: 'The balance itself, every note, and the viewing key.',
        }
      case 'strategy-return':
        return {
          statement: {
            kind: 'strk20/strategy-return@1',
            subject,
            since: sinceDate,
            metric: 'net-return-bps',
            issuedAt: new Date().toISOString().slice(0, 10),
          },
          reveals: 'The net return over the period, as basis points.',
          keeps: 'Positions, sizes, routes, timing — the entire trail behind the number.',
        }
      case 'non-interaction': {
        const set = addressSet
          .split(/[\s,]+/)
          .map((entry) => entry.trim())
          .filter(Boolean)
        return {
          statement: {
            kind: 'strk20/non-interaction@1',
            subject,
            addressSet: set.length > 0 ? set : ['<paste addresses>'],
            window: 'lifetime',
            issuedAt: new Date().toISOString().slice(0, 10),
          },
          reveals: 'Non-membership: that none of your actions touched the listed addresses.',
          keeps: 'What your actions actually were, and who they did touch.',
        }
      }
    }
  }, [kind, asset, threshold, sinceDate, addressSet, address])

  const json = JSON.stringify(built.statement, null, 2)

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard denied — the JSON is visible and selectable either way.
    }
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13.5px] font-semibold tracking-tight">Build a statement</h2>
          <StateBadge state="neutral">reveals one fact</StateBadge>
        </div>

        <div className="mt-4">
          <Segmented
            ariaLabel="Statement type"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'balance-threshold', label: 'Balance ≥ X' },
              { value: 'strategy-return', label: 'Return since' },
              { value: 'non-interaction', label: 'Never touched S' },
            ]}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {kind === 'balance-threshold' && (
            <>
              <div>
                <p className="list-header">Asset</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TOKEN_LIST.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => setAsset(token.symbol)}
                      className={`h-8 rounded-full px-3 text-[12.5px] font-medium transition-all ${
                        asset === token.symbol
                          ? 'bg-veil text-white'
                          : 'bg-black/[0.05] text-ink-soft hover:bg-black/[0.08]'
                      }`}
                    >
                      {token.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="list-header">Threshold</p>
                <input
                  value={threshold}
                  inputMode="decimal"
                  onChange={(event) => setThreshold(event.target.value.replace(/[^0-9.]/g, ''))}
                  aria-label="Balance threshold"
                  className="tabular mt-2 h-10 w-full rounded-xl bg-black/[0.04] px-3.5 font-mono text-[14px] outline-none focus:ring-2 focus:ring-veil/50"
                />
              </div>
            </>
          )}

          {kind === 'strategy-return' && (
            <div>
              <p className="list-header">Since</p>
              <input
                type="date"
                value={sinceDate}
                onChange={(event) => setSinceDate(event.target.value)}
                aria-label="Return period start"
                className="tabular mt-2 h-10 w-full rounded-xl bg-black/[0.04] px-3.5 font-mono text-[14px] outline-none focus:ring-2 focus:ring-veil/50"
              />
            </div>
          )}

          {kind === 'non-interaction' && (
            <div className="sm:col-span-2">
              <p className="list-header">Address set</p>
              <textarea
                value={addressSet}
                onChange={(event) => setAddressSet(event.target.value)}
                placeholder="0x…, 0x… — comma or newline separated"
                aria-label="Address set"
                rows={3}
                className="mt-2 w-full rounded-xl bg-black/[0.04] px-3.5 py-2.5 font-mono text-[12.5px] outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-veil/50"
              />
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <span className="mono-label">Canonical statement</span>
          <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
        </div>
        <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-relaxed text-ink-soft">
          {json}
        </pre>
        <div className="grid gap-0 border-t border-rule md:grid-cols-2 md:divide-x md:divide-rule">
          <div className="border-b border-rule px-5 py-3.5 md:border-b-0">
            <p className="list-header">Reveals</p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted">{built.reveals}</p>
          </div>
          <div className="px-5 py-3.5">
            <p className="list-header">Keeps private</p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted">{built.keeps}</p>
          </div>
        </div>
      </section>

      <div className="rounded-xl bg-paper-sunk px-4 py-3.5">
        <p className="text-[12.5px] leading-relaxed text-ink-muted text-pretty">
          <span className="font-semibold text-ink">Where the proof comes from:</span> the ZK proof
          for a statement like this must be generated by the wallet, next to the viewing key.
          Wallet API 0.10.3 does not expose a statement-proof method yet, so Aether prepares the
          exact statement now and will request the proof the moment wallets ship support. We do
          not substitute a plain signature and call it a proof.
        </p>
      </div>
    </div>
  )
}
