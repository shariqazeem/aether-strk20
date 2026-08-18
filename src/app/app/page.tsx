'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features'
import { useAether } from '@/lib/store/aether'
import { listWallets, subscribeToWallets, supportsStrk20, formatUnits } from '@/lib/strk20/wallet'
import { PrivacyScore, type ScoreDimensions } from '@/components/privacy-score'
import { ShieldPanel } from '@/components/app/shield-panel'
import {
  AetherMark,
  Button,
  Container,
  Hex,
  StateBadge,
} from '@/components/ui/primitives'
import { POOL_ADDRESS, explorerContract, NOTE_MATURITY_BLOCKS } from '@/lib/strk20/config'

export default function AppPage() {
  const status = useAether((s) => s.status)

  return (
    <div className="min-h-screen bg-paper-sunk/60">
      <AppHeader />
      <main className="py-8">
        <Container>{status === 'connected' ? <Dashboard /> : <ConnectGate />}</Container>
      </main>
    </div>
  )
}

function AppHeader() {
  const { status, address, walletName, disconnect } = useAether()

  return (
    <header className="glass sticky top-0 z-40 border-b border-rule">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AetherMark />
            <span className="text-[15px] font-semibold tracking-tight">Aether</span>
          </Link>

          {status === 'connected' && address ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-[12px] font-medium leading-tight">{walletName}</p>
                <Hex value={address} chars={4} />
              </div>
              <Button variant="secondary" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <StateBadge state="neutral">not connected</StateBadge>
          )}
        </div>
      </Container>
    </header>
  )
}

function ConnectGate() {
  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([])
  const [mounted, setMounted] = useState(false)
  const { connect, status, error } = useAether()

  useEffect(() => {
    setMounted(true)
    setWallets(listWallets())
    return subscribeToWallets(setWallets)
  }, [])

  const capable = wallets.filter(supportsStrk20)
  const incapable = wallets.filter((wallet) => !supportsStrk20(wallet))

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="display-md text-balance">Connect a privacy-enabled wallet</h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted text-pretty">
        Aether never holds your viewing key and never generates proofs — your wallet does both.
        It needs to speak Wallet API 0.10.3 or newer.
      </p>

      <div className="mt-7 space-y-2.5">
        {!mounted ? (
          <div className="h-16 rounded-2xl shimmer" />
        ) : capable.length === 0 && incapable.length === 0 ? (
          <div className="card-flat p-6 text-center">
            <p className="text-[14px] font-semibold">No Starknet wallet detected</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted text-pretty">
              Install a privacy-enabled wallet — Ready supports STRK20 today; Xverse is in
              progress — then reload this page.
            </p>
          </div>
        ) : (
          <>
            {capable.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => connect(wallet)}
                disabled={status === 'connecting'}
                className="card flex w-full items-center gap-3.5 p-4 text-left transition-all hover:border-veil-mid disabled:opacity-60"
              >
                {wallet.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wallet.icon} alt="" className="size-9 rounded-[10px]" />
                ) : (
                  <span className="size-9 rounded-[10px] bg-paper-deep" />
                )}
                <span className="flex-1">
                  <span className="block text-[14px] font-semibold">{wallet.name}</span>
                  <span className="block text-[12px] text-ink-faint">Supports STRK20</span>
                </span>
                <StateBadge state="good">ready</StateBadge>
              </button>
            ))}

            {incapable.map((wallet) => (
              <div key={wallet.name} className="card-flat flex w-full items-center gap-3.5 p-4 opacity-65">
                {wallet.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wallet.icon} alt="" className="size-9 rounded-[10px] grayscale" />
                ) : (
                  <span className="size-9 rounded-[10px] bg-paper-deep" />
                )}
                <span className="flex-1">
                  <span className="block text-[14px] font-semibold">{wallet.name}</span>
                  <span className="block text-[12px] text-ink-faint">
                    No STRK20 support — needs Wallet API 0.10.3+
                  </span>
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-exposed-soft px-4 py-3">
          <p className="text-[13px] leading-snug text-exposed text-pretty">{error}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Until the wallet grants balance access there is nothing to score, and
 * inventing a number would undermine the premise. The empty state is honest.
 */
const AWAITING: ScoreDimensions = {
  anonymitySet: 0,
  amountEntropy: 0,
  timingEntropy: 0,
  behavioralUniqueness: 0,
  exitCorrelationRisk: 0,
}

function Dashboard() {
  const { balances, balancesLoading, balancesRequestedAt, refreshBalances, error } = useAether()
  const hasRead = balancesRequestedAt !== null

  return (
    <div className="space-y-5 py-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="list-header">Shielded portfolio</p>
          <h1 className="display-md mt-1.5">Your private position</h1>
        </div>
        <Button onClick={refreshBalances} disabled={balancesLoading} variant="secondary">
          {balancesLoading ? 'Waiting for wallet…' : hasRead ? 'Refresh balances' : 'Read balances'}
        </Button>
      </div>

      {!hasRead && (
        <div className="card-flat border-dashed p-5">
          <p className="text-[13.5px] font-semibold">Balances are not read automatically</p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted text-pretty">
            Reading shielded balances asks your wallet for consent to data Aether otherwise has no
            reason to see. Nothing is fetched until you press the button — and the score stays
            empty rather than showing an invented number.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-exposed-soft px-4 py-3">
          <p className="text-[13px] leading-snug text-exposed text-pretty">{error}</p>
        </div>
      )}

      <ShieldPanel />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13.5px] font-semibold tracking-tight">Private balances</h2>
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
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05] text-[10.5px] font-semibold text-ink-soft">
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
            <h2 className="text-[13.5px] font-semibold tracking-tight">Effective privacy</h2>
            <StateBadge state={hasRead ? 'private' : 'neutral'}>
              {hasRead ? 'live' : 'awaiting data'}
            </StateBadge>
          </div>
          <div className="mt-5">
            <PrivacyScore dimensions={AWAITING} compact />
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-ink-muted text-pretty">
            Computed from your action history and live pool activity. It stays at zero until there
            is real data behind it.
          </p>
        </section>
      </div>
    </div>
  )
}
