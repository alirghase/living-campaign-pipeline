import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleDashed, Loader2, ScanLine, Send, Undo2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AssetThumb, Callout, EmptyState, JourneyPill, PageHeader, ToolBadge } from '@/components/common'
import { CHECK_LABELS, overall, runChecks } from '@/data/checks'
import { formats } from '@/data/formats'
import type { Asset, CheckResult, CheckStatus } from '@/data/types'
import { useScoped } from '@/lib/selectors'
import { fmtAgo } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const ICON: Record<CheckStatus, React.ReactNode> = {
  pass: <CheckCircle2 className="size-4 text-emerald-500" />,
  warn: <AlertTriangle className="size-4 text-amber-500" />,
  fail: <XCircle className="size-4 text-red-500" />,
}

const BADGE: Record<CheckStatus, string> = {
  pass: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  warn: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  fail: 'bg-red-500/12 text-red-700 dark:text-red-300',
}

function StateBadge({ state }: { state: Asset['qaState'] }) {
  if (state === 'not-run') return <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Not scanned</span>
  return <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase', BADGE[state])}>{state}</span>
}

export default function Checks() {
  const { assets, briefById } = useScoped()
  const recordChecks = useStore((s) => s.recordChecks)
  const sendBack = useStore((s) => s.sendBack)
  const submitForApproval = useStore((s) => s.submitForApproval)
  const queue = assets.filter((a) => a.stage === 'qa')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scan, setScan] = useState<{ id: string; results: CheckResult[]; shown: number } | null>(null)
  const [bulk, setBulk] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const selected = queue.find((a) => a.id === selectedId) ?? queue[0]
  const brief = selected ? briefById.get(selected.briefId)! : undefined
  const scanning = scan && selected && scan.id === selected.id

  function run(asset: Asset) {
    const results = runChecks(asset, briefById.get(asset.briefId)!)
    setScan({ id: asset.id, results, shown: 0 })
    results.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setScan((s) => (s && s.id === asset.id ? { ...s, shown: i + 1 } : s)), 380 * (i + 1)))
    })
    timers.current.push(
      window.setTimeout(() => {
        const r = recordChecks(asset.id)
        setScan(null)
        if (r === 'fail') toast.error('Pre-checks failed — issue caught before review')
        else toast.success(r === 'warn' ? 'Passed with 1 warning' : 'All 8 checks passed')
      }, 380 * (results.length + 1)),
    )
  }

  function runAll() {
    const pending = queue.filter((a) => a.qaState === 'not-run')
    setBulk(true)
    pending.forEach((a, i) => timers.current.push(window.setTimeout(() => recordChecks(a.id), 400 * (i + 1))))
    timers.current.push(
      window.setTimeout(() => {
        setBulk(false)
        toast.success(`Scanned ${pending.length} assets`)
      }, 400 * (pending.length + 1)),
    )
  }

  const counts = {
    pass: queue.filter((a) => a.qaState === 'pass').length,
    warn: queue.filter((a) => a.qaState === 'warn').length,
    fail: queue.filter((a) => a.qaState === 'fail').length,
    pending: queue.filter((a) => a.qaState === 'not-run').length,
  }

  const rows: (CheckResult | null)[] = scanning
    ? CHECK_LABELS.map((_, i) => (i < scan.shown ? scan.results[i] : null))
    : (selected?.qa ?? CHECK_LABELS.map(() => null))
  const result = selected?.qa && !scanning ? overall(selected.qa) : null

  return (
    <div className="space-y-4">
      <PageHeader
        title="Automated Pre-Checks & QA"
        subtitle="Eight automated quality gates run on every asset before a person reviews it."
        actions={
          <Button variant="outline" disabled={!counts.pending || bulk} onClick={runAll}>
            {bulk ? <Loader2 className="animate-spin" /> : <ScanLine />} Scan all ({counts.pending})
          </Button>
        }
      />
      <Callout>Automated checks catch routine issues before approvers spend time.</Callout>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Passed', v: counts.pass, cls: 'text-emerald-500' },
          { label: 'Warnings', v: counts.warn, cls: 'text-amber-500' },
          { label: 'Failed', v: counts.fail, cls: 'text-red-500' },
          { label: 'Awaiting scan', v: counts.pending, cls: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card px-4 py-3">
            <div className={cn('text-2xl font-semibold tabular-nums', s.cls)}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {!queue.length ? (
        <EmptyState>
          <ShieldCheck className="mx-auto mb-2 size-5" />
          Nothing waiting for pre-checks. Send assets from the Content Studio.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[340px_1fr] gap-4">
          <div className="space-y-2">
            {queue.map((a) => {
              const b = briefById.get(a.briefId)!
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-colors hover:bg-accent/50',
                    selected?.id === a.id && 'border-primary/50 bg-accent/60',
                  )}
                >
                  <div className="w-16 shrink-0">
                    <AssetThumb asset={a} box="h-12" showCopy={false} className="p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground">{formats[a.format].label}</div>
                  </div>
                  {scan?.id === a.id ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <StateBadge state={a.qaState} />}
                </button>
              )
            })}
          </div>

          {selected && brief && (
            <div className="rounded-xl border bg-card">
              <div className="flex gap-5 border-b p-4">
                <div className="w-56 shrink-0">
                  <AssetThumb asset={selected} box="h-40" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <JourneyPill journey={selected.journey} />
                    <ToolBadge tool={selected.tool} />
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">v{selected.version}</span>
                  </div>
                  <div className="text-base font-semibold">{brief.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formats[selected.format].label} · {formats[selected.format].width}×{formats[selected.format].height}
                    {selected.qaAt && ` · last scanned ${fmtAgo(selected.qaAt)}`}
                  </div>
                  <div className="text-sm font-medium">“{selected.headlines[0]}”</div>
                  <div className="text-xs text-muted-foreground">{selected.body}</div>
                </div>
                <div>
                  <Button disabled={!!scanning} onClick={() => run(selected)}>
                    {scanning ? <Loader2 className="animate-spin" /> : <ScanLine />}
                    {scanning ? 'Scanning…' : selected.qa ? 'Re-run checks' : 'Run checks'}
                  </Button>
                </div>
              </div>

              <ul className="divide-y">
                {CHECK_LABELS.map((label, i) => {
                  const r = rows[i]
                  const active = scanning && i === scan.shown
                  return (
                    <li key={label} className={cn('flex items-center gap-3 px-4 py-2.5', r && 'fade-in')}>
                      {r ? ICON[r.status] : active ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <CircleDashed className="size-4 text-muted-foreground/50" />}
                      <span className="w-60 shrink-0 text-sm font-medium">{label}</span>
                      <span className="flex-1 text-xs text-muted-foreground">{r ? r.detail : active ? 'Checking…' : '—'}</span>
                      {r && <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase', BADGE[r.status])}>{r.status}</span>}
                    </li>
                  )
                })}
              </ul>

              {result === 'fail' && (
                <div className="m-4 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
                  <XCircle className="size-5 shrink-0 text-red-500" />
                  <div className="flex-1">
                    <div className="font-semibold">Blocked: {selected.qa!.find((c) => c.status === 'fail')!.detail}</div>
                    <div className="text-xs opacity-80">Caught automatically, so no approver time is spent on it.</div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      sendBack(selected.id)
                      toast('Sent back to creation with the issue attached')
                    }}
                  >
                    <Undo2 /> Send back to creation
                  </Button>
                </div>
              )}
              {(result === 'pass' || result === 'warn') && (
                <div
                  className={cn(
                    'm-4 flex items-center gap-3 rounded-lg border p-3 text-sm',
                    result === 'pass' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10',
                  )}
                >
                  {result === 'pass' ? <CheckCircle2 className="size-5 text-emerald-500" /> : <AlertTriangle className="size-5 text-amber-500" />}
                  <div className="flex-1">
                    <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">Ready for approval</span>
                    {result === 'warn' && <span className="ml-2 text-xs text-muted-foreground">1 warning will be shown to reviewers</span>}
                  </div>
                  <Button
                    onClick={() => {
                      submitForApproval([selected.id])
                      toast.success('Submitted to Brand, Business & Risk in parallel')
                    }}
                  >
                    <Send /> Submit for approval
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
