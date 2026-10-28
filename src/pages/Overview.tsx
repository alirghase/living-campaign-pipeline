import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  FileText,
  GitBranch,
  Package,
  Send,
  ShieldCheck,
  Sparkles,
  Stamp,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { Callout, MemberAvatar, Segmented, StatusDot } from '@/components/common'
import { formats } from '@/data/formats'
import type { Asset, Brief, JourneyFilter } from '@/data/types'
import { stageInfo, summary, useScoped, type StageInfo } from '@/lib/selectors'
import { JOURNEY_HEX } from '@/lib/colors'
import { fmtAgo } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const ICONS: Record<string, LucideIcon> = {
  brief: FileText,
  routing: GitBranch,
  creation: Sparkles,
  qa: ShieldCheck,
  approval: Stamp,
  package: Package,
  delivery: Send,
  insights: BarChart3,
}

const OWNER: Record<string, { label: string; cls: string }> = {
  brief: { label: 'People decide', cls: 'bg-amber-500/12 text-amber-700 dark:text-amber-300' },
  routing: { label: 'Automated', cls: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300' },
  creation: { label: 'AI + people', cls: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' },
  qa: { label: 'Automated', cls: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300' },
  approval: { label: 'People decide', cls: 'bg-amber-500/12 text-amber-700 dark:text-amber-300' },
  package: { label: 'Automated', cls: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300' },
  delivery: { label: 'Automated', cls: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300' },
  insights: { label: 'Automated', cls: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300' },
}

const NODE_H = 150
const ROW_GAP = 76
const PAD = 56

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1100)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function split(stage: string, briefs: Brief[], assets: Asset[]) {
  const forStage = (pred: (a: Asset) => boolean) => {
    const xs = assets.filter(pred)
    return { rental: xs.filter((a) => a.journey === 'rental').length, shared: xs.filter((a) => a.journey === 'shared').length }
  }
  switch (stage) {
    case 'brief':
    case 'routing': {
      const st = stage === 'brief' ? 'Draft' : 'Routed'
      const xs = briefs.filter((b) => b.status === st && !assets.some((a) => a.briefId === b.id))
      return { rental: xs.filter((b) => b.journey === 'rental').length, shared: xs.filter((b) => b.journey === 'shared').length }
    }
    case 'creation':
    case 'qa':
    case 'approval':
      return forStage((a) => a.stage === stage)
    case 'package':
      return forStage((a) => a.stage === 'approved')
    case 'delivery':
      return forStage((a) => a.stage === 'published' && a.deliveryStatus !== 'Paused')
    default:
      return forStage((a) => a.stage === 'published' && a.deliveryStatus === 'Live')
  }
}

function PipelineFlow({ stages, briefs, assets, journey }: { stages: StageInfo[]; briefs: Brief[]; assets: Asset[]; journey: JourneyFilter }) {
  const navigate = useNavigate()
  const [ref, width] = useWidth<HTMLDivElement>()
  const nodeW = (width - PAD * 2 - 3 * 40) / 4
  const colX = (c: number) => PAD + c * (nodeW + 40)
  const pos = stages.map((_, i) => (i < 4 ? { x: colX(i), y: 0 } : { x: colX(7 - i), y: NODE_H + ROW_GAP }))
  const cy = (i: number) => pos[i].y + NODE_H / 2
  const height = NODE_H * 2 + ROW_GAP

  const edges: { d: string; from: number }[] = []
  for (let i = 0; i < 7; i++) {
    if (i < 3) edges.push({ d: `M ${pos[i].x + nodeW} ${cy(i)} L ${pos[i + 1].x} ${cy(i + 1)}`, from: i })
    else if (i === 3) {
      const x = pos[3].x + nodeW
      edges.push({ d: `M ${x} ${cy(3)} C ${x + 48} ${cy(3)} ${x + 48} ${cy(4)} ${x} ${cy(4)}`, from: 3 })
    } else edges.push({ d: `M ${pos[i].x} ${cy(i)} L ${pos[i + 1].x + nodeW} ${cy(i + 1)}`, from: i })
  }
  const loop = `M ${pos[7].x} ${cy(7)} C ${PAD - 48} ${cy(7)} ${PAD - 48} ${cy(0)} ${pos[0].x} ${cy(0)}`
  const colors = journey === 'all' ? [JOURNEY_HEX.rental, JOURNEY_HEX.shared] : [JOURNEY_HEX[journey]]

  return (
    <div ref={ref} className="relative" style={{ height }}>
      <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground/60" />
          </marker>
        </defs>
        {edges.map((e) => (
          <path key={e.d} d={e.d} className="stroke-border" strokeWidth={2} fill="none" markerEnd="url(#arrow)" />
        ))}
        <path d={loop} stroke="#6366f1" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="5 5" fill="none" markerEnd="url(#arrow)">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
        </path>
        {edges.map((e, k) => {
          const n = Math.min(3, Math.max(1, Math.ceil(stages[e.from].count / 4)))
          return Array.from({ length: n }, (_, j) => (
            <circle key={`${k}-${j}`} r={3.5} fill={colors[(k + j) % colors.length]}>
              <animateMotion dur={`${2.2 + (k % 3) * 0.3}s`} begin={`${(j * 2.2) / n + k * 0.15}s`} repeatCount="indefinite" path={e.d} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur={`${2.2 + (k % 3) * 0.3}s`} begin={`${(j * 2.2) / n + k * 0.15}s`} repeatCount="indefinite" />
            </circle>
          ))
        })}
        <circle r={3.5} fill="#6366f1">
          <animateMotion dur="3s" repeatCount="indefinite" path={loop} />
        </circle>
      </svg>
      <div
        className="absolute rounded-full border border-indigo-500/30 bg-background px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-indigo-600 dark:text-indigo-300"
        style={{ left: 8, top: NODE_H + ROW_GAP / 2 - 13 }}
      >
        ↺ Reuse what was learned and created
      </div>
      {stages.map((s, i) => {
        const Icon = ICONS[s.key]
        const sp = split(s.key, briefs, assets)
        const total = sp.rental + sp.shared || 1
        const owner = OWNER[s.key]
        return (
          <button
            key={s.key}
            onClick={() => navigate(s.path)}
            className={cn(
              'lift absolute flex flex-col rounded-xl border bg-card p-3.5 text-left ring-1 ring-transparent',
              s.health === 'red' && 'border-red-500/40 ring-red-500/20',
              s.health === 'amber' && 'border-amber-500/40 ring-amber-500/15',
            )}
            style={{ left: pos[i].x, top: pos[i].y, width: nodeW, height: NODE_H }}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4" />
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">STAGE {i + 1}</span>
              <span className="ml-auto">
                <StatusDot health={s.health} pulse />
              </span>
            </div>
            <div className="mt-2 line-clamp-1 text-[13px] font-semibold">{s.label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">{s.count}</span>
              <span className="text-xs text-muted-foreground">{s.unit}</span>
            </div>
            <div className="mt-auto space-y-1.5">
              {journey === 'all' && (
                <div className="flex h-1 overflow-hidden rounded-full bg-muted">
                  <div className="bg-teal-400" style={{ width: `${(sp.rental / total) * 100}%` }} />
                  <div className="bg-purple-400" style={{ width: `${(sp.shared / total) * 100}%` }} />
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-muted-foreground">{s.note}</span>
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold', owner.cls)}>{owner.label}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function Overview() {
  const scoped = useScoped()
  const journey = useStore((s) => s.journey)
  const setJourney = useStore((s) => s.setJourney)
  const pilot = useStore((s) => s.pilot)

  const briefs = journey === 'all' ? scoped.briefs : scoped.briefs.filter((b) => b.journey === journey)
  const assets = journey === 'all' ? scoped.assets : scoped.assets.filter((a) => a.journey === journey)
  const stages = stageInfo(briefs, assets)
  const sum = summary(briefs, assets)

  const activity = useMemo(() => {
    const byId = new Map(scoped.allBriefs.map((b) => [b.id, b]))
    return assets
      .flatMap((a) => a.audit.map((e) => ({ ...e, a, b: byId.get(a.briefId)! })))
      .filter((e) => e.at <= Date.now())
      .sort((x, y) => y.at - x.at)
      .slice(0, 7)
  }, [assets, scoped.allBriefs])

  const stats = [
    { label: 'campaigns active', value: sum.campaigns },
    { label: 'assets in pipeline', value: sum.inPipeline },
    { label: 'awaiting approval', value: sum.awaitingApproval },
    { label: 'published today', value: sum.publishedToday },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pipeline Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create once, adapt many times. One approved brief becomes channel-ready assets for Facebook, Instagram, LinkedIn, Google Display and Email.
          </p>
        </div>
        <Segmented
          value={journey}
          onChange={setJourney}
          options={[
            { value: 'all', label: 'All journeys' },
            { value: 'rental', label: <span className="text-teal-600 dark:text-teal-300">Rental</span> },
            { value: 'shared', label: <span className="text-purple-600 dark:text-purple-300">Shared Ownership</span> },
          ]}
        />
      </div>

      <div className="grid grid-cols-4 divide-x rounded-xl border bg-card">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2 px-5 py-3.5">
            <span className="text-2xl font-semibold tabular-nums">{s.value}</span>
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card/40 p-5">
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {pilot ? 'Pilot scope · Rental Q1 London' : journey === 'all' ? 'Both journeys' : journey === 'rental' ? 'Rental journey' : 'Shared Ownership journey'} · click a stage to open it
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><StatusDot health="green" /> Healthy</span>
            <span className="flex items-center gap-1.5"><StatusDot health="amber" /> Bottleneck</span>
            <span className="flex items-center gap-1.5"><StatusDot health="red" /> Blocked</span>
          </span>
        </div>
        <PipelineFlow stages={stages} briefs={briefs} assets={assets} journey={pilot ? 'rental' : journey} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Bot className="size-4 text-indigo-500" /> Automation handles the repeatable
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              ['Production', 'channel adaptations from one brief'],
              ['Routing', 'to the right journey queue'],
              ['Checking', 'format, brand, disclaimers, tone'],
              ['Chasing', 'SLA timers instead of email'],
              ['Packaging & publishing', 'one approved library'],
              ['Measurement', 'live KPIs against baseline'],
            ].map(([k, v]) => (
              <li key={k} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-indigo-500" />
                <span>
                  <span className="font-medium text-foreground">{k}</span> — {v}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <UserCheck className="size-4 text-amber-500" /> People own the decisions
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              ['Strategy', 'what each campaign must achieve'],
              ['Creative judgement', 'choose and refine the variants'],
              ['Brand decisions', 'Brand Manager signs off'],
              ['Business decisions', 'Business Reviewer signs off'],
              ['Risk decisions', 'Risk Officer signs off'],
              ['Final approval', 'nothing publishes without it'],
            ].map(([k, v]) => (
              <li key={k} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <span className="font-medium text-foreground">{k}</span> — {v}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Latest activity</div>
          <ul className="space-y-2.5">
            {activity.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <MemberAvatar id={e.actorId} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{e.action}</div>
                  <div className="truncate text-muted-foreground">
                    {e.b.name} · {formats[e.a.format].short}
                  </div>
                </div>
                <span className="shrink-0 text-muted-foreground">{fmtAgo(e.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Callout className="justify-center border-transparent bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 py-3 text-center font-medium">
        Automate the repeatable. People own the decisions.
      </Callout>
    </div>
  )
}
