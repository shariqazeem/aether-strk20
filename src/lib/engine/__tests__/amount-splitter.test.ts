import { describe, expect, it } from 'vitest'

import {
  AMOUNT_REUSE_WINDOW_MS,
  isAmountRecentlyUsed,
  isRoundAmount,
  mixSeed,
  mulberry32,
  splitAmount,
  type RecentAmount,
} from '../amount-splitter'

const HOUR = 3_600_000
const NOW = Date.UTC(2026, 7, 18, 9, 30, 0)

const usdc = (whole: number, micro = 0): bigint => BigInt(whole) * 1_000_000n + BigInt(micro)
const strk = (whole: number): bigint => BigInt(whole) * 10n ** 18n

const sum = (parts: readonly bigint[]): bigint => parts.reduce((a, b) => a + b, 0n)

describe('isRoundAmount', () => {
  it('flags whole multiples of 10^k token units and nothing else', () => {
    expect(isRoundAmount(usdc(10), 6)).toBe(true)
    expect(isRoundAmount(usdc(1000), 6)).toBe(true)
    expect(isRoundAmount(usdc(25_000), 6)).toBe(true)
    expect(isRoundAmount(usdc(1372, 418_003), 6)).toBe(false)
    expect(isRoundAmount(usdc(1001), 6)).toBe(false)
    expect(isRoundAmount(strk(4000), 18)).toBe(true)
    expect(isRoundAmount(strk(4000) + 7n, 18)).toBe(false)
  })
})

describe('isAmountRecentlyUsed', () => {
  const amount = usdc(1000)
  it('blocks an exact match inside the window and releases it outside', () => {
    const inside: RecentAmount[] = [{ amount, timestamp: NOW - 47 * HOUR }]
    const outside: RecentAmount[] = [{ amount, timestamp: NOW - 49 * HOUR }]
    expect(isAmountRecentlyUsed(amount, inside, NOW)).toBe(true)
    expect(isAmountRecentlyUsed(amount, outside, NOW)).toBe(false)
    expect(isAmountRecentlyUsed(amount + 1n, inside, NOW)).toBe(false)
  })

  it('treats a future-dated (pending) entry as live', () => {
    expect(isAmountRecentlyUsed(amount, [{ amount, timestamp: NOW + HOUR }], NOW)).toBe(true)
  })

  it('uses a 48h window by default', () => {
    expect(AMOUNT_REUSE_WINDOW_MS).toBe(48 * HOUR)
  })
})

describe('splitAmount — sum invariant', () => {
  it('sums to exactly the total across many seeds, counts, totals and decimals', () => {
    const totals: ReadonlyArray<readonly [bigint, number]> = [
      [usdc(3000), 6],
      [usdc(10_000), 6],
      [usdc(4100, 137_004), 6],
      [usdc(7), 6],
      [strk(1), 18],
      [strk(123_456), 18],
      [1n, 18],
      [999n, 18],
      [12_345_678_901_234_567_890n, 18],
      [1n * 10n ** 8n, 8],
    ]
    let checked = 0
    for (const [total, decimals] of totals) {
      for (let count = 1; count <= 9; count += 1) {
        for (let seed = 0; seed < 12; seed += 1) {
          const parts = splitAmount(total, { count, seed, decimals, now: NOW })
          expect(sum(parts)).toBe(total)
          for (const part of parts) expect(part > 0n).toBe(true)
          checked += 1
        }
      }
    }
    expect(checked).toBe(totals.length * 9 * 12)
  })

  it('returns an empty array for a non-positive total', () => {
    expect(splitAmount(0n, { count: 4, seed: 1, decimals: 6, now: NOW })).toEqual([])
    expect(splitAmount(-5n, { count: 4, seed: 1, decimals: 6, now: NOW })).toEqual([])
  })

  it('returns the total untouched when a single split is requested', () => {
    expect(splitAmount(usdc(1000), { count: 1, seed: 3, decimals: 6, now: NOW })).toEqual([
      usdc(1000),
    ])
  })

  it('reduces the count rather than emitting zero-value parts', () => {
    const parts = splitAmount(3n, { count: 8, seed: 5, decimals: 18, now: NOW })
    expect(sum(parts)).toBe(3n)
    expect(parts.every((p) => p > 0n)).toBe(true)
  })
})

describe('splitAmount — round-number avoidance', () => {
  it('never emits a round amount even when the naive equal split is round', () => {
    // 3,000 USDC over 3 and 10,000 USDC over 10 both divide into flat 1,000s.
    for (const [total, count, decimals] of [
      [usdc(3000), 3, 6],
      [usdc(10_000), 10, 6],
      [usdc(50_000), 5, 6],
      [strk(9000), 3, 18],
    ] as const) {
      for (let seed = 0; seed < 20; seed += 1) {
        const parts = splitAmount(total, { count, seed, decimals, now: NOW })
        expect(sum(parts)).toBe(total)
        for (const part of parts) {
          expect(isRoundAmount(part, decimals)).toBe(false)
        }
      }
    }
  })

  it('never repeats the same amount twice inside one split set', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const parts = splitAmount(usdc(24_000), { count: 8, seed, decimals: 6, now: NOW })
      expect(new Set(parts.map(String)).size).toBe(parts.length)
    }
  })
})

describe('splitAmount — 48h reuse rule', () => {
  const total = usdc(18_400, 331_007)
  const options = { count: 5, seed: 8, decimals: 6, now: NOW }

  it('avoids an amount used inside the window, and still sums exactly', () => {
    const baseline = splitAmount(total, options)
    const target = baseline[2]

    const blocked = splitAmount(total, {
      ...options,
      recentAmounts: [{ amount: target, timestamp: NOW - 6 * HOUR }],
    })
    expect(sum(blocked)).toBe(total)
    expect(blocked).not.toContain(target)
    expect(blocked.some((p) => p === target)).toBe(false)
  })

  it('leaves the split untouched when the same amount is older than 48h', () => {
    const baseline = splitAmount(total, options)
    const stale = splitAmount(total, {
      ...options,
      recentAmounts: [{ amount: baseline[2], timestamp: NOW - 49 * HOUR }],
    })
    expect(stale).toEqual(baseline)
  })

  it('avoids every blocked amount at once', () => {
    const baseline = splitAmount(total, options)
    const recentAmounts: RecentAmount[] = baseline.map((amount) => ({
      amount,
      timestamp: NOW - HOUR,
    }))
    const rebuilt = splitAmount(total, { ...options, recentAmounts })
    expect(sum(rebuilt)).toBe(total)
    for (const part of rebuilt) {
      expect(isAmountRecentlyUsed(part, recentAmounts, NOW)).toBe(false)
      expect(isRoundAmount(part, 6)).toBe(false)
    }
  })
})

describe('splitAmount — determinism', () => {
  it('produces identical output for identical input, call after call', () => {
    const options = { count: 6, seed: 4242, decimals: 6, now: NOW }
    const first = splitAmount(usdc(41_000), options)
    const second = splitAmount(usdc(41_000), options)
    const third = splitAmount(usdc(41_000), { ...options })
    expect(second.map(String)).toEqual(first.map(String))
    expect(third.map(String)).toEqual(first.map(String))
  })

  it('produces different output for a different seed', () => {
    const a = splitAmount(usdc(41_000), { count: 6, seed: 1, decimals: 6, now: NOW })
    const b = splitAmount(usdc(41_000), { count: 6, seed: 2, decimals: 6, now: NOW })
    expect(b.map(String)).not.toEqual(a.map(String))
  })

  it('is stable across a fresh PRNG instance for the same seed', () => {
    const a = mulberry32(99)
    const b = mulberry32(99)
    const drawsA = [a(), a(), a(), a()]
    const drawsB = [b(), b(), b(), b()]
    expect(drawsB).toEqual(drawsA)
    expect(new Set(drawsA).size).toBe(4)
    for (const draw of drawsA) {
      expect(draw).toBeGreaterThanOrEqual(0)
      expect(draw).toBeLessThan(1)
    }
  })

  it('derives stable, distinct sub-seeds', () => {
    expect(mixSeed(7, 1)).toBe(mixSeed(7, 1))
    expect(mixSeed(7, 1)).not.toBe(mixSeed(7, 2))
    expect(mixSeed(7, 1)).not.toBe(mixSeed(8, 1))
    expect(Number.isInteger(mixSeed(7, 1))).toBe(true)
  })
})

describe('splitAmount — no ambient randomness', () => {
  it('does not consume Math.random', () => {
    const original = Math.random
    let calls = 0
    Math.random = () => {
      calls += 1
      return original()
    }
    try {
      splitAmount(usdc(31_337), { count: 7, seed: 11, decimals: 6, now: NOW })
    } finally {
      Math.random = original
    }
    expect(calls).toBe(0)
  })
})
