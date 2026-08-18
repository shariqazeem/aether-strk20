import { describe, expect, it } from 'vitest'

import {
  amountEntropyScore,
  anonymitySetScore,
  behavioralUniquenessScore,
  computeEffectivePrivacy,
  denominationTier,
  exitCorrelationScore,
  gapsFrom,
  PRIVACY_WEIGHTS,
  scoreFromState,
  timingEntropyScore,
  toTokenUnits,
} from '../privacy-score'
import type { ActionRecord, PoolActivity, PrivateNote, ScoreBreakdown } from '../types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const NOW = Date.UTC(2026, 7, 18, 9, 30, 0)

/** USDC has 6 decimals; build exact amounts without touching floats. */
const usdc = (whole: number, micro = 0): bigint => BigInt(whole) * 1_000_000n + BigInt(micro)

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

function record(overrides: Partial<ActionRecord> = {}): ActionRecord {
  return {
    timestamp: NOW - DAY,
    asset: 'USDC',
    amount: usdc(1000),
    type: 'SWAP',
    route: 'AVNU',
    ...overrides,
  }
}

function note(index: number, amount: bigint): PrivateNote {
  return {
    commitment: `0xc${index}`,
    asset: 'USDC',
    amount,
    leafIndex: index,
    nullifier: `0xn${index}`,
    timestamp: NOW - 5 * DAY,
  }
}

describe('computeEffectivePrivacy', () => {
  it('applies the published weights with the two inverted terms', () => {
    const breakdown: ScoreBreakdown = {
      anonymitySet: 80,
      amountEntropy: 60,
      timingEntropy: 40,
      behavioralUniqueness: 20,
      exitCorrelationRisk: 10,
    }
    // 0.30*80 + 0.25*60 + 0.20*40 + 0.15*(100-20) + 0.10*(100-10)
    // =  24    +   15    +    8    +      12       +      9        = 68
    expect(computeEffectivePrivacy(breakdown)).toBe(68)
  })

  it('exposes each weight as an exact marginal, including the inversions', () => {
    const base: ScoreBreakdown = {
      anonymitySet: 50,
      amountEntropy: 50,
      timingEntropy: 50,
      behavioralUniqueness: 50,
      exitCorrelationRisk: 50,
    }
    expect(computeEffectivePrivacy(base)).toBe(50)

    // +10 on a positive dimension moves the score by +10 * its weight.
    expect(computeEffectivePrivacy({ ...base, anonymitySet: 60 })).toBe(53)
    expect(computeEffectivePrivacy({ ...base, amountEntropy: 60 })).toBe(52.5)
    expect(computeEffectivePrivacy({ ...base, timingEntropy: 60 })).toBe(52)
    // -10 on a RAW (higher-is-worse) dimension moves the score UP by the weight.
    expect(computeEffectivePrivacy({ ...base, behavioralUniqueness: 40 })).toBe(51.5)
    expect(computeEffectivePrivacy({ ...base, exitCorrelationRisk: 40 })).toBe(51)
    // ...and raising a RAW dimension moves it DOWN. Guards against a sign flip.
    expect(computeEffectivePrivacy({ ...base, behavioralUniqueness: 60 })).toBe(48.5)
    expect(computeEffectivePrivacy({ ...base, exitCorrelationRisk: 60 })).toBe(49)
  })

  it('reaches both extremes and never leaves [0,100]', () => {
    expect(
      computeEffectivePrivacy({
        anonymitySet: 100,
        amountEntropy: 100,
        timingEntropy: 100,
        behavioralUniqueness: 0,
        exitCorrelationRisk: 0,
      }),
    ).toBe(100)
    expect(
      computeEffectivePrivacy({
        anonymitySet: 0,
        amountEntropy: 0,
        timingEntropy: 0,
        behavioralUniqueness: 100,
        exitCorrelationRisk: 100,
      }),
    ).toBe(0)
    // Out-of-range and non-finite inputs are clamped, never propagated.
    const wild = computeEffectivePrivacy({
      anonymitySet: 5000,
      amountEntropy: -900,
      timingEntropy: Number.NaN,
      behavioralUniqueness: -50,
      exitCorrelationRisk: Number.POSITIVE_INFINITY,
    })
    expect(wild).toBeGreaterThanOrEqual(0)
    expect(wild).toBeLessThanOrEqual(100)
    expect(Number.isFinite(wild)).toBe(true)
  })

  it('rounds to one decimal place', () => {
    // Raw total is 15.3 + 8.25 + 15.4 + 5.7 + 5.9 = 50.55, which must surface
    // as a single-decimal 50.6 rather than a float tail.
    const value = computeEffectivePrivacy({
      anonymitySet: 51,
      amountEntropy: 33,
      timingEntropy: 77,
      behavioralUniqueness: 62,
      exitCorrelationRisk: 41,
    })
    expect(value).toBe(50.6)
    expect(value).toBe(Number(value.toFixed(1)))
  })

  it('publishes weights that sum to 1', () => {
    const sum = Object.values(PRIVACY_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 12)
  })
})

describe('anonymitySetScore', () => {
  it('is logarithmic in the tier depth', () => {
    expect(anonymitySetScore(10, 100)).toBeCloseTo(50, 9)
    expect(anonymitySetScore(100, 100)).toBe(100)
  })

  it('returns 0 for a degenerate set instead of NaN or Infinity', () => {
    for (const [nTier, nMax] of [
      [1, 100],
      [0, 100],
      [-5, 100],
      [50, 1],
      [50, 0],
      [Number.NaN, 100],
      [50, Number.POSITIVE_INFINITY],
    ] as const) {
      const value = anonymitySetScore(nTier, nMax)
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBe(0)
    }
  })

  it('clamps above 100 when a tier is deeper than the reference', () => {
    expect(anonymitySetScore(5000, 100)).toBe(100)
  })
})

describe('amountEntropyScore', () => {
  it('scores empty, single and identical split sets at 0', () => {
    expect(amountEntropyScore([], 6)).toBe(0)
    expect(amountEntropyScore([usdc(1234)], 6)).toBe(0)
    expect(amountEntropyScore([usdc(1000), usdc(1000), usdc(1000)], 6)).toBe(0)
  })

  it('returns 0 when the mean is zero', () => {
    expect(amountEntropyScore([0n, 0n, 0n], 6)).toBe(0)
  })

  it('rewards spread', () => {
    const tight = amountEntropyScore([usdc(1000, 1), usdc(1000, 3), usdc(1000, 7)], 6)
    const wide = amountEntropyScore([usdc(137, 412_003), usdc(2418, 771_119), usdc(6644, 108_337)], 6)
    expect(wide).toBeGreaterThan(tight)
  })

  it('penalises human-round splits against an equally spread non-round set', () => {
    const round = amountEntropyScore([usdc(1000), usdc(2000), usdc(3000)], 6)
    const jagged = amountEntropyScore(
      [usdc(1037, 411_902), usdc(1994, 220_733), usdc(2968, 617_441)],
      6,
    )
    expect(round).toBeGreaterThan(0)
    expect(jagged).toBeGreaterThan(round * 1.5)
  })

  it('reads amounts in token units, not wei', () => {
    // The same nominal splits in a 6-decimal and an 18-decimal asset must score
    // the same; a wei-based round detector would disagree.
    const sixDecimals = amountEntropyScore([usdc(1000), usdc(2000), usdc(3000)], 6)
    const eighteen = amountEntropyScore(
      [1000n * 10n ** 18n, 2000n * 10n ** 18n, 3000n * 10n ** 18n],
      18,
    )
    expect(eighteen).toBeCloseTo(sixDecimals, 6)
  })
})

describe('timingEntropyScore', () => {
  const regular = [6 * HOUR, 6 * HOUR, 6 * HOUR, 6 * HOUR, 6 * HOUR, 6 * HOUR]
  const irregular = [11 * MINUTE, 3 * HOUR, 47 * MINUTE, 26 * HOUR, 133 * MINUTE, 5 * HOUR]

  it('returns a neutral 50 without enough evidence', () => {
    expect(timingEntropyScore([], POOL.interArrivalsMs)).toBe(50)
    expect(timingEntropyScore([4 * HOUR], POOL.interArrivalsMs)).toBe(50)
  })

  it('scores a periodic schedule far below an irregular one', () => {
    const periodic = timingEntropyScore(regular, POOL.interArrivalsMs)
    const chaotic = timingEntropyScore(irregular, POOL.interArrivalsMs)
    expect(periodic).toBeLessThan(chaotic)
    expect(periodic).toBeLessThan(35)
    expect(chaotic).toBeGreaterThan(55)
  })

  it('works without a pool background and still separates the two', () => {
    expect(timingEntropyScore(regular, [])).toBeLessThan(timingEntropyScore(irregular, []))
    expect(timingEntropyScore(regular, [])).toBe(0)
  })

  it('ignores non-positive and non-finite gaps', () => {
    const clean = timingEntropyScore(irregular, POOL.interArrivalsMs)
    const dirty = timingEntropyScore(
      [...irregular, 0, -5, Number.NaN, Number.POSITIVE_INFINITY],
      POOL.interArrivalsMs,
    )
    expect(dirty).toBe(clean)
  })
})

describe('behavioralUniquenessScore', () => {
  it('scores an empty history at 0', () => {
    expect(behavioralUniquenessScore([], POOL)).toBe(0)
  })

  it('rises when the same (asset, route, tier) triple repeats at the same hour', () => {
    const repeated = [0, 1, 2, 3, 4].map((i) =>
      record({ timestamp: NOW - i * DAY, amount: usdc(1000 + i), asset: 'USDC', route: 'AVNU' }),
    )
    const varied: ActionRecord[] = [
      record({ timestamp: NOW - 4 * DAY - 2 * HOUR, asset: 'USDC', route: 'AVNU', amount: usdc(1421, 7) }),
      record({ timestamp: NOW - 3 * DAY - 9 * HOUR, asset: 'STRK', route: 'EKUBO', amount: 771n * 10n ** 18n }),
      record({ timestamp: NOW - 2 * DAY - 16 * HOUR, asset: 'USDC', route: 'VESU', amount: usdc(93, 441_002) }),
      record({ timestamp: NOW - DAY - 21 * HOUR, asset: 'ETH', route: 'AVNU', amount: 3n * 10n ** 17n }),
      record({ timestamp: NOW - 5 * HOUR, asset: 'STRK', route: 'AVNU', amount: 12_403n * 10n ** 18n }),
    ]
    const repeatedScore = behavioralUniquenessScore(repeated, POOL)
    const variedScore = behavioralUniquenessScore(varied, POOL)
    expect(repeatedScore).toBeGreaterThan(variedScore)
    expect(repeatedScore).toBeGreaterThan(70)
  })

  it('rises on a same-hour-of-day habit even when amounts differ', () => {
    const sameHour = [0, 1, 2, 3].map((i) =>
      record({
        timestamp: NOW - i * DAY,
        route: i % 2 === 0 ? 'AVNU' : 'EKUBO',
        amount: usdc(1000 * (i + 1) + i, 137 * (i + 1)),
      }),
    )
    const spreadHours = [0, 1, 2, 3].map((i) =>
      record({
        timestamp: NOW - i * DAY - i * 6 * HOUR,
        route: i % 2 === 0 ? 'AVNU' : 'EKUBO',
        amount: usdc(1000 * (i + 1) + i, 137 * (i + 1)),
      }),
    )
    expect(behavioralUniquenessScore(sameHour, POOL)).toBeGreaterThan(
      behavioralUniquenessScore(spreadHours, POOL),
    )
  })

  it('stays inside [0,100]', () => {
    const many = Array.from({ length: 40 }, (_, i) => record({ timestamp: NOW - i * HOUR }))
    const value = behavioralUniquenessScore(many, POOL)
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(100)
  })
})

describe('exitCorrelationScore', () => {
  it('scores an empty history at 0', () => {
    expect(exitCorrelationScore([])).toBe(0)
  })

  it('rises when an amount out matches an amount in within a few percent', () => {
    const matched = [
      record({ timestamp: NOW - 6 * HOUR, amount: usdc(4100, 137_004) }),
      record({ timestamp: NOW - 5 * HOUR, amount: usdc(4101, 902_311) }),
    ]
    const unmatched = [
      record({ timestamp: NOW - 6 * HOUR, amount: usdc(4100, 137_004) }),
      record({ timestamp: NOW - 5 * HOUR, amount: usdc(911, 400_223) }),
    ]
    expect(exitCorrelationScore(matched)).toBeGreaterThan(exitCorrelationScore(unmatched))
    expect(exitCorrelationScore(unmatched)).toBe(0)
  })

  it('rises when actions chain inside a few minutes', () => {
    const chained = [
      record({ timestamp: NOW - 3 * HOUR, amount: usdc(4100, 137_004) }),
      record({ timestamp: NOW - 3 * HOUR + MINUTE, amount: usdc(772, 400_101) }),
      record({ timestamp: NOW - 3 * HOUR + 2 * MINUTE, amount: usdc(2311, 90_733) }),
    ]
    const spaced = [
      record({ timestamp: NOW - 3 * DAY, amount: usdc(4100, 137_004) }),
      record({ timestamp: NOW - 2 * DAY, amount: usdc(772, 400_101) }),
      record({ timestamp: NOW - DAY, amount: usdc(2311, 90_733) }),
    ]
    expect(exitCorrelationScore(chained)).toBeGreaterThan(exitCorrelationScore(spaced))
    expect(exitCorrelationScore(spaced)).toBe(0)
  })

  it('ignores a match older than the 48h window', () => {
    const stale = [
      record({ timestamp: NOW - 10 * DAY, amount: usdc(4100, 137_004) }),
      record({ timestamp: NOW - 5 * HOUR, amount: usdc(4100, 137_004) }),
    ]
    expect(exitCorrelationScore(stale)).toBe(0)
  })
})

describe('helpers', () => {
  it('converts bigint wei to token units without losing the low digits', () => {
    expect(toTokenUnits(usdc(4100, 137_004), 6)).toBeCloseTo(4100.137004, 6)
    expect(toTokenUnits(1n * 10n ** 18n, 18)).toBe(1)
  })

  it('buckets amounts into decade tiers', () => {
    expect(denominationTier(usdc(4100), 6)).toBe('1e3')
    expect(denominationTier(usdc(12_400), 6)).toBe('1e4')
    expect(denominationTier(usdc(0, 100_000), 6)).toBe('1e-1')
    expect(denominationTier(0n, 6)).toBe('dust')
  })

  it('derives sorted inter-arrival gaps', () => {
    expect(gapsFrom([300, 100, 250])).toEqual([150, 50])
    expect(gapsFrom([42])).toEqual([])
  })
})

describe('scoreFromState', () => {
  it('produces every dimension inside [0,100] from real state', () => {
    const notes = [
      note(1, usdc(1200, 431_207)),
      note(2, usdc(2380, 118_903)),
      note(3, usdc(4104, 990_117)),
    ]
    const history = [
      record({ timestamp: NOW - 3 * DAY - 2 * HOUR, amount: usdc(1421, 7) }),
      record({ timestamp: NOW - 2 * DAY - 11 * HOUR, amount: usdc(931, 441_002), route: 'EKUBO' }),
      record({ timestamp: NOW - 19 * HOUR, amount: usdc(2204, 71_339), type: 'LEND', route: 'VESU' }),
    ]
    const breakdown = scoreFromState(history, notes, POOL)
    for (const value of Object.values(breakdown)) {
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
    const score = computeEffectivePrivacy(breakdown)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('scores an empty wallet without throwing', () => {
    const breakdown = scoreFromState([], [], { tierCounts: {}, interArrivalsMs: [], totalNotes: 0 })
    expect(breakdown.anonymitySet).toBe(0)
    expect(breakdown.amountEntropy).toBe(0)
    expect(breakdown.behavioralUniqueness).toBe(0)
    expect(breakdown.exitCorrelationRisk).toBe(0)
    expect(Number.isFinite(computeEffectivePrivacy(breakdown))).toBe(true)
  })
})
