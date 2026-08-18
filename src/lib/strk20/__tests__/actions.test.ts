import { describe, expect, it } from 'vitest'
import {
  SPLIT_MODE,
  assertNeverUnshields,
  buildShield,
  buildSplit,
  openNoteRef,
} from '@/lib/strk20/actions'
import { TOKENS } from '@/lib/strk20/config'

const TOKEN = TOKENS.USDC.address
const TAKER = '0x04d2000000000000000000000000000000000000000000000000000000009c1a'
const SPLITTER = '0x0523456000000000000000000000000000000000000000000000000000000001'

describe('buildSplit', () => {
  it('emits one open note per part, in order, before the invoke', () => {
    const actions = buildSplit({
      token: TOKEN,
      amountIn: 3000n,
      mode: SPLIT_MODE.EXACT,
      parts: [1412n, 987n, 601n],
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    })

    const opens = actions.filter((a) => a.type === 'transfer' && a.amount === 'OPEN')
    expect(opens).toHaveLength(3)

    // The invoke must come last: the placeholders reference notes opened above it.
    expect(actions[actions.length - 1].type).toBe('invoke')
  })

  it('references every open note by its zero-based index', () => {
    const actions = buildSplit({
      token: TOKEN,
      amountIn: 100n,
      mode: SPLIT_MODE.EXACT,
      parts: [40n, 60n],
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    })

    const invoke = actions.at(-1)
    if (invoke?.type !== 'invoke') throw new Error('expected invoke')

    expect(invoke.calldata).toContain(openNoteRef(0))
    expect(invoke.calldata).toContain(openNoteRef(1))
    expect(invoke.calldata).not.toContain(openNoteRef(2))
  })

  it('lays calldata out exactly as privacy_invoke deserializes it', () => {
    const actions = buildSplit({
      token: TOKEN,
      amountIn: 0x64n,
      mode: SPLIT_MODE.BPS,
      parts: [4000n, 6000n],
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    })

    const invoke = actions.at(-1)
    if (invoke?.type !== 'invoke') throw new Error('expected invoke')

    // [mode, token, in_amount, fee, parts_len, ...parts, ids_len, ...ids]
    expect(invoke.calldata.slice(0, 5)).toEqual(['0x1', TOKEN, '0x64', '0x0', '0x2'])
    expect(invoke.calldata.slice(5, 7)).toEqual(['0xfa0', '0x1770'])
    expect(invoke.calldata[7]).toBe('0x2')
  })

  it('refuses an exact split whose parts do not reconcile', () => {
    expect(() =>
      buildSplit({
        token: TOKEN,
        amountIn: 1000n,
        mode: SPLIT_MODE.EXACT,
        parts: [400n, 400n], // 800 ≠ 1000
        takerAddress: TAKER,
        splitterAddress: SPLITTER,
      }),
    ).toThrow(/sum to 800/)
  })

  it('accounts for the fee leg when reconciling an exact split', () => {
    const actions = buildSplit({
      token: TOKEN,
      amountIn: 1000n,
      mode: SPLIT_MODE.EXACT,
      parts: [600n, 390n], // 990 = 1000 − 10 fee
      feeAmount: 10n,
      feeRecipient: SPLITTER,
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    })

    const withdrawals = actions.filter((a) => a.type === 'withdraw')
    expect(withdrawals).toHaveLength(2)
  })

  it('refuses basis points that do not sum to 10000', () => {
    expect(() =>
      buildSplit({
        token: TOKEN,
        amountIn: 100n,
        mode: SPLIT_MODE.BPS,
        parts: [5000n, 4000n],
        takerAddress: TAKER,
        splitterAddress: SPLITTER,
      }),
    ).toThrow(/sum to 10000/)
  })

  it('refuses empty and oversized splits, matching the contract cap', () => {
    const base = {
      token: TOKEN,
      amountIn: 100n,
      mode: SPLIT_MODE.BPS,
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    }
    expect(() => buildSplit({ ...base, parts: [] })).toThrow(/no parts/)
    expect(() => buildSplit({ ...base, parts: Array<bigint>(17).fill(1n) })).toThrow(/MAX_SPLITS/)
  })

  it('withdraws only to the splitter, so the guard accepts it', () => {
    const actions = buildSplit({
      token: TOKEN,
      amountIn: 100n,
      mode: SPLIT_MODE.EXACT,
      parts: [100n],
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    })

    expect(() => assertNeverUnshields(actions, { contracts: [SPLITTER] })).not.toThrow()
  })

  it('is caught by the guard if the splitter is not allowlisted', () => {
    const actions = buildSplit({
      token: TOKEN,
      amountIn: 100n,
      mode: SPLIT_MODE.EXACT,
      parts: [100n],
      takerAddress: TAKER,
      splitterAddress: SPLITTER,
    })

    // An unrecognised withdraw recipient is an unshield, and must throw.
    expect(() => assertNeverUnshields(actions, { contracts: [] })).toThrow(/unshield/i)
  })
})

describe('buildShield', () => {
  it('is a single deposit action with no recipient', () => {
    const actions = buildShield(TOKEN, 4182n)
    expect(actions).toHaveLength(1)
    expect(actions[0]).toEqual({ type: 'deposit', token: TOKEN, amount: '0x1056' })
  })
})
