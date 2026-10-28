import { CheckSquare, Square } from 'lucide-react'
import { channels, formats } from '@/data/formats'
import type { Brief } from '@/data/types'
import { member } from '@/data/team'
import { fmtDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { ChannelIcon, JourneyPill, PriorityBadge } from './common'

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export function BriefDetail({ brief, compact }: { brief: Brief; compact?: boolean }) {
  return (
    <div className={cn('space-y-4', compact && 'space-y-3 text-sm')}>
      <div className="flex flex-wrap items-center gap-2">
        <JourneyPill journey={brief.journey} />
        <PriorityBadge priority={brief.priority} />
        <span className="text-xs text-muted-foreground">
          {brief.development} · Owner {member(brief.ownerId).name} · Due {fmtDate(brief.deadline)}
        </span>
      </div>
      <Field label="Objective">{brief.objective}</Field>
      <Field label="Target audience">{brief.audience}</Field>
      {!compact && <Field label="Journey context">{brief.journeyContext}</Field>}
      <Field label="Master message">
        <span className="font-medium">“{brief.masterHeadline}”</span>
      </Field>
      <Field label="Key messages">
        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground marker:text-foreground/40">
          {brief.keyMessages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Field>
      <Field label="Tone of voice">{brief.tone}</Field>
      {!compact && (
        <>
          <Field label="Required formats">
            <div className="flex flex-wrap gap-1.5">
              {brief.formats.map((f) => (
                <span key={f} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">
                  {formats[f].short} {formats[f].width}×{formats[f].height}
                </span>
              ))}
            </div>
          </Field>
          <Field label="Brand constraints">
            <ul className="list-inside list-disc space-y-0.5 text-muted-foreground marker:text-foreground/40">
              {brief.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Field>
          <Field label="Channels to generate">
            <div className="grid grid-cols-2 gap-1.5">
              {channels.map((c) => {
                const on = brief.channels.includes(c.id)
                return (
                  <div key={c.id} className={cn('flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs', !on && 'opacity-40')}>
                    {on ? <CheckSquare className="size-3.5 text-primary" /> : <Square className="size-3.5" />}
                    <ChannelIcon channel={c.id} className="size-3.5" />
                    {c.label}
                  </div>
                )
              })}
            </div>
          </Field>
        </>
      )}
    </div>
  )
}
