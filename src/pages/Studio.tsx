import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AssetThumb, Callout, ChannelIcon, EmptyState, JourneyPill, PageHeader, StatusBadge, ToolBadge } from '@/components/common'
import { channels, formatList, formats } from '@/data/formats'
import { PILOT_BRIEF_ID } from '@/data/briefs'
import type { Asset, Brief } from '@/data/types'
import { useScoped } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const STAGE_LABEL: Record<Asset['stage'], string> = {
  creation: 'In creation',
  qa: 'In pre-checks',
  approval: 'In approval',
  approved: 'Approved',
  published: 'Published',
}

export function AssetCard({ asset, brief }: { asset: Asset; brief: Brief }) {
  const regenerate = useStore((s) => s.regenerate)
  const sendToQa = useStore((s) => s.sendToQa)
  const [busy, setBusy] = useState(false)
  const f = formats[asset.format]
  const returned = asset.stage === 'creation' && (asset.qaState === 'fail' || asset.qaState === 'warn')
  const failed = asset.qa?.find((c) => c.status !== 'pass')
  const editable = asset.stage === 'creation' || asset.stage === 'qa'

  return (
    <div className={cn('lift flex flex-col rounded-xl border bg-card', returned && 'border-red-500/40')}>
      <div className="relative">
        <AssetThumb asset={asset} className={cn('rounded-b-none transition-opacity', busy && 'opacity-30')} />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-medium">
            <Loader2 className="size-4 animate-spin" /> {asset.tool} is generating…
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{brief.name}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ChannelIcon channel={asset.channel} className="size-3" /> {f.label} · {f.width}×{f.height}
            </div>
          </div>
          <JourneyPill journey={asset.journey} />
        </div>
        {returned && failed && (
          <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] text-red-700 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" /> Returned from pre-checks: {failed.detail}. Regenerate to fix.
          </div>
        )}
        <ol className="space-y-1 text-xs">
          {asset.headlines.map((h, i) => (
            <li key={h + i} className={cn('flex gap-1.5', i > 0 && 'text-muted-foreground')}>
              <span className="w-3 shrink-0 text-muted-foreground/60 tabular-nums">{i + 1}</span>
              <span className={cn(i === 0 && 'font-medium')}>{h}</span>
            </li>
          ))}
        </ol>
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">v{asset.version}</span>
          <ToolBadge tool={asset.tool} />
          <StatusBadge status={STAGE_LABEL[asset.stage]} className="ml-auto bg-muted text-muted-foreground" />
        </div>
        {editable && (
          <div className="flex gap-2 border-t pt-2.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                setTimeout(() => {
                  regenerate(asset.id)
                  setBusy(false)
                }, 1500)
              }}
            >
              <RefreshCw className={cn(busy && 'animate-spin')} /> Regenerate
            </Button>
            {asset.stage === 'creation' && (
              <Button
                size="sm"
                className="flex-1"
                disabled={busy}
                onClick={() => {
                  sendToQa([asset.id])
                  toast.success('Sent to automated pre-checks')
                }}
              >
                <ShieldCheck /> Pre-check
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AdaptCluster({ brief, assets }: { brief: Brief; assets: Asset[] }) {
  const n = assets.length
  const pts = assets.map((_, i) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180
    return { x: 50 + 37 * Math.cos(a), y: 50 + 33 * Math.sin(a) }
  })
  return (
    <div className="rounded-xl border bg-card/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Create once, adapt many</div>
        <div className="text-xs text-muted-foreground">
          1 master message → {n} channel adaptations · different dimensions, copy lengths and CTAs
        </div>
      </div>
      <div className="relative h-[600px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {pts.map((p, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke={brief.journey === 'rental' ? '#14b8a6' : '#a855f7'}
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            >
              <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />
            </line>
          ))}
        </svg>
        <div
          className={cn(
            'absolute top-1/2 left-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 bg-card p-4 text-center shadow-xl',
            brief.journey === 'rental' ? 'border-teal-500/60' : 'border-purple-500/60',
          )}
        >
          <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Master copy · approved brief</div>
          <div className="mt-2 text-base leading-snug font-semibold">“{brief.masterHeadline}”</div>
          <div className="mt-2 text-xs text-muted-foreground">{brief.keyMessages.join(' · ')}</div>
          <div className="mt-3">
            <JourneyPill journey={brief.journey} />
          </div>
        </div>
        {assets.map((a, i) => {
          const f = formats[a.format]
          return (
            <div
              key={a.id}
              className="fade-in absolute w-52 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-2 shadow-md"
              style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%`, animationDelay: `${i * 80}ms` }}
            >
              <AssetThumb asset={a} box="h-20" showCopy={false} className="p-1" />
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium">
                <ChannelIcon channel={a.channel} className="size-3" /> {f.short}
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {f.width}×{f.height}
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-snug">{a.headlines[0]}</div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{a.headlines[0].length} chars</span>
                <span className="rounded bg-muted px-1">CTA: {a.cta}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Studio() {
  const { assets, briefs, briefById } = useScoped()
  const pilot = useStore((s) => s.pilot)
  const sendToQa = useStore((s) => s.sendToQa)
  const [params] = useSearchParams()
  const [campaign, setCampaign] = useState(params.get('brief') ?? 'all')
  const [journey, setJourney] = useState('all')
  const [channel, setChannel] = useState('all')
  const [format, setFormat] = useState('all')
  const [stage, setStage] = useState(params.get('brief') ? 'all' : 'studio')

  useEffect(() => {
    if (pilot) setCampaign(PILOT_BRIEF_ID)
  }, [pilot])

  const filtered = useMemo(
    () =>
      assets.filter(
        (a) =>
          (campaign === 'all' || a.briefId === campaign) &&
          (journey === 'all' || a.journey === journey) &&
          (channel === 'all' || a.channel === channel) &&
          (format === 'all' || a.format === format) &&
          (stage === 'all' || (stage === 'studio' ? a.stage === 'creation' || a.stage === 'qa' : a.stage === stage)),
      ),
    [assets, campaign, journey, channel, format, stage],
  )

  const selectedBrief = campaign !== 'all' ? briefById.get(campaign) : undefined
  const clusterAssets = selectedBrief ? assets.filter((a) => a.briefId === selectedBrief.id) : []
  const inCreation = filtered.filter((a) => a.stage === 'creation')
  const withAssets = briefs.filter((b) => assets.some((a) => a.briefId === b.id))

  const filters = [
    { value: campaign, set: setCampaign, label: 'Campaign', options: [['all', 'All campaigns'], ...withAssets.map((b) => [b.id, b.name])] },
    { value: journey, set: setJourney, label: 'Journey', options: [['all', 'All journeys'], ['rental', 'Rental'], ['shared', 'Shared Ownership']] },
    { value: channel, set: setChannel, label: 'Channel', options: [['all', 'All channels'], ...channels.map((c) => [c.id, c.label])] },
    { value: format, set: setFormat, label: 'Format', options: [['all', 'All formats'], ...formatList.map((f) => [f.id, f.label])] },
    {
      value: stage,
      set: setStage,
      label: 'Stage',
      options: [['studio', 'In studio (creation & checks)'], ['all', 'All stages'], ...Object.entries(STAGE_LABEL)],
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI-Assisted Content & Asset Creation"
        subtitle="Specialist tools generate every channel adaptation from the approved brief. Designers choose, refine and send on."
        actions={
          inCreation.length > 0 && (
            <Button
              onClick={() => {
                sendToQa(inCreation.map((a) => a.id))
                toast.success(`${inCreation.length} assets sent to automated pre-checks`)
              }}
            >
              <ShieldCheck /> Send {inCreation.length} to pre-checks
            </Button>
          )
        }
      />
      <Callout>Specialist AI design tools produce near-final, brand-consistent assets that need minimal editing.</Callout>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2.5">
        {filters.map((f) => (
          <Select key={f.label} value={f.value} onValueChange={f.set}>
            <SelectTrigger size="sm" className="min-w-36">
              <span className="text-muted-foreground">{f.label}:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {f.options.map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <span className="ml-auto pr-2 text-xs text-muted-foreground">{filtered.length} assets</span>
      </div>

      {selectedBrief && clusterAssets.length > 0 && <AdaptCluster brief={selectedBrief} assets={clusterAssets} />}

      {filtered.length ? (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((a) => (
            <AssetCard key={a.id} asset={a} brief={briefById.get(a.briefId)!} />
          ))}
        </div>
      ) : (
        <EmptyState>
          <Sparkles className="mx-auto mb-2 size-5" />
          No assets match these filters.
        </EmptyState>
      )}
    </div>
  )
}
