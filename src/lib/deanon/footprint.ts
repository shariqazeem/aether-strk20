'use client'

import type { PoolActivityResult } from '@/lib/strk20/pool-activity'
import { denominationTier } from '@/lib/strk20/pool-activity'
import type { LedgerEntry } from '@/lib/history'
import type { ObservedEvent } from './types'

/**
 * What an adversary can actually see about a target.
 *
 * Two sources, and the difference between them is the whole product:
 *
 *   - The **public legs** — deposits and withdrawals — carry an address and an
 *     amount in the clear. This is what an outside observer works from.
 *   - The **local ledger** — what the user actually did. In-pool actions emit a
 *     commitment, not a value, so an observer genuinely cannot see them. They
 *     are included with `amountKnown: false` so heuristics can reason about
 *     *timing* (which is observable) without inventing amounts (which are not).
 *
 * Fabricating an amount for a private action would make the adversary lie in
 * the target's favour, which is worse than useless.
 */

/** Ledger entry kinds whose amount is genuinely public on-chain. */
const PUBLIC_KINDS = new Set<LedgerEntry['type']>(['SHIELD'])

export function buildFootprint(params: {
  ledger: LedgerEntry[]
  poolResult?: PoolActivityResult | null
}): ObservedEvent[] {
  const events: ObservedEvent[] = params.ledger.map((entry) => {
    const isPublic = PUBLIC_KINDS.has(entry.type)

    return {
      kind: isPublic ? 'deposit' : 'action',
      asset: entry.asset,
      amount: isPublic ? entry.amount : 0n,
      amountKnown: isPublic,
      timestamp: entry.timestamp,
      tier: isPublic ? denominationTier(entry.amount) : 'private',
      txHash: entry.txHash,
    }
  })

  return events.sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Public pool events attributable to one address.
 *
 * NOT YET IMPLEMENTED. Attributing a pool event to an actor requires decoding
 * the indexed keys of each event type, and getting that wrong would either
 * miss real exposure or invent it — both worse than reporting nothing. Until
 * the per-event decode is verified against mainnet, this returns an empty list
 * and callers fall back to the ledger, which is honest about its own scope.
 *
 * The pieces already in place: `readPoolActivity` pages the pool's events and
 * buckets them by the indexed token key, so the paging and key handling are
 * proven — only per-actor attribution is missing.
 */
export async function fetchPublicFootprint(address: string): Promise<ObservedEvent[]> {
  void address
  return []
}
