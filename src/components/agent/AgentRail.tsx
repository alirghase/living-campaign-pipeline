import { Check, ClipboardList, Image as ImageIcon, Loader2, Palette, PenLine, Route, ShieldCheck, Users, X, type LucideIcon } from 'lucide-react'
import { agentDef, type AgentId, type AgentStep } from '@/ai/agents'
import { cn } from '@/lib/utils'

export const AGENT_ICON: Record<AgentId, LucideIcon> = {
  strategist: ClipboardList,
  router: Route,
  copywriter: PenLine,
  artdirector: Palette,
  imager: ImageIcon,
  qa: ShieldCheck,
  human: Users,
}

export const AGENT_TINT: Record<AgentId, string> = {
  strategist: 'text-brand-700 bg-brand-500/12 dark:text-brand-300',
  router: 'text-shared-700 bg-shared-500/12 dark:text-shared-300',
  copywriter: 'text-rental-700 bg-rental-500/15 dark:text-rental-300',
  artdirector: 'text-orange-700 bg-orange-500/12 dark:text-orange-300',
  imager: 'text-fuchsia-700 bg-fuchsia-500/12 dark:text-fuchsia-300',
  qa: 'text-amber-800 bg-amber-500/15 dark:text-amber-300',
  human: 'text-foreground bg-foreground/8',
}

const fmtMs = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`)

function Node({ id, step, now }: { id: AgentId; step: AgentStep; now: number }) {
  const def = agentDef(id)
  const Icon = AGENT_ICON[id]
  const running = step.status === 'running'
  const elapsed = step.startedAt ? Math.max(0, (step.endedAt ?? now) - step.startedAt) : 0
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-1 items-start gap-2.5 rounded-xl border bg-card p-3 transition-all lg:self-center',
        running && 'border-lime/70 shadow-[0_0_0_3px_rgb(108_245_121/0.25)]',
        step.status === 'done' && 'border-brand-500/30',
        step.status === 'error' && 'border-destructive/50',
        step.status === 'idle' && 'opacity-60',
      )}
    >
      <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-lg', AGENT_TINT[id], running && 'agent-pulse')}>
        <Icon className="size-4" />
        {step.status === 'done' && (
          <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-card">
            <Check className="size-2.5" strokeWidth={3} />
          </span>
        )}
        {step.status === 'error' && (
          <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-white ring-2 ring-card">
            <X className="size-2.5" strokeWidth={3} />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] leading-tight font-semibold">{def.name}</span>
          {running && id !== 'human' && <Loader2 className="size-3 shrink-0 animate-spin text-brand-500" />}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {step.summary ?? (running ? (id === 'human' ? 'Waiting for your decision' : 'Working…') : step.status === 'idle' ? def.role : '')}
        </div>
        {elapsed > 0 && <div className="mt-1 font-mono text-[10px] text-muted-foreground tabular-nums">{fmtMs(elapsed)}</div>}
      </div>
    </div>
  )
}

function Link({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="relative hidden w-5 shrink-0 self-center lg:block">
      <div className={cn('h-0.5 w-full rounded', done ? 'bg-brand-500' : 'bg-border')} />
      {active && <div className="absolute inset-0 h-0.5 animate-pulse rounded bg-lime" />}
    </div>
  )
}

export function AgentRail({ steps, now }: { steps: Record<AgentId, AgentStep>; now: number }) {
  const done = (id: AgentId) => steps[id].status === 'done'
  const running = (id: AgentId) => steps[id].status === 'running'
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      <Node id="strategist" step={steps.strategist} now={now} />
      <Link done={done('strategist')} active={running('router')} />
      <Node id="router" step={steps.router} now={now} />
      <Link done={done('router')} active={running('copywriter') || running('artdirector')} />
      <div className="flex min-w-0 flex-[1.15] flex-col justify-center gap-2 [&>div]:lg:self-stretch">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          <span className="h-px flex-1 bg-border" /> In parallel <span className="h-px flex-1 bg-border" />
        </div>
        <Node id="copywriter" step={steps.copywriter} now={now} />
        <Node id="artdirector" step={steps.artdirector} now={now} />
      </div>
      <Link done={done('artdirector') && done('copywriter')} active={running('imager')} />
      <Node id="imager" step={steps.imager} now={now} />
      <Link done={done('imager')} active={running('qa')} />
      <Node id="qa" step={steps.qa} now={now} />
      <Link done={done('qa')} active={running('human')} />
      <Node id="human" step={steps.human} now={now} />
    </div>
  )
}
