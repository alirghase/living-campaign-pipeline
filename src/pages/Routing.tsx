import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Callout, ChannelIcons, JourneyPill, MemberAvatar, PageHeader, PriorityBadge, SlaTimer, StatusBadge } from '@/components/common'
import { journeyPresets } from '@/data/journeys'
import { member } from '@/data/team'
import type { Brief, Journey } from '@/data/types'
import { briefStatus, useScoped } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const ACTIVE = ['Routed', 'In Production', 'In Review', 'Approved']

function BriefCard({ brief, status }: { brief: Brief; status: string }) {
  const generateAssets = useStore((s) => s.generateAssets)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const n = brief.formats.length

  return (
    <div className="lift rounded-lg border bg-card p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{brief.name}</div>
          <div className="text-xs text-muted-foreground">{brief.development}</div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ChannelIcons channels={brief.channels} />
        <PriorityBadge priority={brief.priority} />
        <SlaTimer due={brief.deadline} label="to deadline" className="ml-auto" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MemberAvatar id={brief.ownerId} size="xs" /> {member(brief.ownerId).name}
        </span>
        {status === 'Routed' ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => {
                const count = generateAssets(brief.id)
                toast.success(`1 brief → ${count} channel assets`, { description: brief.name })
                navigate(`/studio?brief=${brief.id}`)
              }, 1400)
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? `Generating ${n} assets…` : `Generate ${n} assets`}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => navigate(`/studio?brief=${brief.id}`)}>
            View assets <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  )
}

function Queue({ journey, briefs }: { journey: Journey; briefs: { brief: Brief; status: string }[] }) {
  const preset = journeyPresets[journey]
  const owner = member(preset.ownerId)
  const routed = briefs.filter((b) => b.status === 'Routed').length
  return (
    <div className={cn('rounded-xl border p-4', journey === 'rental' ? 'border-teal-500/25 bg-teal-500/4' : 'border-purple-500/25 bg-purple-500/4')}>
      <div className="flex items-center gap-2">
        <JourneyPill journey={journey} className="text-xs" />
        <span className="rounded-full bg-muted px-2 text-xs font-semibold tabular-nums">{briefs.length}</span>
        {routed > 0 && <span className="text-xs text-muted-foreground">{routed} ready to generate</span>}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <MemberAvatar id={owner.id} size="xs" /> {owner.name}, {owner.role}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border bg-card/60 p-3 text-xs">
        <div>
          <div className="mb-1 font-semibold">Proposition content</div>
          <p className="text-muted-foreground">{preset.proposition}</p>
        </div>
        <div>
          <div className="mb-1 font-semibold">Templates</div>
          <ul className="space-y-0.5 text-muted-foreground">
            {preset.templates.map((t) => (
              <li key={t}>✓ {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-semibold">Tone guidelines</div>
          <ul className="space-y-0.5 text-muted-foreground">
            {preset.toneGuidance.slice(0, 3).map((t) => (
              <li key={t}>✓ {t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {briefs.map(({ brief, status }) => (
          <BriefCard key={brief.id} brief={brief} status={status} />
        ))}
        {!briefs.length && <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Queue empty</div>}
      </div>
    </div>
  )
}

export default function Routing() {
  const { briefs, allAssets } = useScoped()
  const withStatus = briefs
    .map((brief) => ({ brief, status: briefStatus(brief, allAssets) }))
    .filter((b) => ACTIVE.includes(b.status))
    .sort((a, b) => ACTIVE.indexOf(a.status) - ACTIVE.indexOf(b.status))

  return (
    <div className="space-y-4">
      <PageHeader title="Journey Routing" subtitle="Submitted briefs are routed automatically by journey. Each queue applies its own propositions, templates and tone." />
      <Callout>Same workflow, separate propositions — journey-specific content and templates are maintained independently.</Callout>
      <div className="grid grid-cols-2 gap-5">
        <Queue journey="rental" briefs={withStatus.filter((b) => b.brief.journey === 'rental')} />
        <Queue journey="shared" briefs={withStatus.filter((b) => b.brief.journey === 'shared')} />
      </div>
    </div>
  )
}
