/**
 * Amount splitting — the part of the engine that decides how much.
 *
 * Three properties matter and they fight each other:
 *   1. the splits must sum to EXACTLY the requested total (hard invariant),
 *   2. no split may be a round human number, and
 *   3. no split may repeat an amount this wallet used in the last 48h.
 *
 * (1) wins ties, because a plan whose parts do not add up is not a plan. (2)
 * and (3) are enforced by a bounded repair loop that always moves value
 * *between* splits, never in or out, so the sum invariant survives every fix.
 *
 * Everything is driven by a seeded PRNG. `Math.random()` appears nowhere in
 * this engine: a plan a user cannot reproduce is a plan they cannot audit.
 */

/* ------------------------------------------------------------------ */
/* deterministic PRNG — shared by the whole engine                     */
/* ------------------------------------------------------------------ */

/**
 * mulberry32: a 32-bit seeded PRNG returning uniform doubles in [0,1).
 * Small, fast and — the only property we actually need — reproducible.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Derive an independent sub-seed from a base seed and a salt, so different
 * stages of one plan do not share a stream while the whole plan stays
 * reproducible from a single number.
 */
export function mixSeed(seed: number, salt: number): number {
  let h = (Math.trunc(seed) ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ ((Math.trunc(salt) + 0x85ebca6b) | 0), 0xc2b2ae35) >>> 0
  h = (h ^ (h >>> 13)) >>> 0
  return h >>> 0
}

/* ------------------------------------------------------------------ */
/* public shapes                                                       */
/* ------------------------------------------------------------------ */

/** An amount this wallet has already exposed, and when. */
export interface RecentAmount {
  amount: bigint
  /** ms epoch */
  timestamp: number
}

export interface SplitOptions {
  /** Target number of splits. Reduced only if the total is too small to divide. */
  count: number
  /** Seed for the deterministic PRNG. */
  seed: number
  /** Token decimals; defaults to 18. */
  decimals?: number
  /** Amounts this wallet has already used, for the 48h no-reuse rule. */
  recentAmounts?: readonly RecentAmount[]
  /**
   * ms epoch used to age `recentAmounts`. Defaults to the newest timestamp in
   * `recentAmounts`, which is the conservative choice — it treats the whole
   * supplied window as live rather than silently un-blocking amounts.
   */
  now?: number
  /** Override the 48h reuse window. */
  reuseWindowMs?: number
}

/** No amount used inside this window may be emitted again. */
export const AMOUNT_REUSE_WINDOW_MS = 48 * 60 * 60 * 1000

/** Relative sizes real pool notes cluster around, before jitter. */
const SHAPE_MULTIPLIERS: readonly number[] = [0.6, 0.8, 1, 1.2, 1.6, 2]

/** Give up repairing after this many passes and keep the sum invariant. */
const MAX_REPAIR_PASSES = 512

/* ------------------------------------------------------------------ */
/* predicates                                                          */
/* ------------------------------------------------------------------ */

/**
 * True when the amount is a whole multiple of 10^k token units for some k >= 1
 * — i.e. it is the kind of number a human types. 10, 100, 1,000 and 25,000 are
 * all round; 1,372.418 is not. Zero counts as round.
 */
export function isRoundAmount(amount: bigint, decimals = 18): boolean {
  const modulus = 10n ** BigInt(Math.max(0, Math.trunc(decimals)) + 1)
  return amount % modulus === 0n
}

/**
 * True when this exact amount was already used inside the reuse window.
 * Future-dated entries also count: they are pending, not expired.
 */
export function isAmountRecentlyUsed(
  amount: bigint,
  recentAmounts: readonly RecentAmount[],
  now: number,
  windowMs: number = AMOUNT_REUSE_WINDOW_MS,
): boolean {
  for (const entry of recentAmounts) {
    if (entry.amount !== amount) continue
    const age = now - entry.timestamp
    if (age < 0 || age <= windowMs) return true
  }
  return false
}

/* ------------------------------------------------------------------ */
/* splitter                                                            */
/* ------------------------------------------------------------------ */

function scaleBigInt(value: bigint, fraction: number): bigint {
  const safe = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0
  return (value * BigInt(Math.round(safe * 1e9))) / 1_000_000_000n
}

/**
 * Split `total` into `opts.count` non-round, non-repeating, pool-typical parts.
 *
 * Guarantees, in priority order:
 *   - the returned parts sum to exactly `total` (throws if it ever fails),
 *   - every part is strictly positive,
 *   - no part is a round token amount, is duplicated within the result, or
 *     repeats an amount from `recentAmounts` inside the 48h window — best
 *     effort, and always subordinate to the sum invariant,
 *   - identical inputs always produce an identical array.
 *
 * A `count` of 1 returns `[total]` unchanged: with one part there is no degree
 * of freedom left, and the sum invariant is not negotiable.
 */
export function splitAmount(total: bigint, opts: SplitOptions): bigint[] {
  if (total <= 0n) return []

  const decimals = Math.max(0, Math.trunc(opts.decimals ?? 18))
  const recent = opts.recentAmounts ?? []
  const now =
    opts.now ??
    recent.reduce((m, r) => (r.timestamp > m ? r.timestamp : m), Number.NEGATIVE_INFINITY)
  const reuseWindow = opts.reuseWindowMs ?? AMOUNT_REUSE_WINDOW_MS

  /** Smallest unit the splitter is willing to move: 1e-6 of a token. */
  const grain = 10n ** BigInt(Math.max(0, decimals - 6))

  const requested = Math.max(1, Math.floor(opts.count))
  const capacity = grain > 0n ? Number(total / grain) : requested
  const count = Math.max(1, Math.min(requested, Number.isFinite(capacity) ? capacity : requested))
  if (count === 1) return [total]

  const rng = mulberry32(opts.seed)

  // Weights shaped like real pool denominations, then jittered so no two
  // tranches share a size an observer could pair up.
  const weights: number[] = []
  for (let i = 0; i < count; i += 1) {
    const shape = SHAPE_MULTIPLIERS[Math.floor(rng() * SHAPE_MULTIPLIERS.length) % SHAPE_MULTIPLIERS.length]
    weights.push(shape * (0.78 + 0.44 * rng()))
  }

  const parts: bigint[] = []
  let remaining = total
  let weightLeft = weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < count - 1; i += 1) {
    const slotsAfter = BigInt(count - 1 - i)
    let part = scaleBigInt(remaining, weightLeft > 0 ? weights[i] / weightLeft : 0)
    const floorPart = grain
    const ceilPart = remaining - grain * slotsAfter
    if (part < floorPart) part = floorPart
    if (part > ceilPart) part = ceilPart
    parts.push(part)
    remaining -= part
    weightLeft -= weights[i]
  }
  parts.push(remaining)

  const blocked = new Set<string>()
  for (const entry of recent) {
    const age = now - entry.timestamp
    if (age < 0 || age <= reuseWindow) blocked.add(entry.amount.toString())
  }

  repair(parts, decimals, grain, blocked, rng)

  const sum = parts.reduce((a, b) => a + b, 0n)
  if (sum !== total) {
    throw new Error(
      `splitAmount invariant violated: parts sum to ${sum} but total is ${total}`,
    )
  }
  return parts
}

/** Why a part is unacceptable, or null when it is fine. */
function faultOf(
  parts: readonly bigint[],
  index: number,
  decimals: number,
  blocked: ReadonlySet<string>,
): string | null {
  const value = parts[index]
  if (value <= 0n) return 'nonpositive'
  if (isRoundAmount(value, decimals)) return 'round'
  if (blocked.has(value.toString())) return 'reused'
  for (let i = 0; i < parts.length; i += 1) {
    if (i !== index && parts[i] === value) return 'duplicate'
  }
  return null
}

/**
 * Move value between parts until none of them is round, reused, duplicated or
 * non-positive. Every mutation is a matched +delta/-delta pair, so the sum is
 * invariant across the whole loop by construction.
 */
function repair(
  parts: bigint[],
  decimals: number,
  grain: bigint,
  blocked: ReadonlySet<string>,
  rng: () => number,
): void {
  const step = grain > 0n ? grain : 1n
  for (let pass = 0; pass < MAX_REPAIR_PASSES; pass += 1) {
    let bad = -1
    for (let i = 0; i < parts.length; i += 1) {
      if (faultOf(parts, i, decimals, blocked) !== null) {
        bad = i
        break
      }
    }
    if (bad === -1) return

    // Dust with a non-zero low digit, so adding it to a round number cannot
    // leave a round number behind.
    const pct = 1 + Math.floor(rng() * 370)
    let nudge = (parts[bad] * BigInt(pct)) / 10_000n + BigInt(1 + Math.floor(rng() * 9)) * step
    if (nudge <= 0n) nudge = step

    let donor = -1
    for (let attempt = 0; attempt < 4 && donor === -1; attempt += 1) {
      let bestValue = 0n
      for (let i = 0; i < parts.length; i += 1) {
        if (i === bad) continue
        if (parts[i] - nudge <= step * 2n) continue
        if (parts[i] > bestValue) {
          bestValue = parts[i]
          donor = i
        }
      }
      if (donor === -1) nudge = nudge / 2n > 0n ? nudge / 2n : step
    }
    if (donor === -1) return

    parts[bad] += nudge
    parts[donor] -= nudge
  }
}
