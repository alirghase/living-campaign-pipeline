import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, ChevronRight, CircleCheck, Lightbulb, Play, Terminal, XCircle } from 'lucide-react'
import { agentDef, type TraceEvent } from '@/ai/agents'
import { cn } from '@/lib/utils'
import { AGENT_ICON, AGENT_TINT } from './AgentRail'

const KIND: Record<TraceEvent['kind'], { icon: typeof Play; cls: string }> = {
  start: { icon: Play, cls: 'text-muted-foreground' },
  thought: { icon: Lightbulb, cls: 'text-foreground/80 italic' },
  tool: { icon: Terminal, cls: 'font-mono text-[11px] text-shared-700 dark:text-shared-300' },
  result: { icon: CircleCheck, cls: 'text-foreground' },
  warn: { icon: AlertTriangle, cls: 'text-amber-700 dark:text-amber-300' },
  handoff: { icon: ArrowRight, cls: 'font-medium text-brand-700 dark:text-brand-300' },
  done: { icon: CircleCheck, cls: 'font-medium text-brand-700 dark:text-brand-300' },
  error: { icon: XCircle, cls: 'text-destructive' },
}

function Row({ e, t0, prevAgent }: { e: TraceEvent; t0: number; prevAgent?: string }) {
  const [open, setOpen] = useState(false)
  const K = KIND[e.kind]
  const AgentIcon = AGENT_ICON[e.agent]
  const newAgent = prevAgent !== e.agent
  return (
    <li className={cn('fade-in', newAgent && 'mt-2.5 first:mt-0')}>
      {newAgent && (
        <div className="mb-1 flex items-center gap-1.5">
          <span className={cn('flex size-5 items-center justify-center rounded-md', AGENT_TINT[e.agent])}>
            <AgentIcon className="size-3" />
          </span>
          <span className="text-[11px] font-semibold">{agentDef(e.agent).name}</span>
        </div>
      )}
      <div className="group flex items-start gap-2 pl-1.5">
        <K.icon className={cn('mt-0.5 size-3 shrink-0', K.cls.includes('text-') ? K.cls.split(' ').find((c) => c.startsWith('text-')) : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            disabled={!e.detail}
            onClick={() => setOpen((o) => !o)}
            className={cn('flex w-full items-start gap-1 text-left text-xs leading-snug break-words', K.cls, e.detail && 'hover:underline')}
          >
            <span className="min-w-0 flex-1">{e.text}</span>
            {e.detail && <ChevronRight className={cn('mt-0.5 size-3 shrink-0 transition-transform', open && 'rotate-90')} />}
          </button>
          {open && e.detail && (
            <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{e.detail}</pre>
          )}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">+{((e.at - t0) / 1000).toFixed(1)}s</span>
      </div>
    </li>
  )
}

export function Trace({ events, t0, running }: { events: TraceEvent[]; t0: number; running: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  useEffect(() => {
    const el = ref.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [events.length])
  return (
    <div
      ref={ref}
      onScroll={(ev) => {
        const el = ev.currentTarget
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      }}
      className="h-full overflow-y-auto px-4 py-3"
    >
      <ol>
        {events.map((e, i) => (
          <Row key={e.id} e={e} t0={t0} prevAgent={events[i - 1]?.agent} />
        ))}
      </ol>
      {running && <div className="caret mt-2 pl-1.5 text-xs text-muted-foreground">thinking</div>}
    </div>
  )
}
