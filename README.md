# Aether

**Shield once. Stay private for the whole lifecycle.**

Aether is a continuous private portfolio and strategy engine that runs entirely
inside the [STRK20](https://strk20-by-example.org) privacy pool on Starknet
mainnet. You shield once; from then on every action — swaps, lending,
rebalancing, DCA — happens *inside* the shielded environment, and each one is
chosen to maximise your **effective anonymity under repeated use**.

Built for the STRK20 Private Sprint.

---

## The problem Aether exists to solve

Most privacy tooling treats the shielded pool as a stop on the way somewhere
else. Value goes in, waits, and comes out — and the moment it comes out and
touches a public protocol, the link is re-formed.

```
Traditional flow (high leakage)
  [Wallet A] ──▶ [Shield] ──▶ [Unshield] ──▶ [Ekubo / Vesu] ──▶ identity relinked ✗
```

The subtler failure is that privacy is not a property of a single transaction.
It is a property of a *sequence*. A user who shields 1,000 USDC every Monday at
09:00 has perfect per-transaction privacy and no privacy at all, because the
pattern itself is the fingerprint.

Aether closes the loop and then optimises the sequence:

```
Aether execution engine
                ┌───────────────────────────────────────────────┐
                │          STRK20 shielded environment          │
  [Wallet A] ─▶ │  [note] ─▶ privacy_invoke ─▶ [AVNU / Vesu]     │
                │      ▲                            │           │
                │      └────────── [new note] ◀─────┘           │
                └───────────────────────────────────────────────┘
                         capital never exits
```

---

## What it does

- **Multi-asset private portfolio** — shielded balances across the pool's
  supported assets, never a public balance.
- **Five strategy modes** — privacy-first, stealth DCA, whale distribution,
  yield-max, balanced. Modes change only the weighting between expected return
  and privacy delta; they never relax the hard constraints.
- **A privacy-aware execution planner** that decides *what* to do, *how much* to
  split it into, and *when* — optimising return, cost and anonymity together.
- **A live Effective Privacy Score** with a full six-dimension breakdown,
  computed from real pool data rather than asserted.
- **Attacker view** — the same account rendered as a public observer sees it,
  so the claim is inspectable rather than promised.
- **Selective disclosure** — prove a statement (`private balance ≥ X`,
  `this strategy returned Y%`) without surrendering a viewing key.
- **Never unshields by default.** Capital stays in private notes for its entire
  lifecycle. Unshielding requires an explicit, separate user request.

---

## The Effective Privacy Score

The score is a deterministic, client-side function of observable state. The
formula is public because a privacy score you cannot audit is marketing:

```
S_eff = 0.30·A_set + 0.25·H_amount + 0.20·H_time
      + 0.15·(100 − U_behaviour) + 0.10·(100 − R_exit)
```

| Term | Meaning | Source |
|---|---|---|
| `A_set` | anonymity set size, log-scaled over the denomination tier | live pool activity |
| `H_amount` | entropy of amount splits, penalising round human numbers | your action history |
| `H_time` | inter-arrival timing entropy vs. background pool traffic | your action history |
| `U_behaviour` | behavioural uniqueness — repeated asset/route/size triples, fixed hour-of-day | your action history |
| `R_exit` | exit correlation — amounts out that match amounts in | your action history |

The last two are *inverted* in the formula: they are stored as raw risk, where
higher is worse.

### Hard constraints

These are enforced in code, not by convention, and no strategy mode can
override them:

1. **Never unshield unless explicitly requested.** The planner has no path that
   produces a withdrawal to a user-controlled public address.
2. **Never reuse an exact previous amount within 48 hours.**
3. **Refuse any action** that would drop `S_eff` below the user's floor. Refused
   actions are surfaced with their reason, not silently dropped.
4. **Compact notes** before fragmentation degrades the anonymity set.

> On withdrawals: private DeFi legitimately emits `withdraw` actions that move
> value to a helper contract, which returns it to the pool inside the *same
> atomic transaction*. That is not an unshield. `assertNeverUnshields()` runs
> immediately before signing and permits a withdrawal only to a helper
> participating in that transaction — anything else throws.

---

## Architecture

Aether integrates through the **Starknet Wallet API**. The dapp never holds
viewing keys, never generates proofs, and never sees private state; the wallet
owns all of it.

```
User wallet (Ready / Xverse)
        │  WalletAccountV6
        ▼
┌──────────────────────────────────────────────┐
│  Aether frontend — Next.js 15, TS, Tailwind  │
├──────────────────────────────────────────────┤
│  Privacy policy + strategy engine            │
│  pure, deterministic, seeded, unit-tested    │
├──────────────────────────────────────────────┤
│  Execution layer — STRK20_ACTION[] builders  │
└──────────────────────────────────────────────┘
        │  strk20InvokeTransaction
        ▼
  Live STRK20 pool · AVNU private swaps · Vesu / Ekubo anonymizers
```

The engine is pure TypeScript with no `Math.random()` and no ambient clock —
every function takes its seed and `now` as parameters, so a plan is
reproducible and testable.

### Live mainnet addresses

| | |
|---|---|
| STRK20 pool | [`0x040337b1…ffe812a`](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a) |
| Ekubo anonymizer (class hash) | `0x2a4ac595283d4d64b9952f5ef5c0da1775bfdb7c9d92237524a21dd8d19ebd7` |
| Vesu anonymizer (class hash) | `0x3751128dc3ebd36215f982766f14aaca8f78793e4b0f42a73e49372a8e24aae` |

The pool address is independently corroborated: it is the value shipped as
`PRIVACY_POOL_ADDRESS` in `@avnu/avnu-sdk@4.2.0`.

### Pinned stack

STRK20 support landed in `starknet@10.4.0`. A bare `npm install starknet`
resolves to the `latest` line, which lacks `WalletAccountV6`,
`strk20InvokeTransaction` and `STRK20_ACTION` entirely. These versions are
pinned exactly and deliberately:

```
starknet                                    10.4.0
@starknet-io/get-starknet-discovery          6.0.3
@starknet-io/get-starknet-wallet-standard    6.0.3
@starknet-io/types-js                       0.10.3
@avnu/avnu-sdk                               4.2.0
```

---

## Running it

```bash
npm install
cp .env.example .env.local   # then paste your own Alchemy key
npm run dev
```

You need a privacy-enabled Starknet wallet (Ready; Xverse in progress) that
advertises Wallet API `>= 0.10.3`.

```bash
npm test        # engine unit tests
npm run typecheck
npm run build
```

**The RPC key is read from `NEXT_PUBLIC_STARKNET_RPC_URL` and is never
committed.** `.env.local` is gitignored.

---

## Reproducing the three mainnet transactions

Recorded in [`strk20.json`](./strk20.json) as they land.

1. **Shield** — deposit into the live pool, creating private notes.
2. **Private swap** — an AVNU private-mode swap; the output returns as a
   private note. On Voyager the caller is the executor contract, not the user.
3. **Private DeFi** — a Vesu anonymizer lend or a note-to-note rebalance.

Each is a separate transaction by design. Bundling the shield with the action it
funds would re-create the public link the whole product exists to break.

---

## Status

Under active development for the STRK20 Private Sprint (18–31 Aug 2026).
Transaction hashes, contracts and the demo link populate `strk20.json` as they
come to exist.

## Licence

MIT — see [LICENSE](./LICENSE).
