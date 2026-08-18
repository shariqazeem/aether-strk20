/**
 * Live STRK20 protocol configuration — Starknet mainnet.
 *
 * Every address here is a real mainnet deployment. Nothing in Aether points at
 * a mock, a devnet, or a simulated balance.
 */

import { constants } from 'starknet'

/** Aether targets mainnet only. */
export const CHAIN_ID = constants.StarknetChainId.SN_MAIN

/**
 * The live STRK20 privacy pool.
 * Every private note Aether ever holds lives inside this contract.
 */
export const POOL_ADDRESS =
  '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a'

/**
 * Anonymizer class hashes. These are the audited helper classes that expose
 * `privacy_invoke`, letting the pool call out to DeFi and credit the result
 * straight back into an open note.
 *
 * NOTE: these are CLASS hashes, not deployed contract addresses. The deployed
 * instance address for each route is resolved at runtime and must be confirmed
 * before an invoke action is built — see `resolveAnonymizer`.
 */
export const ANONYMIZER_CLASS_HASHES = {
  ekubo: '0x2a4ac595283d4d64b9952f5ef5c0da1775bfdb7c9d92237524a21dd8d19ebd7',
  vesu: '0x3751128dc3ebd36215f982766f14aaca8f78793e4b0f42a73e49372a8e24aae',
} as const

/** RPC endpoint. Supplied by the operator; never committed. */
export const RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL ?? 'https://starknet-mainnet.public.blastapi.io/rpc/v0_9'

/**
 * Minimum Wallet API version that carries the STRK20 methods.
 * Feature-detect with `supportedWalletApi`, never by probing a data method —
 * probing `strk20Balances` triggers a consent prompt for data we have no
 * reason to read.
 */
export const REQUIRED_WALLET_API_VERSION = '0.10.3'

/**
 * A new note is not spendable immediately. The pool needs roughly this many
 * blocks before a freshly created note can be consumed, and the UI has to make
 * that wait legible rather than looking broken.
 */
export const NOTE_MATURITY_BLOCKS = 10

/**
 * The pool charges a flat fee per private operation, denominated in STRK.
 * This constant is only a display fallback for first paint — the real value is
 * read from the pool's `get_fee_amount` and must be subtracted before
 * pre-filling any MAX amount, or the operation fails after the user has signed.
 */
export const FALLBACK_POOL_FEE_STRK = 4n * 10n ** 18n

export type TokenSymbol = 'STRK' | 'USDC' | 'ETH' | 'WBTC'

export interface TokenConfig {
  symbol: TokenSymbol
  name: string
  address: string
  decimals: number
  /** Display grouping for the portfolio ring. */
  kind: 'stable' | 'native' | 'major'
}

/**
 * Mainnet tokens Aether can shield and route.
 *
 * Addresses are the canonical Starknet mainnet deployments. `verifyTokens()`
 * in `lib/strk20/verify.ts` re-checks each one against the chain at boot in
 * development, so a stale constant surfaces immediately instead of silently
 * routing value to the wrong contract.
 */
export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  STRK: {
    symbol: 'STRK',
    name: 'Starknet Token',
    address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    decimals: 18,
    kind: 'native',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
    decimals: 6,
    kind: 'stable',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ether',
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    decimals: 18,
    kind: 'major',
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
    decimals: 8,
    kind: 'major',
  },
}

export const TOKEN_LIST = Object.values(TOKENS)

/** Felt-safe address comparison. Padded and unpadded hex name the same token. */
export function sameAddress(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false
  try {
    return BigInt(a) === BigInt(b)
  } catch {
    return false
  }
}

/** Look a token up by address, tolerating padding differences. */
export function tokenByAddress(address: string): TokenConfig | undefined {
  return TOKEN_LIST.find((t) => sameAddress(t.address, address))
}

/** Voyager link for any mainnet transaction. */
export function explorerTx(hash: string): string {
  return `https://voyager.online/tx/${hash}`
}

export function explorerContract(address: string): string {
  return `https://voyager.online/contract/${address}`
}
