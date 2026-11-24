import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, FileUp, Images, LayoutGrid, Loader2, Newspaper, Play, RotateCcw, Send, Settings2, Sparkles, Square, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChannelIcons, JourneyPill, MemberAvatar, Segmented } from '@/components/common'
import { AgentRail, AGENT_ICON, AGENT_TINT } from '@/components/agent/AgentRail'
import { AiSettingsDialog, AiStatusChip } from '@/components/agent/AiSettingsDialog'
import { CreativeCard } from '@/components/agent/CreativeCard'
import { KeyVisual } from '@/components/agent/KeyVisual'
import { Trace } from '@/components/agent/Trace'
import { REVIEWER } from '@/data/team'
import { AGENTS } from '@/ai/agents'
import { EXAMPLES } from '@/ai/examples'
import { useRun } from '@/ai/runStore'
import { isLive, useAiSettings } from '@/ai/settings'
import { cn } from '@/lib/utils'

function useTicker(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [active])
  return now
}

function Hero({ children }: { children?: ReactNode }) {
  const settings = useAiSettings()
  const live = isLive(settings)
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-700 text-white">
      <svg className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] md:block" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden>
        <path d="M160 0C90 90 230 170 130 260C70 315 120 360 90 400H600V0Z" fill="#11b67a" />
        <path d="M160 0C90 90 230 170 130 260C70 315 120 360 90 400H112C142 360 92 315 152 260C252 170 112 90 182 0Z" fill="#6cf579" />
        <path d="M260 0C210 80 330 160 260 250C220 300 260 360 240 400H600V0Z" fill="#c8ffc5" opacity=".22" />
      </svg>
      <div className="relative flex flex-col gap-6 p-7 lg:flex-row lg:items-end lg:p-9">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-lime ring-1 ring-white/15">
              <Sparkles className="size-3.5" /> Campaign Agent · built on Google Gemini
            </span>
            <span className="inline-block -rotate-2 rounded-lg bg-[#11b67a] px-2.5 py-1 text-xs font-extrabold text-[#000d04] shadow-md">Built for life&rsquo;s next chapter.</span>
          </div>
          <h1 className="text-3xl leading-[1.02] font-extrabold tracking-tight text-balance lg:text-[2.8rem]">One brief in. A whole campaign out.</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
            Six specialist agents structure the brief, route it, write the copy, art-direct, generate the photography and check every asset against brand and compliance.{' '}
            <span className="font-semibold text-white">People make every decision that matters.</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
          <AiStatusChip className={cn(live ? 'bg-black/25 text-lime ring-white/20' : 'bg-black/25 text-amber-200 ring-amber-300/30')} />
          {live && <span className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[11px] text-white/80">{settings.imageModel}</span>}
          <AiSettingsDialog>
            <Button size="lg" className="bg-black text-white shadow-[0_0_0_3px_#6cf579] hover:bg-black/85">
              <Settings2 /> {live ? 'AI settings' : 'Connect Google AI Studio'}
            </Button>
          </AiSettingsDialog>
          {children}
        </div>
      </div>
    </section>
  )
}

function Lineup() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-4 text-sm font-semibold">The agent team</div>
      <ol className="relative space-y-3.5 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-border">
        {AGENTS.map((a) => {
          const Icon = AGENT_ICON[a.id]
          return (
            <li key={a.id} className="relative flex gap-3">
              <span className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg ring-4 ring-card', AGENT_TINT[a.id])}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  {a.name}
                  <span className={cn('rounded px-1.5 py-px text-[9px] font-semibold tracking-wide uppercase', a.engine === 'people' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>
                    {a.engine === 'people' ? 'People decide' : a.engine === 'image' ? 'Gemini image' : a.engine === 'vision' ? 'Gemini vision + rules' : 'Gemini'}
                  </span>
                </div>
                <div className="text-xs leading-snug text-muted-foreground">{a.role}</div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function BriefPicker({ onRun }: { onRun: (text: string, exampleId?: string) => void }) {
  const [exampleId, setExampleId] = useState<string | undefined>(EXAMPLES[0].id)
  const [text, setText] = useState(EXAMPLES[0].text)
  const ex = EXAMPLES.find((e) => e.id === exampleId)
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-8">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">1. Pick a brief, or write your own</h2>
            <span className="text-xs text-muted-foreground">Grounded in public Lloyds Living news</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setExampleId(e.id)
                  setText(e.text)
                }}
                className={cn(
                  'lift group flex flex-col gap-2 rounded-2xl border bg-card p-4 text-left',
                  exampleId === e.id ? 'border-brand-500 ring-2 ring-brand-500/25' : 'hover:border-brand-500/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <JourneyPill journey={e.journey} />
                  <ChannelIcons channels={e.channels} />
                </div>
                <div className="text-[15px] leading-tight font-semibold">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.development}</div>
                <div className="mt-auto flex items-start gap-1.5 border-t pt-2 text-[11px] leading-snug text-muted-foreground">
                  <Newspaper className="mt-px size-3 shrink-0" />
                  {e.source}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">2. The request, as a marketer would type it</h2>
            {ex && <JourneyPill journey={ex.journey} />}
          </div>
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (ex && e.target.value !== ex.text) setExampleId(undefined)
            }}
            rows={6}
            className="resize-y text-[14px] leading-relaxed"
            placeholder="Describe the campaign: development, audience, goal, tone and channels…"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-xs text-muted-foreground">No forms. The Brief Strategist turns this into a structured brief, and everything downstream is generated and checked from it.</p>
            <Button size="lg" className="h-11 px-5 text-[15px]" disabled={text.trim().length < 20} onClick={() => onRun(text, exampleId)}>
              <Play className="fill-current" /> 3. Run the agent team
            </Button>
          </div>
        </div>
      </div>
      <div className="xl:col-span-4">
        <Lineup />
      </div>
    </div>
  )
}

function Panel({ title, icon, children, className }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('fade-in rounded-2xl border bg-card p-4 shadow-soft', className)}>
      <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function Skel() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  )
}

function RunView() {
  const navigate = useNavigate()
  const { run, cancel, clear, handoff, exportRun } = useRun()
  const [view, setView] = useState<'creative' | 'channel'>('creative')
  const now = useTicker(run?.status === 'running')
  if (!run) return null
  const running = run.status === 'running'
  const locked = run.status !== 'review'
  const elapsed = Math.max(0, ((run.endedAt ?? now) - run.startedAt) / 1000)
  const cleared = run.creatives.filter((c) => c.status === 'ready' && c.qaState !== 'fail').length
  const warnings = run.creatives.filter((c) => c.qaState === 'warn').length

  const send = () => {
    const id = handoff()
    if (!id) return
    toast.success(`${run.creatives.length} assets sent to Brand, Business & Risk`, { description: 'All three review in parallel. Open Approvals to decide.' })
    navigate('/approvals')
  }

  const stats: [string, string][] = [
    ['Elapsed', `${elapsed.toFixed(1)}s`],
    ['Model calls', run.mode === 'live' ? String(run.stats.calls) : '—'],
    ['Images', run.mode === 'live' ? String(run.stats.images) : 'illustrated'],
    ['Tokens', run.mode === 'live' ? run.stats.tokens.toLocaleString('en-GB') : '—'],
    ['Self-repairs', String(run.stats.fixes)],
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-3 shadow-soft">
        <AgentRail steps={run.steps} now={now} />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted/70 px-4 py-2.5 text-xs">
        <span className={cn('inline-flex items-center gap-1.5 font-semibold', run.mode === 'live' ? 'text-brand-700 dark:text-brand-300' : 'text-amber-800 dark:text-amber-300')}>
          <span className={cn('size-1.5 rounded-full', run.mode === 'live' ? 'bg-brand-500' : 'bg-amber-500', running && 'animate-pulse')} />
          {run.mode === 'live' ? `Live · ${run.models.text} + ${run.models.image}` : 'Demo mode · offline outputs'}
        </span>
        {stats.map(([k, v]) => (
          <span key={k} className="text-muted-foreground">
            {k} <span className="font-mono font-semibold text-foreground tabular-nums">{v}</span>
          </span>
        ))}
        <div className="ml-auto flex gap-2">
          {running ? (
            <Button size="sm" variant="outline" onClick={cancel}>
              <Square className="fill-current" /> Stop
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={exportRun} title="Save this run (with images) to replay offline">
                <Download /> Save run
              </Button>
              <Button size="sm" variant="outline" onClick={clear}>
                <RotateCcw /> New brief
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="min-w-0 space-y-5 xl:col-span-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Structured brief" icon={<AgentIconSmall id="strategist" />}>
              {run.brief ? (
                <div className="space-y-2 text-[13px]">
                  <div className="text-[15px] leading-tight font-semibold">{run.brief.name}</div>
                  <div className="text-xs text-muted-foreground">{run.brief.development}</div>
                  <p className="leading-snug">{run.brief.objective}</p>
                  <ul className="space-y-0.5 text-xs">
                    {run.brief.keyMessages.map((m) => (
                      <li key={m} className="flex gap-1.5">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-500" />
                        {m}
                      </li>
                    ))}
                  </ul>
                  <p className="border-t pt-2 text-xs text-muted-foreground italic">Insight: {run.brief.insight}</p>
                </div>
              ) : (
                <Skel />
              )}
            </Panel>
            <Panel title="Routing decision" icon={<AgentIconSmall id="router" />}>
              {run.routing ? (
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex items-center justify-between">
                    <JourneyPill journey={run.routing.journey} className="text-xs" />
                    <span className="font-mono text-xs">{Math.round(run.routing.confidence * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', run.routing.journey === 'rental' ? 'bg-rental-500' : 'bg-shared-500')} style={{ width: `${run.routing.confidence * 100}%` }} />
                  </div>
                  <p className="leading-snug">{run.routing.rationale}</p>
                  <div className="flex flex-wrap gap-1">
                    {run.routing.signals.map((s) => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <span>
                      {run.routing.formats.length} formats · {run.routing.slaHours}h SLA
                    </span>
                    <span className="flex -space-x-1">
                      {Object.values(REVIEWER).map((id) => (
                        <MemberAvatar key={id} id={id} size="xs" />
                      ))}
                    </span>
                  </div>
                </div>
              ) : (
                <Skel />
              )}
            </Panel>
            <Panel title="Creative concept" icon={<AgentIconSmall id="artdirector" />}>
              {run.art ? (
                <KeyVisual run={run} />
              ) : (
                <Skel />
              )}
            </Panel>
          </div>

          {run.creatives.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  {run.creatives.length} channel assets <span className="font-normal text-muted-foreground">from one key visual</span>
                </h2>
                <Segmented
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'creative', label: <span className="inline-flex items-center gap-1"><Images className="size-3.5" />Creative</span> },
                    { value: 'channel', label: <span className="inline-flex items-center gap-1"><LayoutGrid className="size-3.5" />In channel</span> },
                  ]}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {run.creatives.map((c) => (
                  <CreativeCard key={c.format} c={c} journey={run.routing!.journey} seed={run.id} view={view} locked={locked} location={run.brief?.development} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-4">
          <div className="sticky top-20 flex h-[calc(100vh-7rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <span className="text-sm font-semibold">Agent trace</span>
              {running && <Loader2 className="size-3.5 animate-spin text-brand-500" />}
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">{run.trace.length} events</span>
            </div>
            <div className="min-h-0 flex-1">
              <Trace events={run.trace} t0={run.startedAt} running={running} />
            </div>
          </div>
        </div>
      </div>

      {(run.status === 'review' || run.status === 'handed-off') && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-4 rounded-2xl bg-brand-900 px-5 py-4 text-white shadow-2xl">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <Users className="size-5 text-lime" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {run.status === 'handed-off' ? 'Sent to Brand, Business & Risk' : `${cleared} of ${run.creatives.length} assets cleared by the QA agent${warnings ? `, ${warnings} with warnings` : ''}`}
            </div>
            <div className="text-sm text-white/70">
              {run.status === 'handed-off' ? 'All three review at the same time, not one after another.' : 'Your call now. Pick headlines, direct the visuals, then send for parallel approval.'}
            </div>
          </div>
          {run.status === 'handed-off' ? (
            <Button size="lg" className="bg-lime text-brand-950 hover:bg-lime/90" onClick={() => navigate('/approvals')}>
              Open Approvals <ArrowRight />
            </Button>
          ) : (
            <Button size="lg" className="h-11 bg-lime px-5 text-[15px] text-brand-950 hover:bg-lime/90" onClick={send}>
              <Send /> Send {run.creatives.length} to approvers
            </Button>
          )}
        </div>
      )}
      {run.status === 'error' && <div className="rounded-xl border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">The run stopped: {run.error}</div>}
    </div>
  )
}

function AgentIconSmall({ id }: { id: keyof typeof AGENT_ICON }) {
  const Icon = AGENT_ICON[id]
  return (
    <span className={cn('flex size-5 items-center justify-center rounded-md', AGENT_TINT[id])}>
      <Icon className="size-3" />
    </span>
  )
}

export default function Agent() {
  const { run, start, importRun } = useRun()
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-6">
      <Hero>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              await importRun(file)
              toast.success('Saved run loaded')
            } catch (err) {
              toast.error((err as Error).message)
            }
          }}
        />
        <Button size="lg" variant="ghost" className="bg-black/20 text-white hover:bg-black/30 hover:text-white" onClick={() => fileRef.current?.click()} title="Load a run saved earlier">
          <FileUp /> Load saved run
        </Button>
      </Hero>
      {run ? <RunView /> : <BriefPicker onRun={(text, id) => void start(text, id)} />}
    </div>
  )
}

