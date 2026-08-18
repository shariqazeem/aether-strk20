import { describe, expect, it } from 'vitest'

import { isAmountRecentlyUsed, isRoundAmount } from '../amount-splitter'
import {
  assertNoUnshield,
  generatePlan,
  IN_POOL_ROUTES,
  MODE_PROFILES,
  PLANNER_ACTION_TYPES,
  trancheCountFor,
  type PlannerInput,
} from '../planner'
import { computeEffectivePrivacy, scoreFromState } from '../privacy-score'
import type {
  ActionIntent,
  ActionRecord,
  PoolActivity,
  PrivateNote,
  StrategyMode,
  TokenSymbol,
} from '../types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const NOW = Date.UTC(2026, 7, 18, 9, 30, 0)

const usdc = (whole: number, micro = 0): bigint => BigInt(whole) * 1_000_000n + BigInt(micro)
const strk = (whole: number, atto = 0): bigint => BigInt(whole) * 10n ** 18n + BigInt(atto)

const POOL: PoolActivity = {
  tierCounts: { '1e0': 210, '1e1': 480, '1e2': 950, '1e3': 1240, '1e4': 310, '1e5': 60 },
  interArrivalsMs: [
    4 * MINUTE,
    22 * MINUTE,
    3 * HOUR,
    41 * MINUTE,
    9 * HOUR,
    75 * MINUTE,
    2 * HOUR,
    31 * HOUR,
    12 * MINUTE,
    6 * HOUR,
  ],
  totalNotes: 3250,
}

const PRICES: Partial<Record<TokenSymbol, number>> = {
  USDC: 1,
  STRK: 0.42,
  ETH: 3100,
  WBTC: 62_000,
}

function note(
  index: number,
  amount: bigint,
  asset: TokenSymbol = 'USDC',
  timestamp = NOW - 5 * DAY,
): PrivateNote {
  return {
    commitment: `0xc${index}`,
    asset,
    amount,
    leafIndex: index,
    nullifier: `0xn${index}`,
    timestamp,
  }
}

/** Six USDC notes all sitting in the 1e3 tier, plus two STRK notes elsewhere. */
const NOTES: PrivateNote[] = [
  note(1, usdc(1200, 431_207)),
  note(2, usdc(2380, 118_903)),
  note(3, usdc(4104, 990_117)),
  note(4, usdc(1733, 220_441)),
  note(5, usdc(2951, 77_318)),
  note(6, usdc(3418, 604_902)),
  note(7, strk(4102, 774_310_000_000_000), 'STRK'),
  note(8, strk(1877, 213_004_000_000_000), 'STRK'),
]

const HISTORY: ActionRecord[] = [
  { timestamp: NOW - 4 * DAY - 3 * HOUR, asset: 'USDC', amount: usdc(1421, 7), type: 'SWAP', route: 'AVNU' },
  { timestamp: NOW - 2 * DAY - 11 * HOUR, asset: 'STRK', amount: strk(931, 441_002), type: 'SWAP', route: 'EKUBO' },
  { timestamp: NOW - 30 * HOUR, asset: 'USDC', amount: usdc(2204, 71_339), type: 'LEND', route: 'VESU' },
  { timestamp: NOW - 9 * HOUR, asset: 'USDC', amount: usdc(1998, 640_223), type: 'SWAP', route: 'AVNU' },
]

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    mode: 'BALANCED',
    now: NOW,
    seed: 20260818,
    notes: NOTES,
    history: HISTORY,
    pool: POOL,
    privacyFloor: 0,
    targetAsset: 'STRK',
    prices: PRICES,
    ...overrides,
  }
}

const bigintJson = (value: unknown): string =>
  JSON.stringify(value, (_key, val: unknown) => (typeof val === 'bigint' ? `${val}n` : val))

const ALL_MODES: StrategyMode[] = [
  'PRIVACY_FIRST',
  'STEALTH_DCA',
  'WHALE_DISTRIBUTION',
  'YIELD_MAX',
  'BALANCED',
]

describe('generatePlan — shape', () => {
  it('returns a PlanResult, not a bare array', () => {
    const plan = generatePlan(input())
    expect(Array.isArray(plan)).toBe(false)
    expect(Array.isArray(plan.intents)).toBe(true)
    expect(Array.isArray(plan.refused)).toBe(true)
    expect(typeof plan.baselineScore).toBe('number')
    expect(typeof plan.projectedScore).toBe('number')
    expect(plan.mode).toBe('BALANCED')
    expect(plan.intents.length).toBeGreaterThan(0)
  })

  it('reports the baseline the score module would independently compute', () => {
    const plan = generatePlan(input())
    expect(plan.baselineScore).toBe(computeEffectivePrivacy(scoreFromState(HISTORY, NOTES, POOL)))
    expect(plan.baselineBreakdown).toEqual(scoreFromState(HISTORY, NOTES, POOL))
  })

  it('orders intents chronologically with non-overlapping windows inside the horizon', () => {
    const plan = generatePlan(input({ maxDelayMs: 18 * HOUR }))
    let previousEnd = NOW
    for (const intent of plan.intents) {
      expect(intent.recommendedWindowStart).toBeGreaterThan(NOW)
      expect(intent.recommendedWindowEnd).toBeGreaterThan(intent.recommendedWindowStart)
      expect(intent.recommendedWindowStart).toBeGreaterThanOrEqual(previousEnd)
      expect(intent.recommendedWindowEnd).toBeLessThanOrEqual(NOW + 18 * HOUR)
      previousEnd = intent.recommendedWindowEnd
    }
  })
})

describe('generatePlan — the plan never leaves the pool', () => {
  it('emits no withdraw or unshield action in any mode', () => {
    for (const mode of ALL_MODES) {
      const plan = generatePlan(input({ mode }))
      for (const intent of plan.intents) {
        expect(PLANNER_ACTION_TYPES).toContain(intent.type)
        expect(IN_POOL_ROUTES).toContain(intent.route)
        expect(intent.rationale.toLowerCase()).not.toMatch(/unshield|withdraw|deshield/)
      }
      expect(() => assertNoUnshield(plan.intents)).not.toThrow()
    }
  })

  it('has no unshield member in its action or route vocabulary', () => {
    expect(PLANNER_ACTION_TYPES).toEqual(['SWAP', 'LEND', 'REBALANCE', 'COMPACT'])
    expect(IN_POOL_ROUTES).toEqual(['AVNU', 'VESU', 'EKUBO', 'POOL'])
    expect(PLANNER_ACTION_TYPES).not.toContain('WITHDRAW')
    expect(PLANNER_ACTION_TYPES).not.toContain('UNSHIELD')
  })

  it('throws if an exit action is ever smuggled into a plan', () => {
    const [template] = generatePlan(input()).intents
    const forgedType = { ...template, type: 'WITHDRAW' } as unknown as ActionIntent
    const forgedRoute = { ...template, route: 'L1_BRIDGE' } as unknown as ActionIntent
    const forgedRationale: ActionIntent = {
      ...template,
      rationale: 'Unshield the position back to the public account.',
    }
    expect(() => assertNoUnshield([forgedType])).toThrow(/unshield path/i)
    expect(() => assertNoUnshield([forgedRoute])).toThrow(/private note/i)
    expect(() => assertNoUnshield([forgedRationale])).toThrow(/justified/i)
  })
})

describe('generatePlan — privacy floor', () => {
  it('refuses every action when the floor is unreachable, and says so', () => {
    const plan = generatePlan(input({ privacyFloor: 100 }))
    expect(plan.intents).toEqual([])
    expect(plan.refused.length).toBeGreaterThan(0)
    for (const refusal of plan.refused) {
      expect(refusal.reason.length).toBeGreaterThan(20)
      expect(refusal.wouldScore).toBeLessThan(100)
      expect(Number.isFinite(refusal.wouldScore)).toBe(true)
    }
    expect(plan.refused.some((r) => /floor/i.test(r.reason))).toBe(true)
    // A refused plan leaves the wallet exactly where it started.
    expect(plan.projectedScore).toBe(plan.baselineScore)
  })

  it('never emits an intent whose projected score is under the floor', () => {
    const baseline = generatePlan(input()).baselineScore
    const floor = Math.max(0, baseline - 1)
    const plan = generatePlan(input({ privacyFloor: floor }))
    let running = baseline
    for (const intent of plan.intents) {
      running += intent.expectedPrivacyDelta
      // Deltas are rounded to 1dp per intent, so allow the accumulated rounding.
      expect(running).toBeGreaterThan(floor - 0.5 * plan.intents.length)
    }
    expect(plan.projectedScore).toBeGreaterThanOrEqual(floor)
  })

  it('admits actions when the floor is 0 and blocks them when it is 100', () => {
    expect(generatePlan(input({ privacyFloor: 0 })).intents.length).toBeGreaterThan(0)
    expect(generatePlan(input({ privacyFloor: 100 })).intents.length).toBe(0)
  })
})

describe('generatePlan — 48h amount reuse', () => {
  it('never emits an amount this wallet used inside the last 48h', () => {
    const recent = HISTORY.filter((r) => NOW - r.timestamp <= 48 * HOUR).map((r) => ({
      amount: r.amount,
      timestamp: r.timestamp,
    }))
    for (const mode of ALL_MODES) {
      for (const intent of generatePlan(input({ mode })).intents) {
        expect(isAmountRecentlyUsed(intent.inputAmount, recent, NOW)).toBe(false)
      }
    }
  })

  it('does not repeat its own previous plan once those amounts are history', () => {
    const first = generatePlan(input())
    expect(first.intents.length).toBeGreaterThan(0)

    const executed: ActionRecord[] = first.intents.map((intent) => ({
      timestamp: NOW - HOUR,
      asset: intent.sourceAsset,
      amount: intent.inputAmount,
      type: intent.type,
      route: intent.route,
    }))
    const second = generatePlan(input({ history: [...HISTORY, ...executed] }))

    const alreadyUsed = new Set(first.intents.map((i) => i.inputAmount.toString()))
    for (const intent of second.intents) {
      expect(alreadyUsed.has(intent.inputAmount.toString())).toBe(false)
    }
  })

  it('emits no round amounts', () => {
    for (const mode of ALL_MODES) {
      const plan = generatePlan(input({ mode }))
      const swaps = plan.intents.filter((i) => i.type !== 'COMPACT')
      expect(swaps.length).toBeGreaterThan(0)
      for (const intent of swaps) {
        expect(isRoundAmount(intent.inputAmount, 6)).toBe(false)
      }
    }
  })
})

describe('generatePlan — note compaction', () => {
  it('compacts an over-full tier first, before anything adds to it', () => {
    const plan = generatePlan(input({ maxNotesPerTier: 4 }))
    const compactions = plan.intents.filter((i) => i.type === 'COMPACT')
    expect(compactions.length).toBe(1)

    const [compact] = compactions
    expect(compact.route).toBe('POOL')
    expect(compact.sourceAsset).toBe('USDC')
    expect(compact.inputAmount).toBe(
      NOTES.filter((n) => n.asset === 'USDC').reduce((a, n) => a + n.amount, 0n),
    )
    expect(plan.intents[0].id).toBe(compact.id)
    for (const other of plan.intents.filter((i) => i.type !== 'COMPACT')) {
      expect(other.recommendedWindowStart).toBeGreaterThanOrEqual(compact.recommendedWindowEnd)
    }
  })

  it('does not compact when the tier is inside its cap', () => {
    const plan = generatePlan(input({ maxNotesPerTier: 10 }))
    expect(plan.intents.filter((i) => i.type === 'COMPACT')).toEqual([])
  })
})

describe('generatePlan — strategy modes are a weighting', () => {
  it('gives every mode weights that sum to 1', () => {
    for (const mode of ALL_MODES) {
      const profile = MODE_PROFILES[mode]
      expect(profile.returnWeight + profile.privacyWeight).toBeCloseTo(1, 12)
      expect(profile.deployFraction).toBeGreaterThan(0)
      expect(profile.deployFraction).toBeLessThanOrEqual(1)
    }
  })

  it('derives tranche count from the privacy weight alone', () => {
    expect(trancheCountFor(0)).toBe(2)
    expect(trancheCountFor(1)).toBe(10)
    expect(trancheCountFor(MODE_PROFILES.PRIVACY_FIRST.privacyWeight)).toBeGreaterThan(
      trancheCountFor(MODE_PROFILES.YIELD_MAX.privacyWeight),
    )
  })

  it('splits a privacy-first plan into more tranches than a yield-max plan', () => {
    const privacyFirst = generatePlan(input({ mode: 'PRIVACY_FIRST' }))
    const yieldMax = generatePlan(input({ mode: 'YIELD_MAX' }))
    const count = (mode: typeof privacyFirst) => mode.intents.filter((i) => i.type !== 'COMPACT').length
    expect(count(privacyFirst)).toBeGreaterThan(count(yieldMax))
  })

  it('never picks a worse-yielding campaign as the return weight rises', () => {
    const byReturnWeight = [...ALL_MODES].sort(
      (a, b) => MODE_PROFILES[a].returnWeight - MODE_PROFILES[b].returnWeight,
    )
    let previous = Number.NEGATIVE_INFINITY
    for (const mode of byReturnWeight) {
      const campaign = generatePlan(input({ mode })).campaign
      expect(campaign).toBeDefined()
      if (!campaign) continue
      expect(campaign.netReturnBps).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = campaign.netReturnBps
    }
  })

  it('routes a yield-max plan into the lending venue', () => {
    const plan = generatePlan(input({ mode: 'YIELD_MAX' }))
    expect(plan.campaign?.route).toBe('VESU')
    expect(plan.campaign?.type).toBe('LEND')
    for (const intent of plan.intents.filter((i) => i.type !== 'COMPACT')) {
      expect(intent.route).toBe('VESU')
      expect(intent.type).toBe('LEND')
    }
  })

  it('deploys a larger share under whale distribution than under stealth DCA', () => {
    const deployed = (mode: StrategyMode): bigint =>
      generatePlan(input({ mode }))
        .intents.filter((i) => i.type !== 'COMPACT')
        .reduce((a, i) => a + i.inputAmount, 0n)
    expect(deployed('WHALE_DISTRIBUTION') > deployed('STEALTH_DCA')).toBe(true)
  })
})

describe('generatePlan — irregular scheduling', () => {
  /** Start-to-start intervals: what an observer actually times. */
  const startIntervals = (plan: ReturnType<typeof generatePlan>): number[] => {
    const starts = plan.intents
      .filter((i) => i.type !== 'COMPACT')
      .map((i) => i.recommendedWindowStart)
    const gaps: number[] = []
    for (let i = 1; i < starts.length; i += 1) gaps.push(starts[i] - starts[i - 1])
    return gaps
  }

  it('never spaces tranches evenly, in any mode', () => {
    for (const mode of ALL_MODES) {
      const gaps = startIntervals(generatePlan(input({ mode })))
      if (gaps.length < 2) continue
      expect(new Set(gaps).size).toBeGreaterThan(1)
      for (let i = 1; i < gaps.length; i += 1) {
        const scale = Math.max(gaps[i], gaps[i - 1])
        expect(Math.abs(gaps[i] - gaps[i - 1]) / scale).toBeGreaterThan(0.02)
      }
    }
  })

  it('holds the no-periodicity property across a seed sweep', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const plan = generatePlan(input({ mode: 'PRIVACY_FIRST', seed }))
      const gaps = startIntervals(plan)
      expect(gaps.length).toBeGreaterThan(2)
      for (let i = 1; i < gaps.length; i += 1) {
        const scale = Math.max(gaps[i], gaps[i - 1])
        expect(Math.abs(gaps[i] - gaps[i - 1]) / scale).toBeGreaterThan(0.02)
      }
      const last = plan.intents[plan.intents.length - 1]
      expect(last.recommendedWindowEnd).toBeLessThanOrEqual(NOW + 24 * HOUR)
    }
  })
})

describe('generatePlan — rationales', () => {
  it('writes a specific sentence citing the real numbers behind each action', () => {
    const plan = generatePlan(input())
    for (const intent of plan.intents) {
      expect(intent.rationale.length).toBeGreaterThan(60)
      expect(intent.rationale.endsWith('.')).toBe(true)
      expect(intent.rationale).toMatch(/\d/)
      expect(intent.rationale).toContain(intent.sourceAsset)
      // Not filler: it must say something beyond restating the action type.
      expect(intent.rationale.toLowerCase()).toMatch(/because|since/)
    }
  })

  it('cites the prior colliding amount when this wallet has one', () => {
    const tranche = generatePlan(input()).intents.find((i) => i.type !== 'COMPACT')
    expect(tranche).toBeDefined()
    expect(tranche?.rationale).toMatch(/48h/)
  })
})

describe('generatePlan — determinism', () => {
  it('produces byte-identical plans for identical input', () => {
    for (const mode of ALL_MODES) {
      const a = generatePlan(input({ mode }))
      const b = generatePlan(input({ mode }))
      expect(bigintJson(b)).toBe(bigintJson(a))
    }
  })

  it('produces a different plan for a different seed', () => {
    const a = generatePlan(input({ seed: 1 }))
    const b = generatePlan(input({ seed: 2 }))
    expect(bigintJson(b)).not.toBe(bigintJson(a))
  })

  it('does not consume Math.random', () => {
    const original = Math.random
    let calls = 0
    Math.random = () => {
      calls += 1
      return original()
    }
    try {
      for (const mode of ALL_MODES) generatePlan(input({ mode }))
    } finally {
      Math.random = original
    }
    expect(calls).toBe(0)
  })
})

describe('generatePlan — safety rails', () => {
  it('refuses a cross-asset swap when no reference price is available', () => {
    const plan = generatePlan(input({ prices: { USDC: 1 } }))
    expect(plan.refused.some((r) => /reference price/i.test(r.reason))).toBe(true)
    for (const intent of plan.intents.filter((i) => i.type !== 'COMPACT')) {
      expect(intent.sourceAsset).toBe(intent.targetAsset)
      expect(intent.minOutputAmount > 0n).toBe(true)
    }
  })

  it('never plans to spend more of an asset than the wallet holds', () => {
    const held = NOTES.filter((n) => n.asset === 'USDC').reduce((a, n) => a + n.amount, 0n)
    for (const mode of ALL_MODES) {
      const spent = generatePlan(input({ mode }))
        .intents.filter((i) => i.type !== 'COMPACT' && i.sourceAsset === 'USDC')
        .reduce((a, i) => a + i.inputAmount, 0n)
      expect(spent <= held).toBe(true)
    }
  })

  it('respects the action cap', () => {
    const plan = generatePlan(input({ mode: 'PRIVACY_FIRST', maxActions: 3 }))
    expect(plan.intents.length).toBeLessThanOrEqual(3)
  })

  it('plans nothing for an empty wallet without throwing', () => {
    const plan = generatePlan(input({ notes: [], history: [] }))
    expect(plan.intents).toEqual([])
    expect(plan.campaign).toBeUndefined()
    expect(Number.isFinite(plan.baselineScore)).toBe(true)
  })

  it('sets a real minimum output on every intent', () => {
    for (const intent of generatePlan(input()).intents) {
      expect(intent.minOutputAmount > 0n).toBe(true)
      expect(intent.expectedCostBps).toBeGreaterThan(0)
      expect(Number.isFinite(intent.expectedPrivacyDelta)).toBe(true)
    }
  })
})
