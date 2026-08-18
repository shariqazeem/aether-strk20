'use client'

import { create } from 'zustand'
import type { WalletAccountV6 } from 'starknet'
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features'
import { connectWallet, readShieldedBalances, type ShieldedBalance } from '@/lib/strk20/wallet'
import type { StrategyMode } from '@/lib/engine/types'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface AetherState {
  status: ConnectionStatus
  error: string | null
  account: WalletAccountV6 | null
  address: string | null
  walletName: string | null

  balances: ShieldedBalance[]
  balancesLoading: boolean
  /** Null until the user explicitly asks — reading balances prompts for consent. */
  balancesRequestedAt: number | null

  strategy: StrategyMode
  privacyFloor: number

  /**
   * An address being inspected without a wallet.
   *
   * The adversary only reads public chain data, so it works on anyone —
   * including a pasted address. Gating the whole app behind a wallet would
   * make the headline feature unreachable for most visitors, so exposure
   * analysis is deliberately open and only the acting surfaces need a wallet.
   */
  observerAddress: string | null

  connect: (wallet: WalletWithStarknetFeatures) => Promise<void>
  disconnect: () => void
  refreshBalances: () => Promise<void>
  setStrategy: (mode: StrategyMode) => void
  setPrivacyFloor: (floor: number) => void
  setObserverAddress: (address: string | null) => void
}

/** The address currently under analysis: the connected wallet, else the pasted one. */
export function useTargetAddress(): string | null {
  return useAether((state) => state.address ?? state.observerAddress)
}

export const useAether = create<AetherState>((set, get) => ({
  status: 'disconnected',
  error: null,
  account: null,
  address: null,
  walletName: null,

  balances: [],
  balancesLoading: false,
  balancesRequestedAt: null,

  strategy: 'BALANCED',
  privacyFloor: 60,
  observerAddress: null,

  async connect(wallet) {
    set({ status: 'connecting', error: null })
    try {
      const account = await connectWallet(wallet)
      set({
        status: 'connected',
        account,
        address: account.address,
        walletName: wallet.name,
        error: null,
      })
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not connect to that wallet.',
        account: null,
        address: null,
      })
    }
  },

  disconnect() {
    set({
      status: 'disconnected',
      account: null,
      address: null,
      walletName: null,
      balances: [],
      balancesRequestedAt: null,
      error: null,
    })
  },

  async refreshBalances() {
    const { account } = get()
    if (!account) return

    set({ balancesLoading: true, error: null })
    try {
      const balances = await readShieldedBalances(account)
      set({ balances, balancesLoading: false, balancesRequestedAt: Date.now() })
    } catch (error) {
      set({
        balancesLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'The wallet declined the balance request.',
      })
    }
  },

  setStrategy(strategy) {
    set({ strategy })
  },

  setPrivacyFloor(privacyFloor) {
    set({ privacyFloor })
  },

  setObserverAddress(observerAddress) {
    set({ observerAddress })
  },
}))
