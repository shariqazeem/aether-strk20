Aether — Full Privacy-Aware Autonomous Private Portfolio on STRK201. Exact Product Definition (what you ship)Name: Aether
One-liner: Shield once. Aether runs continuous private strategies (DCA, yield, staking, rebalancing) entirely inside the STRK20 pool, optimizing every action for effective anonymity under repeated use so your financial behavior never becomes a fingerprint.Full scope (everything from the original proposal, real mainnet only):Multi-asset private portfolio (USDC, STRK, strkBTC, and any other supported ERC-20 that can be shielded).
Strategy modes:Privacy-first
Stealth DCA (any target asset)
Whale distribution
Efficiency / max-yield
Balanced

Continuous privacy-aware execution planner that optimizes return + cost + effective anonymity.
Private actions supported:Shield / unshield (unshield only on explicit user request)
Private swaps (AVNU)
Private lending / borrowing (Vesu anonymizer path)
Private staking (available helpers)
Private rebalancing between notes
Private transfers between notes

Live Effective Privacy Score with full breakdown (anonymity set, amount entropy, timing entropy, behavioral uniqueness, route uniqueness, exit correlation).
Never unshield by default — capital stays in private notes for the entire lifecycle.
Selective disclosure studio: generate exact ZK-style statements (“private balance of asset X ≥ Y”, “this strategy returned Z%”, “no interaction with address set S”) without revealing the full viewing key or history.
Attacker-view panel that shows what a public observer can actually see (almost nothing).
Optional simple authorized keeper for scheduled next actions (user still signs or pre-approves).

Everything runs against the live mainnet STRK20 pool and live anonymizers. Zero mocks, zero simulated balances, zero fake proofs.2. Exact Architecture (production-ready, Claude-ready)Pinned stack (only what exists today):Frontend: Next.js 15 + TypeScript + Tailwind CSS + Zustand
Wallet layer: starknet.js ≥ 10 + get-starknet + WalletAccountV6 (Ready + Xverse)
Primary privacy route: Starknet Wallet API (dapp never holds viewing keys or generates proofs)
Fallback / advanced note control: @starkware-libs/starknet-privacy-sdk (matching current PRIVACY-0.14.3-RC.x tag)
Private DeFi:Swaps → AVNU private mode (live, gasless paymaster, fixed fee from private balance)
Lending → Vesu anonymizer (privacy_invoke)
Additional routes → Ekubo anonymizer where useful

Mainnet pool: 0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
Anonymizer class hashes (reference):Ekubo: 0x2a4ac595283d4d64b9952f5ef5c0da1775bfdb7c9d92237524a21dd8d19ebd7
Vesu: 0x3751128dc3ebd36215f982766f14aaca8f78793e4b0f42a73e49372a8e24aae

Tokens: official mainnet USDC, STRK, strkBTC, and any other pool-supported assets

High-level architecture:

User Wallet (Ready / Xverse)
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│                 Aether Next.js Frontend                  │
│  • Connect + Shield                                      │
│  • Portfolio dashboard (private balances only)           │
│  • Strategy selector + parameters                       │
│  • Live Effective Privacy Score + breakdown             │
│  • Plan viewer + “Execute Next Recommended Action”       │
│  • Selective Disclosure Studio                           │
│  • Attacker View panel                                   │
└──────────────────────┬───────────────────────────────────┘
                       │ Wallet API / SDK calls
┌──────────────────────▼───────────────────────────────────┐
│          Privacy Policy + Strategy Engine                │
│  (pure client-side TypeScript, fully deterministic)      │
│                                                          │
│  Inputs:                                                 │
│    - Local notes (via wallet discovery)                  │
│    - Live pool activity (RPC + note discovery)           │
│    - User strategy mode + targets + risk limits          │
│                                                          │
│  Outputs:                                                │
│    - Ordered list of privacy-optimized actions           │
│    - Exact amounts, time windows, routes                 │
│    - Expected privacy delta + financial impact           │
│                                                          │
│  Scoring (public formula in README):                     │
│    EffectivePrivacy =                                    │
│      0.30 × AnonymitySetSize +                           │
│      0.25 × AmountEntropy +                              │
│      0.20 × TimingEntropy +                              │
│      0.15 × BehavioralUniqueness +                       │
│      0.10 × ExitCorrelationRisk                          │
│    (all dimensions 0–100, computed from real data)       │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                 Execution Layer                          │
│  1. Shield (Wallet API)                                  │
│  2. Private Swap (AVNU private)                          │
│  3. Private Lending / Stake (Vesu / staking anonymizer)  │
│  4. Private Rebalance / Transfer (pool-native)           │
│  All results return as new private notes                 │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│          Live STRK20 Pool + Anonymizers + AVNU           │
│  Pool: 0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
└──────────────────────────────────────────────────────────┘

Privacy Policy Engine rules (must be implemented exactly):Amounts are split into non-repeating, non-round sizes relative to recent pool activity.
Timing windows are irregular and respect a user-defined maximum delay while maximizing inter-arrival entropy against the user’s own history and global pool.
Hard constraints: never unshield unless user explicitly requests; never reuse an exact previous amount within 48 h; refuse any action that would drop Effective Privacy below the user-set floor.
Strategy modes simply change the weights between expected return and privacy delta.

No custom Cairo contracts required for the MVP. Use existing Wallet API + AVNU private swaps + Vesu/Ekubo anonymizers via privacy_invoke. Deploy a thin helper only if a specific multi-call pattern is missing.3. The Three Required Mainnet TransactionsThese must be real, verifiable on Voyager, and listed in strk20.json:Shield — Deposit of USDC (or STRK) into the live pool, creating private note(s).
Private Swap — At least one privacy-optimized private swap (e.g. USDC → strkBTC) via AVNU private mode; result returns as private note.
Private DeFi Action — Either a second differently-sized private swap, a private lend/deposit via Vesu anonymizer, or a private rebalance/transfer between notes. Must also touch the pool.

Record the exact transaction hashes after they land.4. Day-by-Day Build Plan (18 Aug → 31 Aug)Days 1–2 (18–19 Aug)  Clone official STRK20 starter kit.  
Full wallet connect (Ready + Xverse) + real mainnet shield of USDC.  
Confirm private balances appear.  
Push public repo and keep it active on the leaderboard.

Days 3–4  Integrate AVNU private swap path end-to-end.  
Execute first real private USDC → strkBTC swap on mainnet.  
Record hash #2.  
Basic private multi-asset portfolio view.

Days 5–6  Implement full Privacy Policy + Strategy Engine (scoring formula, amount splitter, timing recommender, all five strategy modes).  
Unit tests against live pool data.  
Plan generation UI.

Days 7–8  “Execute Next” flow for private swaps + private rebalances.  
Integrate Vesu anonymizer path for at least one private lending action.  
Execute third mainnet pool-touching transaction.  
Record hash #3.

Days 9–10  Live Effective Privacy Score dashboard with full breakdown + attacker-view panel.  
Selective Disclosure Studio (at least two statement types).  
Strategy progress tracking across multiple actions.

Days 11–12  Polish UX, error handling, gasless confirmation.  
Full README: architecture diagram, exact scoring formula, how to reproduce the three txs, license (MIT/Apache-2.0).  
Write strk20.json with demo video, pool address, anonymizer references, and the three real hashes.

Days 13 (31 Aug)  Final end-to-end mainnet test with a fresh wallet.  
Record 2–3 min demo video showing: shield → multi-strategy plan → several private executions → rising privacy score → selective disclosure → attacker view stays empty.  
Final push.

This is the complete, real, no-mock specification for the full Aether product as originally scoped. It is ready to hand to Claude (or any coding agent) as the single source of truth.

### Architectural Review & Evaluation

This design directly targets the reason previous projects struggled: it eliminates the "privacy island" anti-pattern. Instead of treating privacy as a transient mixer step (`Shield -> Wait -> Unshield`), Aether establishes a closed-loop execution environment inside STRK20.

```
Traditional Flow (High Leakage):
[Wallet A] ──▶ [Shield] ──▶ [Unshield] ──▶ [Ekubo/Vesu] ──▶ Identity Relinked ❌

Aether Execution Engine:
               ┌──────────────────────────────────────────────────────┐
               │              STRK20 Shielded Environment             │
[Wallet A] ──▶ │ [Shielded Note]                                      │
               │       │                                              │
               │       ▼ (privacy_invoke / Anonymizers)               │
               │ [AVNU / Vesu / Ekubo Execution]                      │
               │       │                                              │
               │       ▼                                              │
               │ [New Shielded Note] ──▶ [Rebalance/Yield Accrual]    │
               └──────────────────────────────────────────────────────┘

```

---

### Strengths in the Hackathon Context

* **Direct Alignment with STRK20 Rubric (30% Depth + 25% Innovation):** Most competitors in the sprint registry are shipping basic payment links (`zkpayslip`, `whisperpay`) or simple shield/unshield wallets. Using `privacy_invoke` with AVNU and Vesu anonymizers directly exercises the deepest, underutilized primitives in Starknet's stack.
* **Pragmatic Scope Control (Zero Custom Cairo MVP):** Using existing, audited anonymizer class hashes and the live pool contract (`0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`) eliminates circuit-proving overhead (like debugging custom Noir/Groth16 verifiers) and avoids contract deployment failure modes.
* **Measurable Privacy Metrics:** The `EffectivePrivacy` scoring formula and the "Attacker-View Panel" give the judging panel concrete artifacts to evaluate, moving beyond abstract privacy claims.

---

### Technical Guardrails & Failure Modes to Prevent

| Failure Vector | Impact | Engineering Prevention |
| --- | --- | --- |
| **Note Fragmentation** | Repeated micro-DCA/splits generate too many individual notes, hitting Starknet per-transaction calldata limits. | Add a **Note Compaction** step to the engine: when note count exceeds a threshold (e.g., >4 notes per tier), automatically merge notes via atomic pool rebalancing. |
| **Wallet Account Compatibility** | `starknet.js` v10 breaking changes with Cartridge/Ready/Xverse account interfaces. | Pin versions strictly in `package.json`. Avoid experimental methods in `WalletAccountV6`; maintain fallback execution through the core Privacy SDK helper methods. |
| **Simulated vs. Real Anonymizer Calls** | Anonymizer calls failing on mainnet due to slippage or unhandled fee tokens during execution. | Ensure the AVNU aggregator parameters pass a strict `slippage` tolerance (e.g., 0.5%) and reserve a small gas/execution buffer from the shielded balance. |

---

### Mathematical Model for the Strategy Engine

The **Effective Privacy Score** should be implemented as a deterministic client-side evaluator ($0 \le S_{\text{eff}} \le 100$):

$$S_{\text{eff}} = 0.30 \cdot \mathcal{A}_{\text{set}} + 0.25 \cdot \mathcal{H}_{\text{amount}} + 0.20 \cdot \mathcal{H}_{\text{time}} + 0.15 \cdot (100 - \mathcal{U}_{\text{behavior}}) + 0.10 \cdot (100 - \mathcal{R}_{\text{exit}})$$

* **$\mathcal{A}_{\text{set}}$ (Anonymity Set Size):** Log-scaled ratio of active notes in the target denomination tier over the last 1,000 blocks:

$$\mathcal{A}_{\text{set}} = \min\left(100, \frac{\ln(N_{\text{tier}})}{\ln(N_{\text{max}})} \times 100\right)$$


* **$\mathcal{H}_{\text{amount}}$ (Amount Entropy):** Shannon entropy of output splits vs. common human round numbers ($10, 50, 100, 1000$):

$$\mathcal{H}_{\text{amount}} = 100 \cdot \left(1 - \exp\left(-\frac{\sigma_{\text{splits}}}{\mu_{\text{splits}}}\right)\right)$$


* **$\mathcal{H}_{\text{time}}$ (Inter-Arrival Timing Entropy):** Variance of execution intervals relative to Poisson-distributed background pool traffic.

---

### Core Data Structure for Execution State (`zustand` Store)

```typescript
export interface PrivateNote {
  commitment: string;
  asset: 'USDC' | 'STRK' | 'strkBTC';
  amount: bigint;
  leafIndex: number;
  nullifier: string;
  timestamp: number;
}

export interface ActionIntent {
  id: string;
  type: 'SWAP' | 'LEND' | 'REBALANCE';
  targetAsset: string;
  inputAmount: bigint;
  minOutputAmount: bigint;
  route: 'AVNU' | 'VESU' | 'EKUBO';
  anonymizerAddress: string;
  recommendedWindowStart: number;
  recommendedWindowEnd: number;
  expectedPrivacyDelta: number;
}

export interface AetherState {
  shieldedNotes: PrivateNote[];
  effectiveScore: number;
  scoreBreakdown: {
    anonymitySet: number;
    amountEntropy: number;
    timingEntropy: number;
    behavioralUniqueness: number;
    exitCorrelationRisk: number;
  };
  activeStrategy: 'PRIVACY_FIRST' | 'STEALTH_DCA' | 'WHALE_DISTRIBUTION' | 'YIELD_MAX' | 'BALANCED';
  pendingPlan: ActionIntent[];
  executeAction: (intent: ActionIntent) => Promise<string>; // Returns Starknet TX Hash
}

```

---

### Critical Path for `strk20.json` Readiness

To guarantee full marks on the **Working Mainnet Product (30%)** and **STRK20 Integration Depth (30%)** criteria:

1. **Transaction 1 (Shielding):** Execute a standard USDC shield on the mainnet pool. Record the leaf index and commitment hash.
2. **Transaction 2 (Private Swapping):** Execute an AVNU private swap using `privacy_invoke`. Verify on Voyager that the caller shows the anonymizer contract, not the user's personal address.
3. **Transaction 3 (Private Lending/Yield):** Execute a deposit into the Vesu anonymizer or a note-to-note internal rebalance.
4. **Export Format:**
```json
{
  "name": "Aether",
  "description": "Continuous private portfolio & strategy engine running entirely inside STRK20.",
  "repository": "https://github.com/<your-handle>/aether-strk20",
  "contracts": {
    "pool": "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a",
    "ekuboAnonymizer": "0x2a4ac595283d4d64b9952f5ef5c0da1775bfdb7c9d92237524a21dd8d19ebd7",
    "vesuAnonymizer": "0x3751128dc3ebd36215f982766f14aaca8f78793e4b0f42a73e49372a8e24aae"
  },
  "mainnetTransactions": [
    "<TX_HASH_1_SHIELD>",
    "<TX_HASH_2_PRIVATE_AVNU_SWAP>",
    "<TX_HASH_3_PRIVATE_VESU_LEND>"
  ],
  "demoVideoUrl": "<YOUTUBE_OR_LOOM_LINK>"
}

```



Proceed directly with Day 1–2 scaffolding. The scope avoids unnecessary custom Cairo complexity while maximizing the native STRK20 surface area judges look for.
