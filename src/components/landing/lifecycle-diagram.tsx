'use client'

import { useScrollProgress } from '@/lib/hooks/use-motion'
import { Container, Eyebrow, Reveal } from '@/components/ui/primitives'

/**
 * The two lifecycles, scrubbed by scroll.
 *
 * The top track draws the traditional path and lets the identity thread
 * re-form the moment value leaves the pool — the line turns amber and
 * reconnects to the wallet. The bottom track draws Aether's closed loop, where
 * the thread never exits and so never reconnects.
 *
 * Scroll drives the stroke directly rather than firing a canned animation on
 * entry, so the leak happens at the reader's pace and they can scrub back.
 */

export function LifecycleDiagram() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  // Map raw scroll into two staged draws with a beat between them.
  const stage = (from: number, to: number) =>
    Math.min(1, Math.max(0, (progress - from) / (to - from)))

  const leakDraw = stage(0.16, 0.44)
  const leakRelink = stage(0.4, 0.56)
  const loopDraw = stage(0.5, 0.82)

  return (
    <section id="lifecycle" ref={ref} className="scroll-mt-20 py-28 sm:py-36">
      <Container>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>The leak</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-md mt-4 text-balance">
              Privacy dies at the <span className="italic">exit</span>, not in the pool.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-muted text-pretty">
              The cryptography is not the weak point. The weak point is the moment shielded value
              becomes public again in order to do something useful with it.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 space-y-5">
          {/* Traditional */}
          <div className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-4">
              <h3 className="text-[13px] font-semibold tracking-tight">Shield → unshield → DeFi</h3>
              <span
                className="text-[11.5px] font-medium tracking-wide transition-colors duration-500"
                style={{ color: leakRelink > 0.5 ? 'var(--color-exposed)' : 'var(--color-ink-faint)' }}
              >
                {leakRelink > 0.5 ? 'identity relinked' : 'private — for now'}
              </span>
            </header>

            <div className="overflow-x-auto px-6 py-10">
              <svg viewBox="0 0 720 130" className="w-full min-w-[620px]" role="img" aria-label="Traditional flow: value leaves the pool and the identity link re-forms">
                <NodeBox x={8} label="Wallet" sub="public" />
                <NodeBox x={188} label="Shield" sub="private" tone="veil" />
                <NodeBox x={368} label="Unshield" sub="public again" tone="exposed" />
                <NodeBox x={548} label="Ekubo / Vesu" sub="public" tone="exposed" />

                <Track x1={148} x2={188} draw={leakDraw * 3} />
                <Track x1={328} x2={368} draw={(leakDraw - 0.33) * 3} />
                <Track x1={508} x2={548} draw={(leakDraw - 0.66) * 3} tone="exposed" />

                {/* The re-formed link: wallet straight back to the public action. */}
                <path
                  d="M 78 92 C 78 124, 610 124, 610 92"
                  fill="none"
                  stroke="var(--color-exposed)"
                  strokeWidth="1.6"
                  strokeDasharray="4 5"
                  pathLength={1}
                  strokeDashoffset={1 - leakRelink}
                  style={{
                    strokeDasharray: `${leakRelink} 1`,
                    opacity: leakRelink,
                    transition: 'opacity 320ms linear',
                  }}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x="344"
                  y="122"
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="10"
                  fill="var(--color-exposed)"
                  style={{ opacity: leakRelink }}
                >
                  same amount · same window · link restored
                </text>
              </svg>
            </div>
          </div>

          {/* Aether */}
          <div className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-4">
              <h3 className="text-[13px] font-semibold tracking-tight">
                Aether — the loop never opens
              </h3>
              <span
                className="text-[11.5px] font-medium tracking-wide transition-colors duration-500"
                style={{ color: loopDraw > 0.6 ? 'var(--color-good)' : 'var(--color-ink-faint)' }}
              >
                {loopDraw > 0.6 ? 'capital never exits' : 'shielded'}
              </span>
            </header>

            <div className="overflow-x-auto px-6 py-10">
              <svg viewBox="0 0 720 150" className="w-full min-w-[620px]" role="img" aria-label="Aether flow: value stays inside the pool through every action">
                <rect
                  x="150"
                  y="6"
                  width="560"
                  height="112"
                  rx="12"
                  fill="var(--color-veil-soft)"
                  stroke="var(--color-veil-mid)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  opacity={0.5 + loopDraw * 0.5}
                />
                <text x="164" y="26" fontSize="10" className="font-mono" fill="var(--color-veil-deep)" opacity={loopDraw}>
                  STRK20 shielded environment
                </text>

                <NodeBox x={8} y={44} label="Wallet" sub="one deposit" />
                <NodeBox x={188} y={44} label="Note" sub="private" tone="veil" />
                <NodeBox x={368} y={44} label="privacy_invoke" sub="AVNU · Vesu" tone="veil" />
                <NodeBox x={548} y={44} label="New note" sub="private" tone="veil" />

                <Track x1={148} x2={188} y={70} draw={loopDraw * 3} tone="veil" />
                <Track x1={328} x2={368} y={70} draw={(loopDraw - 0.33) * 3} tone="veil" />
                <Track x1={508} x2={548} y={70} draw={(loopDraw - 0.66) * 3} tone="veil" />

                {/* The return leg — output becomes the next input, still inside. */}
                <path
                  d="M 610 98 C 610 134, 248 134, 248 98"
                  fill="none"
                  stroke="var(--color-veil)"
                  strokeWidth="1.6"
                  style={{
                    strokeDasharray: `${Math.max(0, (loopDraw - 0.7) / 0.3)} 1`,
                    opacity: Math.max(0, (loopDraw - 0.7) / 0.3),
                  }}
                  pathLength={1}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x="430"
                  y="132"
                  textAnchor="middle"
                  fontSize="10"
                  className="font-mono"
                  fill="var(--color-veil-deep)"
                  style={{ opacity: Math.max(0, (loopDraw - 0.75) / 0.25) }}
                >
                  output re-enters as the next input
                </text>
              </svg>
            </div>
          </div>
        </div>

        <Reveal delay={100}>
          <p className="mt-7 max-w-3xl text-[13.5px] leading-relaxed text-ink-muted">
            The pool withdraws to the helper, calls its <code className="font-mono text-[12.5px]">privacy_invoke</code>,
            and credits the result into a fresh note — atomically, in one transaction. Value touches
            a helper contract but never a public address you control, which is the difference
            between routing through DeFi and unshielding into it.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}

function NodeBox({
  x,
  y = 30,
  label,
  sub,
  tone = 'neutral',
}: {
  x: number
  y?: number
  label: string
  sub: string
  tone?: 'neutral' | 'veil' | 'exposed'
}) {
  const palette = {
    neutral: { fill: 'var(--color-paper-sunk)', stroke: 'var(--color-rule-strong)', text: 'var(--color-ink)' },
    veil: { fill: 'var(--color-veil-soft)', stroke: 'var(--color-veil-mid)', text: 'var(--color-veil-deep)' },
    exposed: { fill: 'var(--color-exposed-soft)', stroke: 'var(--color-exposed-mid)', text: 'var(--color-exposed)' },
  }[tone]

  return (
    <g>
      <rect x={x} y={y} width={140} height={52} rx={9} fill={palette.fill} stroke={palette.stroke} strokeWidth="1" />
      <text x={x + 70} y={y + 22} textAnchor="middle" fontSize="12.5" fontWeight="500" fill={palette.text}>
        {label}
      </text>
      <text x={x + 70} y={y + 38} textAnchor="middle" fontSize="10" fill="var(--color-ink-faint)" className="font-mono">
        {sub}
      </text>
    </g>
  )
}

function Track({
  x1,
  x2,
  y = 56,
  draw,
  tone = 'neutral',
}: {
  x1: number
  x2: number
  y?: number
  draw: number
  tone?: 'neutral' | 'veil' | 'exposed'
}) {
  const clamped = Math.min(1, Math.max(0, draw))
  const stroke =
    tone === 'veil'
      ? 'var(--color-veil)'
      : tone === 'exposed'
        ? 'var(--color-exposed)'
        : 'var(--color-ink-faint)'

  return (
    <line
      x1={x1}
      y1={y}
      x2={x1 + (x2 - x1) * clamped}
      y2={y}
      stroke={stroke}
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity={clamped > 0 ? 1 : 0}
    />
  )
}
