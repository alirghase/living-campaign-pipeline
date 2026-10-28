import { useMemo, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, CheckCircle2, CircleAlert, Table2, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { channels } from '@/data/formats'
import { computeInsights, type Kpi } from '@/lib/metrics'
import { useScoped } from '@/lib/selectors'
import { CHART } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

function useChartTheme() {
  const dark = useStore((s) => s.theme) === 'dark'
  return {
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
    axis: dark ? '#8b8fa3' : '#64748b',
    surface: dark ? '#1f2029' : '#ffffff',
    tooltip: {
      contentStyle: {
        background: dark ? '#23242e' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
        borderRadius: 8,
        fontSize: 12,
        color: dark ? '#f1f2f6' : '#0f172a',
      },
      labelStyle: { color: dark ? '#f1f2f6' : '#0f172a', fontWeight: 600 },
      itemStyle: { color: dark ? '#c9cbd6' : '#334155' },
      cursor: { fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' },
    },
  }
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const improved = kpi.delta !== undefined && (kpi.better === 'down' ? kpi.delta < 0 : kpi.delta > 0)
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{kpi.label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{kpi.display}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {kpi.delta !== undefined ? (
          <>
            <span className={cn('inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium', improved ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/12 text-red-600')}>
              {kpi.delta < 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
              {Math.abs(kpi.delta)}%
            </span>
            <span className="text-muted-foreground">from {kpi.baseline}</span>
          </>
        ) : (
          <span className="text-muted-foreground">New metric · no baseline</span>
        )}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  table,
  className,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  table: { columns: string[]; rows: (string | number)[][] }
  className?: string
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <button
          onClick={() => setAsTable((v) => !v)}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={asTable ? 'Show chart' : 'Show data table'}
        >
          {asTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {asTable ? 'Chart' : 'Table'}
        </button>
      </div>
      {asTable ? (
        <div className="h-60 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {table.columns.map((c) => (
                  <th key={c} className="py-1.5 pr-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {r.map((v, j) => (
                    <td key={j} className={cn('py-1.5 pr-3', j > 0 && 'tabular-nums')}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-60">{children}</div>
      )}
    </div>
  )
}

/** Short horizontal tick drawn at each bar's target value. */
function TargetTick(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props
  return <line x1={cx - 30} x2={cx + 30} y1={cy} y2={cy} stroke={CHART.muted} strokeWidth={2} strokeDasharray="4 3" />
}

export default function Insights() {
  // Metrics are quarter-level, so they always use every campaign (the pilot is part of it)
  const { allBriefs: briefs, allAssets: assets } = useScoped()
  const pilot = useStore((s) => s.pilot)
  const t = useChartTheme()
  const data = useMemo(() => computeInsights(briefs, assets), [briefs, assets])
  const axis = { stroke: t.grid, tick: { fill: t.axis, fontSize: 11 }, tickLine: false }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Measurement & Insights"
        subtitle={`Quarter to date against the manual baseline${pilot ? ' · quarter-level view, includes the pilot campaign' : ''}. Every action in the demo updates these numbers.`}
      />

      <div className="grid grid-cols-6 gap-3">
        {data.kpis.map((k) => (
          <KpiCard key={k.key} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ChartCard
          title="Time from brief to launch (days)"
          subtitle="Weekly average, last 12 weeks"
          table={{ columns: ['Week', 'Days'], rows: data.weekly.map((w) => [w.week, w.days]) }}
        >
          <ResponsiveContainer>
            <LineChart data={data.weekly} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={t.grid} vertical={false} />
              <XAxis dataKey="week" {...axis} />
              <YAxis {...axis} axisLine={false} domain={[0, 10]} />
              <Tooltip {...t.tooltip} cursor={{ stroke: t.axis, strokeDasharray: '3 3' }} formatter={(v) => [`${v} days`, 'Brief to launch']} />
              <ReferenceLine y={8.5} stroke={CHART.muted} strokeDasharray="4 4" label={{ value: 'Baseline 8.5', position: 'insideTopRight', fill: t.axis, fontSize: 10 }} />
              <Line type="monotone" dataKey="days" stroke={CHART.indigo} strokeWidth={2} dot={{ r: 3, fill: CHART.indigo, stroke: t.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Assets by channel"
          subtitle="Published per month"
          table={{ columns: ['Month', ...channels.map((c) => c.label)], rows: data.byMonth.map((m) => [m.month, ...channels.map((c) => m[c.id])]) }}
        >
          <ResponsiveContainer>
            <BarChart data={data.byMonth} margin={{ top: 10, right: 8, left: -18, bottom: 0 }} barSize={44}>
              <CartesianGrid stroke={t.grid} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} axisLine={false} />
              <Tooltip {...t.tooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: t.axis }} />
              {channels.map((c, i) => (
                <Bar
                  key={c.id}
                  dataKey={c.id}
                  name={c.label}
                  stackId="a"
                  fill={CHART.channel[c.id]}
                  stroke={t.surface}
                  strokeWidth={2}
                  radius={i === channels.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Pipeline conversion"
          subtitle="Share of briefed assets reaching each stage"
          table={{ columns: ['Stage', 'Assets', '%'], rows: data.funnel.map((f) => [f.stage, f.count, `${f.pct}%`]) }}
        >
          <ResponsiveContainer>
            <BarChart data={data.funnel} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }} barSize={18}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis type="category" dataKey="stage" {...axis} axisLine={false} width={70} />
              <Tooltip {...t.tooltip} formatter={(v, _n, p) => [`${v}% (${(p.payload as { count: number }).count} assets)`, 'Reached']} />
              <Bar dataKey="pct" fill={CHART.indigo} radius={[0, 4, 4, 0]} background={{ fill: t.grid, radius: 4 }}>
                <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} fill={t.axis} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Assets by journey"
          subtitle="Quarter to date"
          table={{ columns: ['Journey', 'Assets', '%'], rows: data.journeys.map((j) => [j.name, j.value, `${j.pct}%`]) }}
        >
          <div className="flex h-full items-center">
            <div className="relative h-full flex-1">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip {...t.tooltip} formatter={(v, n) => [`${v} assets`, n]} />
                  <Pie data={data.journeys} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke={t.surface} strokeWidth={2}>
                    <Cell fill={CHART.journey.rental} />
                    <Cell fill={CHART.journey.shared} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold tabular-nums">{data.journeys[0].value + data.journeys[1].value}</span>
                <span className="text-[11px] text-muted-foreground">assets</span>
              </div>
            </div>
            <div className="w-40 space-y-3">
              {data.journeys.map((j, i) => (
                <div key={j.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: i === 0 ? CHART.journey.rental : CHART.journey.shared }} />
                  <span className="flex-1">{j.name}</span>
                  <span className="font-semibold tabular-nums">{j.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Average approval time by review type"
          subtitle="Hours from submission to decision · dashed tick = target"
          table={{ columns: ['Review', 'Avg hours', 'Target'], rows: data.reviewChart.map((r) => [r.type, r.hours, `${r.target}h`]) }}
        >
          <ResponsiveContainer>
            <ComposedChart data={data.reviewChart} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={t.grid} vertical={false} />
              <XAxis dataKey="type" {...axis} />
              <YAxis {...axis} axisLine={false} domain={[0, 7]} />
              <Tooltip {...t.tooltip} formatter={(v, n) => [`${v}h`, n === 'target' ? 'Target' : 'Average']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: t.axis }} formatter={(v) => (v === 'hours' ? 'Average hours' : 'Target')} />
              <Bar dataKey="hours" fill={CHART.indigo} radius={[4, 4, 0, 0]} barSize={48}>
                <LabelList dataKey="hours" position="top" formatter={(v) => `${v}h`} fill={t.axis} fontSize={11} />
              </Bar>
              <Scatter dataKey="target" fill={CHART.muted} shape={<TargetTick />} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revisions per campaign"
          subtitle="Which campaigns needed the most rework"
          table={{ columns: ['Campaign', 'Revisions'], rows: data.revisionsByCampaign.map((r) => [r.name, r.revisions]) }}
        >
          <ResponsiveContainer>
            <BarChart data={data.revisionsByCampaign} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }} barSize={12}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" {...axis} axisLine={false} width={150} tick={{ fill: t.axis, fontSize: 10 }} />
              <Tooltip {...t.tooltip} formatter={(v) => [v, 'Revisions']} />
              <Bar dataKey="revisions" radius={[0, 4, 4, 0]}>
                {data.revisionsByCampaign.map((r) => (
                  <Cell key={r.name} fill={CHART.journey[r.journey]} />
                ))}
                <LabelList dataKey="revisions" position="right" fill={t.axis} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">Assumptions validation</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Assumption</th>
                <th className="px-4 py-2 font-medium">Evidence so far</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.assumptions.map((a) => (
                <tr key={a.assumption} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{a.assumption}</td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{a.evidence}</td>
                  <td className="px-4 py-2.5">
                    {a.ok ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Supported
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <CircleAlert className="size-3.5" /> Not yet
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">Process health</div>
          <ul className="divide-y">
            {data.health.map((h) => (
              <li key={h.text} className="flex items-start gap-2.5 px-4 py-3 text-sm">
                {h.tone === 'green' ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className={cn('mt-0.5 size-4 shrink-0', h.tone === 'red' ? 'text-red-500' : 'text-amber-500')} />
                )}
                <span>
                  <span className={cn('mr-1.5 text-[10px] font-semibold uppercase', h.tone === 'red' ? 'text-red-500' : h.tone === 'amber' ? 'text-amber-500' : 'text-emerald-500')}>
                    {h.tone === 'red' ? 'Bottleneck' : h.tone === 'amber' ? 'Watch' : 'Healthy'}
                  </span>
                  {h.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
