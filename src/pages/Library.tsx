import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Download, Loader2, Package, Recycle, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AssetThumb, ChannelIcon, EmptyState, JourneyPill, MemberAvatar, PageHeader, Segmented, StatusBadge } from '@/components/common'
import { PublishDialog } from '@/components/PublishDialog'
import { channels, formatList, formats } from '@/data/formats'
import { member } from '@/data/team'
import type { Asset, Brief } from '@/data/types'
import { libraryTotals } from '@/lib/metrics'
import { useScoped } from '@/lib/selectors'
import { D, fmtDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const statusOf = (a: Asset) => (a.stage === 'published' ? 'Published' : 'Ready')

function LibraryCard({
  asset,
  brief,
  selected,
  onSelect,
  onPublish,
}: {
  asset: Asset
  brief: Brief
  selected: boolean
  onSelect: (v: boolean) => void
  onPublish: () => void
}) {
  const reuse = useStore((s) => s.reuse)
  const navigate = useNavigate()
  const f = formats[asset.format]
  return (
    <div className={cn('lift relative flex flex-col rounded-xl border bg-card', selected && 'border-primary/60 ring-1 ring-primary/30')}>
      <div className="absolute top-3 left-3 z-10">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} className="bg-background/80" aria-label="Select for export" />
      </div>
      <AssetThumb asset={asset} className="rounded-b-none" box="h-32" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{brief.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ChannelIcon channel={asset.channel} className="size-3" /> {f.label}
            </div>
          </div>
          <StatusBadge status={statusOf(asset)} />
        </div>
        <div className="flex items-center gap-2">
          <JourneyPill journey={asset.journey} />
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">v{asset.version}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MemberAvatar id={asset.approvedBy} size="xs" />
          Approved {fmtDate(asset.approvedAt)} by {member(asset.approvedBy).name.split(' ')[0]}
        </div>
        <div className="mt-auto flex gap-2 border-t pt-2.5">
          {asset.stage === 'approved' && (
            <Button size="sm" className="flex-1" onClick={onPublish}>
              <Rocket /> Publish
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              const id = reuse(asset.id)
              toast.success('Draft brief created from approved asset')
              navigate(`/briefs?open=${id}`)
            }}
          >
            <Recycle /> Reuse
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Library() {
  const { assets, briefs, briefById } = useScoped()
  const pilot = useStore((s) => s.pilot)
  const [view, setView] = useState<'grid' | 'packs'>('packs')
  const [campaign, setCampaign] = useState('all')
  const [journey, setJourney] = useState('all')
  const [channel, setChannel] = useState('all')
  const [format, setFormat] = useState('all')
  const [range, setRange] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [publishing, setPublishing] = useState<Asset[] | null>(null)
  const [exporting, setExporting] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  const library = assets.filter((a) => a.stage === 'approved' || a.stage === 'published')
  const filtered = useMemo(() => {
    const since = range === 'all' ? 0 : Date.now() - Number(range) * D
    return library.filter(
      (a) =>
        (campaign === 'all' || a.briefId === campaign) &&
        (journey === 'all' || a.journey === journey) &&
        (channel === 'all' || a.channel === channel) &&
        (format === 'all' || a.format === format) &&
        (a.approvedAt ?? 0) >= since &&
        (status === 'all' || statusOf(a) === status),
    )
  }, [library, campaign, journey, channel, format, range, status])

  const totals = pilot
    ? { total: library.length, published: library.filter((a) => a.stage === 'published').length, ready: library.filter((a) => a.stage === 'approved').length, archived: 0 }
    : libraryTotals(assets)

  const packs = briefs
    .map((b) => ({ brief: b, items: filtered.filter((a) => a.briefId === b.id) }))
    .filter((p) => p.items.length)

  function exportPack(ids: string[], label: string) {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      toast.success(`Exported ${label}`, { description: `${ids.length} assets · ${ids.length * 2} files (PNG + copy deck) · living-campaign-pack.zip` })
      setSelected([])
    }, 1200)
  }

  const filters = [
    { value: campaign, set: setCampaign, label: 'Campaign', options: [['all', 'All'], ...briefs.filter((b) => library.some((a) => a.briefId === b.id)).map((b) => [b.id, b.name])] },
    { value: journey, set: setJourney, label: 'Journey', options: [['all', 'All'], ['rental', 'Rental'], ['shared', 'Shared Ownership']] },
    { value: channel, set: setChannel, label: 'Channel', options: [['all', 'All'], ...channels.map((c) => [c.id, c.label])] },
    { value: format, set: setFormat, label: 'Format', options: [['all', 'All'], ...formatList.map((f) => [f.id, f.short])] },
    { value: range, set: setRange, label: 'Approved', options: [['all', 'Any time'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['60', 'Last 60 days']] },
    { value: status, set: setStatus, label: 'Status', options: [['all', 'All'], ['Published', 'Published'], ['Ready', 'Ready'], ['Archived', 'Archived']] },
  ]

  const card = (a: Asset) => (
    <LibraryCard
      key={a.id}
      asset={a}
      brief={briefById.get(a.briefId)!}
      selected={selected.includes(a.id)}
      onSelect={(v) => setSelected((s) => (v ? [...s, a.id] : s.filter((x) => x !== a.id)))}
      onPublish={() => setPublishing([a])}
    />
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Approved Campaign Package"
        subtitle="The single source of truth: every approved asset, grouped by the brief it came from."
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'packs', label: 'Campaign packs' },
                { value: 'grid', label: 'All assets' },
              ]}
            />
            <Button variant="outline" disabled={!selected.length || exporting} onClick={() => exportPack(selected, `${selected.length} selected assets`)}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export pack{selected.length ? ` (${selected.length})` : ''}
            </Button>
          </>
        }
      />
      <div className="flex items-center gap-6 rounded-xl border bg-card px-5 py-3 text-sm">
        <span>
          <span className="text-lg font-semibold tabular-nums">{totals.total}</span> <span className="text-muted-foreground">assets</span>
        </span>
        <span className="h-5 w-px bg-border" />
        <span>
          <span className="text-lg font-semibold text-emerald-500 tabular-nums">{totals.published}</span> <span className="text-muted-foreground">published</span>
        </span>
        <span>
          <span className="text-lg font-semibold tabular-nums">{totals.ready}</span> <span className="text-muted-foreground">ready</span>
        </span>
        <span>
          <span className="text-lg font-semibold text-muted-foreground tabular-nums">{totals.archived}</span> <span className="text-muted-foreground">archived</span>
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{pilot ? 'Pilot campaign only' : 'Includes earlier quarters'}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2.5">
        {filters.map((f) => (
          <Select key={f.label} value={f.value} onValueChange={f.set}>
            <SelectTrigger size="sm">
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
        <span className="ml-auto pr-2 text-xs text-muted-foreground">{filtered.length} shown</span>
      </div>

      {status === 'Archived' ? (
        <EmptyState>{totals.archived} archived assets from earlier quarters are kept in cold storage and are not loaded in this demo.</EmptyState>
      ) : !filtered.length ? (
        <EmptyState>No approved assets match these filters.</EmptyState>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-4 gap-4">{filtered.map(card)}</div>
      ) : (
        <div className="space-y-3">
          {packs.map(({ brief, items }) => {
            const isOpen = expanded.includes(brief.id)
            const ready = items.filter((a) => a.stage === 'approved')
            return (
              <div key={brief.id} className="rounded-xl border bg-card">
                <div className="flex items-center gap-4 p-4">
                  <button className="flex flex-1 items-center gap-4 text-left" onClick={() => setExpanded((e) => (isOpen ? e.filter((x) => x !== brief.id) : [...e, brief.id]))}>
                    <span className={cn('flex size-9 items-center justify-center rounded-lg', brief.journey === 'rental' ? 'bg-teal-500/15 text-teal-500' : 'bg-purple-500/15 text-purple-500')}>
                      <Package className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium">
                        {brief.name} <JourneyPill journey={brief.journey} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        1 brief → {items.length} channel asset{items.length === 1 ? '' : 's'} · “{brief.masterHeadline}”
                      </div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      {items.slice(0, 6).map((a) => (
                        <div key={a.id} className="w-14">
                          <AssetThumb asset={a} box="h-10" showCopy={false} className="p-0.5" />
                        </div>
                      ))}
                    </div>
                    <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  <div className="flex gap-2">
                    {ready.length > 0 && (
                      <Button size="sm" onClick={() => setPublishing(ready)}>
                        <Rocket /> Publish {ready.length}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={exporting} onClick={() => exportPack(items.map((a) => a.id), `${brief.name} pack`)}>
                      <Download /> Export
                    </Button>
                  </div>
                </div>
                {isOpen && <div className="fade-in grid grid-cols-5 gap-3 border-t p-4">{items.map(card)}</div>}
              </div>
            )
          })}
        </div>
      )}
      {publishing && <PublishDialog assets={publishing} onClose={() => setPublishing(null)} />}
    </div>
  )
}
