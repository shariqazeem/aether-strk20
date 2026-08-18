/**
 * Execution timing — the part of the engine that decides when.
 *
 * A wallet that acts every six hours has published a schedule. The job here is
 * to produce windows that are irregular by construction: inter-arrival gaps are
 * drawn from an exponential distribution (the maximum-entropy choice for a
 * fixed mean rate, i.e. a Poisson arrival process — which is exactly what
 * unlinkable background traffic looks like), then explicitly de-periodised so
 * no two consecutive gaps land within 5% of each other.
 *
 * Several seeded candidate schedules are generated and the one that maximises
 * `timingEntropyScore` against the wallet's existing rhythm and the pool's
 * background rhythm wins. Same seed, same schedule, always.
 */

import { mixSeed, mulberry32 } from './amount-splitter'
import { timingEntropyScore } from './privacy-score'

/** A recommended execution window, both bounds in ms epoch. */
export interface TimeWindow {
  start: number
  end: number
}

export interface WindowOptions {
  /** ms epoch the schedule is anchored to. Never read from a clock in here. */
  now: number
  /** Nothing may be scheduled beyond `now + maxDelayMs`. */
  maxDelayMs: number
  /** Seed for the deterministic PRNG. */
  seed: number
  /** The wallet's existing inter-arrival gaps, so new windows do not echo them. */
  userGaps?: readonly number[]
  /** The pool's background inter-arrival gaps, the distribution to blend into. */
  poolGaps?: readonly number[]
  /** Floor on the gap between windows. Reduced when the horizon is tight. */
  minGapMs?: number
  /** Base window width. Defaults to a fraction of the horizon. */
  windowLengthMs?: number
  /** How many seeded schedules to evaluate before picking the best. */
  candidates?: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE

const MIN_HORIZON_MS = MINUTE
const MIN_WINDOW_MS = MINUTE
const DEFAULT_MIN_GAP_MS = 90_000
const DEFAULT_CANDIDATES = 8
/** Windows may occupy at most this share of the horizon, leaving room for gaps. */
const LENGTH_BUDGET_SHARE = 0.55
/** Consecutive gaps closer than this read as periodic and get de-periodised. */
const PERIODICITY_TOLERANCE = 0.05
const MAX_DEPERIODISE_PASSES = 24

function clampNumber(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

/**
 * Gaps between the *starts* of consecutive windows, with `now` as the origin.
 * Exposed because "are these windows evenly spaced?" is a property callers and
 * tests need to check directly.
 */
export function windowStartGaps(windows: readonly TimeWindow[], now: number): number[] {
  const gaps: number[] = []
  let cursor = now
  for (const w of windows) {
    gaps.push(w.start - cursor)
    cursor = w.start
  }
  return gaps
}

function buildSchedule(count: number, horizon: number, opts: WindowOptions, seed: number): TimeWindow[] {
  const rng = mulberry32(seed)

  const baseLength =
    opts.windowLengthMs ?? clampNumber(Math.floor(horizon / (count * 4)), 5 * MINUTE, 4 * HOUR)
  const lengths: number[] = []
  for (let i = 0; i < count; i += 1) {
    lengths.push(Math.max(MIN_WINDOW_MS, Math.round(baseLength * (0.6 + 0.8 * rng()))))
  }
  let lengthSum = lengths.reduce((a, b) => a + b, 0)
  const lengthBudget = Math.floor(horizon * LENGTH_BUDGET_SHARE)
  if (lengthSum > lengthBudget) {
    const shrink = lengthBudget / lengthSum
    for (let i = 0; i < count; i += 1) {
      lengths[i] = Math.max(1, Math.round(lengths[i] * shrink))
    }
    lengthSum = lengths.reduce((a, b) => a + b, 0)
  }
  if (lengthSum >= horizon) {
    const flat = Math.max(1, Math.floor(horizon / (2 * count)))
    for (let i = 0; i < count; i += 1) lengths[i] = flat
    lengthSum = flat * count
  }

  // Exponential inter-arrivals: the maximum-entropy gap distribution.
  const weights: number[] = []
  for (let i = 0; i < count; i += 1) {
    const u = clampNumber(rng(), 1e-6, 0.999999)
    weights.push(-Math.log(1 - u))
  }

  const gapBudget = Math.max(count, Math.floor((horizon - lengthSum) * 0.96))
  const minGap = Math.max(
    1,
    Math.min(opts.minGapMs ?? DEFAULT_MIN_GAP_MS, Math.floor(gapBudget / (count * 4))),
  )

  // Affine remap: whatever the weights become, the gaps still sum to the
  // budget, so a schedule can never be de-periodised out past the horizon.
  const materialise = (w: readonly number[]): TimeWindow[] => {
    const total = w.reduce((a, b) => a + b, 0)
    const spread = gapBudget - minGap * count
    const gaps =
      !(total > 0) || spread <= 0
        ? w.map(() => Math.floor(gapBudget / count))
        : w.map((x) => Math.round(minGap + spread * (x / total)))

    const windows: TimeWindow[] = []
    let cursor = opts.now
    for (let i = 0; i < count; i += 1) {
      const start = cursor + Math.max(1, gaps[i])
      const end = start + Math.max(1, lengths[i])
      windows.push({ start, end })
      cursor = end
    }
    return windows
  }

  // De-periodise the START-to-START intervals, because those are what an
  // observer actually times — not the dead space between windows.
  let windows = materialise(weights)
  for (let pass = 0; pass < MAX_DEPERIODISE_PASSES; pass += 1) {
    const intervals = windowStartGaps(windows, opts.now)
    let periodic = false
    for (let i = 1; i < intervals.length; i += 1) {
      const scale = Math.max(intervals[i - 1], intervals[i])
      if (scale > 0 && Math.abs(intervals[i] - intervals[i - 1]) / scale < PERIODICITY_TOLERANCE) {
        weights[i] = weights[i] * (1.35 + 0.75 * rng()) + 0.08
        periodic = true
      }
    }
    if (!periodic) break
    windows = materialise(weights)
  }
  return windows
}

/**
 * Produce `count` irregular, non-overlapping execution windows inside
 * `[now, now + maxDelayMs]`.
 *
 * Contract: windows are returned in chronological order, never overlap, the
 * final `end` never exceeds `now + maxDelayMs`, every `start` is strictly after
 * `now`, and no two consecutive gaps are evenly spaced. Identical options always
 * produce an identical schedule. A `count` of 0 or less returns `[]`.
 */
export function recommendWindows(count: number, opts: WindowOptions): TimeWindow[] {
  const n = Math.max(0, Math.floor(count))
  if (n === 0) return []

  const horizon = Math.max(MIN_HORIZON_MS, Math.floor(opts.maxDelayMs))
  const candidates = Math.max(1, Math.floor(opts.candidates ?? DEFAULT_CANDIDATES))
  const userGaps = opts.userGaps ?? []
  const poolGaps = opts.poolGaps ?? []

  let best: TimeWindow[] = []
  let bestScore = Number.NEGATIVE_INFINITY
  for (let c = 0; c < candidates; c += 1) {
    const schedule = buildSchedule(n, horizon, opts, mixSeed(opts.seed, c + 1))
    const score = timingEntropyScore(
      [...userGaps, ...windowStartGaps(schedule, opts.now)],
      poolGaps,
    )
    // Strict `>` keeps the lowest-index candidate on ties, so the choice is
    // stable rather than dependent on iteration order.
    if (score > bestScore) {
      bestScore = score
      best = schedule
    }
  }
  return best
}
