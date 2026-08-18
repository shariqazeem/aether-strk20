/**
 * STRK20 action builders.
 *
 * Every private operation Aether performs is expressed as a `STRK20_ACTION[]`
 * handed to the user's wallet via `strk20InvokeTransaction`. The wallet owns
 * viewing keys, note discovery, proving and submission — Aether never sees
 * private state and never asks for a viewing key.
 *
 * The shapes below are taken from `@starknet-io/types-js@0.10.3` and from the
 * action sequence shipped in `@avnu/avnu-sdk@4.2.0` (`buildStrk20Actions`),
 * not from prose documentation. The published docs show an abbreviated
 * two-action private-DeFi example that omits the input and fee withdrawals;
 * building against it produces a transaction the pool rejects.
 */

import type { STRK20_ACTION } from '@starknet-io/types-js'
import { POOL_ADDRESS, sameAddress } from './config'

/** The wallet expands this to the id of the Nth open note in the same transaction. */
export const openNoteRef = (index: number): string => `\${openNoteIds[${index}]}`

/** The wallet expands this to the privacy pool address. */
export const POOL_ADDRESS_REF = '${poolAddress}'

/**
 * Shield: move public funds into the pool.
 *
 * This is deliberately a standalone transaction. A deposit is public and names
 * the depositor; a later private action has no public leg. Because they are
 * separate transactions nothing on-chain ties them together, and that
 * separation is the entire basis of the anonymity set. Never bundle a shield
 * with the strategy action it funds.
 *
 * The wallet will prompt twice — the ERC-20 approve must land before the
 * deposit. Label both steps in the UI or the second prompt reads as a bug.
 */
export function buildShield(token: string, amount: bigint): STRK20_ACTION[] {
  return [{ type: 'deposit', token, amount: `0x${amount.toString(16)}` }]
}

/**
 * Private transfer between two registered pool users.
 * No contract call, no event, no approval step, no public leg.
 */
export function buildPrivateTransfer(
  token: string,
  amount: bigint,
  recipient: string,
): STRK20_ACTION[] {
  return [{ type: 'transfer', token, amount: `0x${amount.toString(16)}`, recipient }]
}

export interface PrivateDefiPlan {
  /** Asset leaving the pool into the helper. */
  tokenIn: string
  amountIn: bigint
  /** Asset the helper returns, credited into the open note. */
  tokenOut: string
  /** The deployed anonymizer / executor contract exposing `privacy_invoke`. */
  helperAddress: string
  /** The user's own address — owner of the resulting note. */
  takerAddress: string
  /** Helper-specific calldata, appended after tokenOut and before the note ref. */
  helperCalldata: string[]
  /** Optional paymaster fee leg, when the route charges one from private balance. */
  fee?: { token: string; amount: bigint; recipient: string }
}

/**
 * Private DeFi: one atomic transaction that moves value out to a helper,
 * runs it, and credits the result straight back into a fresh private note.
 *
 * Action order is load-bearing and must not be rearranged:
 *   1. withdraw the input to the helper
 *   2. withdraw the route fee (when the route charges one)
 *   3. open the note the output lands in  (`amount: "OPEN"`)
 *   4. invoke the helper, referencing that note
 *
 * The `withdraw` legs here are NOT an unshield. They move value to a contract
 * that immediately returns it to the pool inside the same transaction; the
 * funds never reach a public user-controlled address and the position never
 * leaves the shielded environment. `assertNeverUnshields` below enforces that
 * distinction, which is the one invariant separating Aether from a mixer.
 *
 * Observers see: pool → helper → AMM → helper. They never see who initiated it.
 */
export function buildPrivateDefi(plan: PrivateDefiPlan): STRK20_ACTION[] {
  const actions: STRK20_ACTION[] = [
    {
      type: 'withdraw',
      token: plan.tokenIn,
      amount: `0x${plan.amountIn.toString(16)}`,
      recipient: plan.helperAddress,
    },
  ]

  if (plan.fee && plan.fee.amount > 0n) {
    actions.push({
      type: 'withdraw',
      token: plan.fee.token,
      amount: `0x${plan.fee.amount.toString(16)}`,
      recipient: plan.fee.recipient,
    })
  }

  actions.push({
    type: 'transfer',
    token: plan.tokenOut,
    amount: 'OPEN',
    recipient: plan.takerAddress,
  })

  actions.push({
    type: 'invoke',
    contract: plan.helperAddress,
    // Calldata is deserialized straight into the helper's `privacy_invoke`
    // parameters, so the order must match that signature exactly.
    calldata: [plan.tokenOut, ...plan.helperCalldata, openNoteRef(0)],
  })

  return actions
}

/** An address that value is allowed to be withdrawn to during private DeFi. */
export interface WithdrawAllowlist {
  /** Deployed helper/executor contracts, plus any fee recipients they declare. */
  contracts: string[]
}

/**
 * Aether's core promise, enforced mechanically: capital never leaves the
 * shielded environment unless the user explicitly asked to unshield.
 *
 * A `withdraw` is permitted only when its recipient is a known helper contract
 * or declared fee recipient participating in the same atomic transaction. A
 * withdraw to any other address — in particular the user's own public account —
 * is an unshield, and must never be produced by the strategy engine.
 *
 * Throws rather than returning false: this runs immediately before the user is
 * asked to sign, and a silent boolean would be too easy to ignore at a call site.
 */
export function assertNeverUnshields(
  actions: STRK20_ACTION[],
  allowlist: WithdrawAllowlist,
): void {
  for (const [index, action] of actions.entries()) {
    if (action.type !== 'withdraw') continue

    const permitted = allowlist.contracts.some((address) =>
      sameAddress(address, action.recipient),
    )

    if (!permitted) {
      throw new Error(
        `Refusing to submit: action ${index} withdraws to ${action.recipient}, which is not a ` +
          `helper contract in this transaction. That is an unshield, and Aether only unshields ` +
          `on an explicit user request.`,
      )
    }
  }
}

/**
 * Explicit, user-initiated unshield. Deliberately the only function in the
 * codebase that produces a withdraw to an arbitrary recipient, and deliberately
 * not reachable from the strategy engine.
 */
export function buildExplicitUnshield(
  token: string,
  amount: bigint,
  recipient: string,
): STRK20_ACTION[] {
  return [{ type: 'withdraw', token, amount: `0x${amount.toString(16)}`, recipient }]
}

/** Human-readable summary of an action list, for the pre-signature review step. */
export function describeActions(actions: STRK20_ACTION[]): string[] {
  return actions.map((action) => {
    switch (action.type) {
      case 'deposit':
        return `Shield ${action.amount} of ${action.token} into the pool`
      case 'withdraw':
        return `Move ${action.amount} of ${action.token} to ${action.recipient}`
      case 'transfer':
        return action.amount === 'OPEN'
          ? `Open a note for ${action.token} owned by ${action.recipient}`
          : `Privately send ${action.amount} of ${action.token} to ${action.recipient}`
      case 'invoke':
        return `Invoke helper ${action.contract}`
    }
  })
}

/** Wallet API error codes worth handling explicitly in the UI. */
export const STRK20_ERRORS = {
  NOT_REGISTERED: 118,
  INSUFFICIENT_PRIVATE_BALANCE: 119,
  PRIVACY_LEAK: 120,
} as const

export function explainWalletError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? Number((error as { code: unknown }).code)
      : undefined

  switch (code) {
    case STRK20_ERRORS.NOT_REGISTERED:
      return 'This account is not registered with the pool yet. The wallet registers you on first use — approve that step and retry.'
    case STRK20_ERRORS.INSUFFICIENT_PRIVATE_BALANCE:
      return 'Not enough shielded balance for this action once the pool fee is included. Shield more, or reduce the amount.'
    case STRK20_ERRORS.PRIVACY_LEAK:
      return 'The wallet refused this action because it would leak a link between your public and private identity.'
    default:
      return error instanceof Error ? error.message : 'The wallet rejected the transaction.'
  }
}

export { POOL_ADDRESS }
