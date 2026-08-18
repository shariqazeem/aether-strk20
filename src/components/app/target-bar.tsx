'use client'

import { useEffect, useState } from 'react'
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features'
import { useAether } from '@/lib/store/aether'
import { listWallets, subscribeToWallets, supportsStrk20 } from '@/lib/strk20/wallet'
import { Button, Hex, StateBadge } from '@/components/ui/primitives'

/**
 * Who is under analysis.
 *
 * Exposure analysis reads only public chain data, so it works on any address —
 * no wallet, no permission, no consent prompt. That is deliberate: gating the
 * headline feature behind a wallet install would make it unreachable for most
 * visitors, and an adversary that only works on you is not much of an
 * adversary. Connecting a wallet adds the surfaces that need to *act*:
 * shielding, executing a plan, reading shielded balances.
 */

function looksLikeAddress(value: string): boolean {
  const trimmed = value.trim()
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(trimmed)) return false
  try {
    return BigInt(trimmed) > 0n
  } catch {
    return false
  }
}

export function TargetBar() {
  const { status, address, walletName, observerAddress, connect, disconnect, setObserverAddress } =
    useAether()

  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([])
  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setWallets(listWallets())
    return subscribeToWallets(setWallets)
  }, [])

  const capable = wallets.filter(supportsStrk20)
  const target = address ?? observerAddress
  const valid = looksLikeAddress(draft)

  // Connected: identity + the ability to step back to observing.
  if (status === 'connected' && address) {
    return (
      <div className="panel flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <StateBadge state="private">wallet connected</StateBadge>
          <div>
            <p className="text-[12.5px] font-medium leading-tight">{walletName}</p>
            <Hex value={address} chars={6} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  // Observing a pasted address: analysis works, acting does not.
  if (observerAddress) {
    return (
      <div className="panel flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <StateBadge state="neutral">observing</StateBadge>
          <div>
            <p className="text-[12.5px] font-medium leading-tight">Read-only analysis</p>
            <Hex value={observerAddress} chars={6} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {capable.length > 0 && (
            <Button size="sm" onClick={() => connect(capable[0])}>
              Connect to act
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setObserverAddress(null)}>
            Clear
          </Button>
        </div>
      </div>
    )
  }

  // Nothing selected yet — lead with the thing that needs no permission.
  return (
    <div className="panel p-5 sm:p-6">
      <p className="mono-label">Choose a target</p>
      <h2 className="display-md mt-2 text-balance">Who are we analysing?</h2>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-muted text-pretty">
        Exposure analysis reads public chain data only — paste any Starknet address and the
        adversary will run against it. Connect a wallet when you want to act on what it finds.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <div>
          <label className="list-header" htmlFor="target-address">
            Any Starknet address
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-ink/[0.04] px-4 focus-within:ring-2 focus-within:ring-ink/40">
            <input
              id="target-address"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && valid) setObserverAddress(draft.trim())
              }}
              placeholder="0x04d2…"
              spellCheck={false}
              className="h-11 flex-1 bg-transparent font-mono text-[13.5px] outline-none placeholder:text-ink-faint"
            />
            {draft.length > 0 && !valid && (
              <span className="shrink-0 font-mono text-[11px] text-ember">not an address</span>
            )}
          </div>
        </div>

        <Button disabled={!valid} onClick={() => setObserverAddress(draft.trim())}>
          Run adversary
        </Button>

        <div className="lg:pb-0">
          {!mounted ? (
            <div className="h-10 w-40 rounded-full shimmer" />
          ) : capable.length > 0 ? (
            <Button variant="secondary" onClick={() => connect(capable[0])}>
              {status === 'connecting' ? 'Connecting…' : `Connect ${capable[0].name}`}
            </Button>
          ) : (
            <p className="max-w-[220px] text-[11.5px] leading-snug text-ink-faint text-pretty">
              No STRK20 wallet detected. Ready supports it today; Xverse is in progress.
            </p>
          )}
        </div>
      </div>

      {!target && (
        <p className="mt-4 text-[11.5px] text-ink-faint">
          No wallet needed to see how linkable an address is.
        </p>
      )}
    </div>
  )
}
