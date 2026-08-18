'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DEMO_POOL,
  buildFootprint,
  demoScenarios,
  runDeanonymization,
  type DeanonReport,
  type Finding,
  type ObservedEvent,
} from '@/lib/deanon'
import { loadLedger } from '@/lib/history'
import { usePlan } from '@/lib/store/plan'
import { Button, Segmented, StateBadge } from '@/components/ui/primitives'

/**
 * The adversary, run against a real footprint.
 *
 * Attack first, then defend. A privacy tool that only ever reassures you is
 * indistinguishable from one that does nothing, so this panel leads with what
 * an observer can already work out — and every finding carries the remedy that
 * closes it, which is what makes the loop a loop.
 */

type Source = 'target' | 'naive' | 'managed'

const BAND_COPY: Record<DeanonReport['band'], { label: string; note: string }> = {
  exposed: { label: 'Exposed', note: 'An observer can link this footprint.' },
  weak: { label: 'Weak', note: 'Partially linkable — worth closing.' },
  guarded: { label: 'Guarded', note: 'Mostly unlinkable; residual signals remain.' },
  shielded: { label: 'Shielded', note: 'Nothing here ties the events together.' },
}

const SEVERITY_LABEL: Record<Finding['severity'], string> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

export function ExposurePanel({ address }: { address: string }) {
  const activity = usePlan((state) => state.activity)
  const loadActivity = usePlan((state) => state.loadActivity)

  const [source, setSource] = useState<Source>('target')
  const [now, setNow] = useState<number | null>(null)
  const [ledgerEvents, setLedgerEvents] = useState<ObservedEvent[]>([])

  // The clock is read after mount so server and client render the same markup.
  useEffect(() => {
    setNow(Date.now())
  }, [])

  useEffect(() => {
    if (!activity) void loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLedgerEvents(buildFootprint({ ledger: loadLedger(address), poolResult: activity }))
  }, [address, activity])

  const report = useMemo(() => {
    if (now === null) return null

    const pool = activity?.live ? activity.activity : DEMO_POOL
    const scenarios = demoScenarios(now)
    const events =
      source === 'target' ? ledgerEvents : source === 'naive' ? scenarios.naive : scenarios.managed

    return runDeanonymization(events, { now, pool })
  }, [source, ledgerEvents, activity, now])

  if (!report) {
    return <div className="h-40 rounded-2xl shimmer" />
  }

  const band = BAND_COPY[report.band]
  const exposed = report.band === 'exposed' || report.band === 'weak'
  const emptyTarget = source === 'target' && ledgerEvents.length === 0

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <section className={`panel ${exposed ? 'panel-ember' : ''} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mono-label">Linkability</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span
                className={`tabular text-[44px] leading-none font-semibold tracking-tight ${
                  exposed ? 'text-ember' : 'text-ink'
                }`}
              >
                {report.linkabilityScore.toFixed(0)}
              </span>
              <div>
                <p
                  className={`text-[14px] font-semibold ${exposed ? 'text-ember' : 'text-ink-soft'}`}
                >
                  {band.label}
                </p>
                <p className="text-[12px] text-ink-muted">{band.note}</p>
              </div>
            </div>
          </div>

          <Segmented<Source>
            ariaLabel="Footprint to analyse"
            value={source}
            onChange={setSource}
            options={[
              { value: 'target', label: 'This address' },
              { value: 'naive', label: 'Naive user' },
              { value: 'managed', label: 'Aether-managed' },
            ]}
          />
        </div>

        <p className="mt-4 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft text-pretty">
          {report.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-rule pt-3.5 font-mono text-[11px] text-ink-faint">
          <span>{report.observedCount} observable events</span>
          <span>{report.findings.length} findings</span>
          <span>
            pool {activity?.live ? `${activity.eventCount} events measured` : 'sample activity'}
          </span>
        </div>
      </section>

      {emptyTarget && (
        <div className="card-flat border-dashed p-5">
          <p className="text-[13.5px] font-medium">Nothing recorded for this address yet</p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted text-pretty">
            The adversary works from what it can observe. Shield once, or execute a plan, and this
            fills in. In the meantime the two sample footprints above run through the identical
            engine — compare them to see what it detects and what it does not.
          </p>
        </div>
      )}

      {/* Findings */}
      {report.findings.length > 0 && (
        <section className="panel">
          <div className="flex items-center justify-between border-b border-rule px-5 py-3">
            <span className="mono-label">What an observer can work out</span>
            <StateBadge state="public">{report.findings.length}</StateBadge>
          </div>

          <ul className="divide-y divide-rule">
            {report.findings.slice(0, 8).map((finding) => (
              <li key={finding.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[14px] font-semibold tracking-tight">{finding.title}</h3>
                  <span className="shrink-0 font-mono text-[10.5px] tracking-wider text-ember uppercase">
                    {SEVERITY_LABEL[finding.severity]} · {(finding.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-ink-muted text-pretty">
                  {finding.explanation}
                </p>

                <ul className="mt-2.5 space-y-0.5">
                  {finding.evidence.map((line) => (
                    <li key={line} className="font-mono text-[11px] text-ink-faint">
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <a
                    href="#step-03"
                    className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[12.5px] font-medium text-paper-raised transition-colors hover:bg-ink-soft"
                  >
                    {finding.fix.label}
                  </a>
                  {finding.fix.mode && (
                    <span className="font-mono text-[10.5px] text-ink-faint">
                      suggests {finding.fix.mode.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {report.findings.length > 8 && (
            <div className="border-t border-rule px-5 py-3">
              <p className="font-mono text-[11px] text-ink-faint">
                + {report.findings.length - 8} more, same categories
              </p>
            </div>
          )}
        </section>
      )}

      {report.findings.length === 0 && !emptyTarget && (
        <div className="card-flat p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <StateBadge state="private">no findings</StateBadge>
            <p className="text-[13.5px] font-medium">The adversary came back empty</p>
          </div>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-muted text-pretty">
            No amount echoes another, no exit reconstructs an entry, the spacing carries no
            schedule, and the tiers used are busy. That is what the loop is for — and it holds only
            until the next action, which is why the adversary runs again after every one.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setNow(Date.now())
            void loadActivity()
          }}
        >
          Re-run adversary
        </Button>
        <p className="text-[11.5px] text-ink-faint">
          Heuristics and weights are documented in docs/ATTACK-MODEL.md.
        </p>
      </div>
    </div>
  )
}
