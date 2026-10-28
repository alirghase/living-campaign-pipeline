import { useState } from 'react'
import { Pause, Play, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssetThumb, ChannelIcon, EmptyState, JourneyPill, PageHeader, StatusBadge } from '@/components/common'
import { PublishDialog } from '@/components/PublishDialog'
import { channels, formats } from '@/data/formats'
import type { Asset } from '@/data/types'
import { useScoped } from '@/lib/selectors'
import { fmtAgo, fmtDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const SOCIAL = ['facebook', 'instagram', 'linkedin']

function engagement(a: Asset) {
  let h = 0
  for (const c of a.id) h = (h * 33 + c.charCodeAt(0)) >>> 0
  const hours = Math.max(1, (Date.now() - (a.publishedAt ?? Date.now())) / 3_600_000)
  const impressions = Math.round(Math.min(hours, 240) * (120 + (h % 180)))
  return { impressions, clicks: Math.round(impressions * (0.011 + (h % 9) / 1000)) }
}

export default function Delivery() {
  const { assets, briefById } = useScoped()
  const toggleDelivery = useStore((s) => s.toggleDelivery)
  const [publishing, setPublishing] = useState<Asset[] | null>(null)
  const ready = assets.filter((a) => a.stage === 'approved')
  const delivered = assets
    .filter((a) => a.stage === 'published')
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
  const social = delivered.filter((a) => SOCIAL.includes(a.channel))
  const queued = social.filter((a) => a.deliveryStatus === 'Scheduled').sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0))
  const posted = social.filter((a) => a.deliveryStatus !== 'Scheduled').slice(0, 8)

  return (
    <div className="space-y-4">
      <PageHeader title="Channel Delivery & Auto-Publish" subtitle="Approved assets go out to each channel automatically. People can pause anything at any time." />

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold">Ready to publish</span>
          <span className="rounded-full bg-muted px-2 text-xs tabular-nums">{ready.length}</span>
          {ready.length > 0 && (
            <Button size="sm" className="ml-auto" onClick={() => setPublishing(ready)}>
              <Rocket /> Publish all ready
            </Button>
          )}
        </div>
        {ready.length ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {ready.map((a) => (
              <div key={a.id} className="w-48 shrink-0 rounded-lg border p-2">
                <AssetThumb asset={a} box="h-20" showCopy={false} className="p-1" />
                <div className="mt-1.5 truncate text-xs font-medium">{briefById.get(a.briefId)!.name}</div>
                <div className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ChannelIcon channel={a.channel} className="size-3" /> {formats[a.format].short}
                </div>
                <Button size="xs" className="w-full" onClick={() => setPublishing([a])}>
                  <Rocket /> Publish
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nothing waiting. Approved assets appear here.</p>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
        {channels.map((c) => {
          const list = delivered.filter((a) => a.channel === c.id)
          return (
            <div key={c.id} className="rounded-xl bg-muted/40 p-2">
              <div className="mb-2 flex items-center gap-2 px-1.5 pt-1 text-xs font-semibold">
                <ChannelIcon channel={c.id} />
                {c.label}
                <span className="ml-auto rounded-full bg-background px-1.5 text-[10px] tabular-nums">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((a) => (
                  <div key={a.id} className={cn('rounded-lg border bg-card p-2', a.deliveryStatus === 'Paused' && 'opacity-60')}>
                    <AssetThumb asset={a} box="h-16" showCopy={false} className="p-1" />
                    <div className="mt-1.5 truncate text-xs font-medium">{briefById.get(a.briefId)!.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">{fmtDateTime(a.publishedAt)}</span>
                      <StatusBadge status={a.deliveryStatus ?? 'Live'} className="text-[10px]" />
                    </div>
                    {a.deliveryStatus !== 'Scheduled' && (
                      <button
                        className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => toggleDelivery(a.id)}
                      >
                        {a.deliveryStatus === 'Paused' ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {a.deliveryStatus === 'Paused' ? 'Resume' : 'Pause'}
                      </button>
                    )}
                  </div>
                ))}
                {!list.length && <div className="rounded-lg border border-dashed p-4 text-center text-[11px] text-muted-foreground">Nothing yet</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">SS</span>
          <span className="text-sm font-semibold">Sprout Social</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Simulated integration</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Connected
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x">
          <div className="p-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Queued ({queued.length})</div>
            {queued.length ? (
              <ul className="space-y-2">
                {queued.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <ChannelIcon channel={a.channel} className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{a.headlines[0]}</span>
                    <span className="text-muted-foreground">{fmtAgo(a.publishedAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No posts queued</EmptyState>
            )}
          </div>
          <div className="p-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Posted</div>
            <ul className="space-y-2">
              {posted.map((a) => {
                const e = engagement(a)
                return (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <ChannelIcon channel={a.channel} className="size-3.5 text-muted-foreground" />
                    <JourneyPill journey={a.journey} className="text-[9px]" />
                    <span className="flex-1 truncate">{a.headlines[0]}</span>
                    <span className="text-muted-foreground tabular-nums">{e.impressions.toLocaleString('en-GB')} impr.</span>
                    <span className="w-16 text-right text-muted-foreground tabular-nums">{e.clicks} clicks</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
      {publishing && <PublishDialog assets={publishing} onClose={() => setPublishing(null)} />}
    </div>
  )
}
