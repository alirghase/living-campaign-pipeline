import { useState } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Check, CheckCircle2, Clock, GripVertical, MessageSquare, Split, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { BriefDetail } from '@/components/BriefDetail'
import { AssetThumb, Callout, JourneyPill, MemberAvatar, PageHeader, Segmented, SlaTimer, ToolBadge } from '@/components/common'
import { REVIEW_TYPES } from '@/data/assets'
import { formats } from '@/data/formats'
import { member, REVIEWER } from '@/data/team'
import type { Asset, Brief, ReviewType } from '@/data/types'
import { isOverdue, useScoped } from '@/lib/selectors'
import { fmtDate, fmtDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

type Col = 'pending' | ReviewType | 'approved'

const TITLE: Record<Col, string> = {
  pending: 'Pending',
  brand: 'Brand Review',
  business: 'Business Review',
  risk: 'Risk Review',
  approved: 'Approved',
}

const cap = (t: string) => t[0].toUpperCase() + t.slice(1)

/** A drop also fires a click on the card; ignore clicks right after a drag. */
let lastDragAt = 0

function columnOf(a: Asset): Col[] {
  if (a.stage === 'approved') return ['approved']
  const active = REVIEW_TYPES.filter((t) => a.reviews[t].status === 'in-review')
  return active.length ? active : ['pending']
}

function ReviewBadges({ asset }: { asset: Asset }) {
  return (
    <div className="flex flex-wrap gap-1">
      {REVIEW_TYPES.map((t) => {
        const s = asset.reviews[t].status
        return (
          <span
            key={t}
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium whitespace-nowrap',
              s === 'approved' ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : s === 'in-review' ? 'bg-sky-500/12 text-sky-700 dark:text-sky-300' : 'bg-muted text-muted-foreground',
            )}
          >
            {cap(t)} {s === 'approved' ? '✓' : s === 'in-review' ? '⏳' : '·'}
          </span>
        )
      })}
    </div>
  )
}

function Card({ asset, brief, col, onOpen }: { asset: Asset; brief: Brief; col: Col; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `${asset.id}::${col}`, data: { asset, col } })
  const also = columnOf(asset).filter((c) => c !== col)
  const overdue = isOverdue(asset)
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={cn(
        'group relative cursor-grab rounded-lg border bg-card p-2.5 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing',
        isDragging && 'z-50 opacity-90 shadow-2xl ring-2 ring-primary/40',
        overdue && 'border-red-500/50',
      )}
      onClick={() => Date.now() - lastDragAt > 250 && onOpen()}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="absolute top-2 right-1.5 size-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
      <AssetThumb asset={asset} box="h-20" showCopy={false} className="p-1" />
      <div className="mt-2 truncate text-[13px] font-medium">{brief.name}</div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
        <span className="text-[11px] whitespace-nowrap text-muted-foreground">{formats[asset.format].short}</span>
        <JourneyPill journey={asset.journey} />
      </div>
      {col !== 'approved' && <ReviewBadges asset={asset} />}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        <span className="flex items-center gap-1 text-[11px] whitespace-nowrap text-muted-foreground">
          <MemberAvatar id={asset.submittedBy} size="xs" />
          {fmtDate(asset.submittedAt)}
        </span>
        {col === 'approved' ? (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">✓ {fmtDate(asset.approvedAt)}</span>
        ) : (
          <SlaTimer due={asset.slaDue} label="left" />
        )}
      </div>
      {also.length > 0 && (
        <div className="mt-2 flex items-center gap-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-700 dark:text-indigo-300">
          <Split className="size-3" /> In parallel with {also.map((c) => TITLE[c].replace(' Review', '')).join(' & ')}
        </div>
      )}
    </div>
  )
}

function Column({ col, children, count }: { col: Col; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: col })
  return (
    <div ref={setNodeRef} className={cn('flex min-h-[420px] flex-col rounded-xl bg-muted/40 p-2 transition-colors', isOver && 'bg-primary/10 ring-2 ring-primary/30')}>
      <div className="mb-2 flex items-center gap-2 px-1.5 pt-1 text-xs font-semibold">
        {col === 'approved' ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : col === 'pending' ? <Clock className="size-3.5 text-muted-foreground" /> : <MemberAvatar id={REVIEWER[col]} size="xs" />}
        {TITLE[col]}
        <span className="ml-auto rounded-full bg-background px-1.5 text-[10px] tabular-nums">{count}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function DetailPanel({ asset, brief, onClose }: { asset: Asset; brief: Brief; onClose: () => void }) {
  const decide = useStore((s) => s.decide)
  const firstOpen = REVIEW_TYPES.find((t) => asset.reviews[t].status === 'in-review') ?? REVIEW_TYPES.find((t) => asset.reviews[t].status === 'pending') ?? 'brand'
  const [as, setAs] = useState<ReviewType>(firstOpen)
  const [comment, setComment] = useState('')
  const review = asset.reviews[as]
  const done = review.status === 'approved' || asset.stage !== 'approval'
  const f = formats[asset.format]

  function act(decision: 'approved' | 'changes' | 'rejected') {
    if (decision !== 'approved' && !comment.trim()) {
      toast.error('Add a comment so the designer knows what to change')
      return
    }
    decide(asset.id, as, decision, comment.trim() || undefined)
    setComment('')
    const remaining = REVIEW_TYPES.filter((t) => t !== as && asset.reviews[t].status !== 'approved')
    if (decision === 'approved') {
      if (!remaining.length) {
        toast.success('All three approvals in — added to the campaign package')
        onClose()
      } else toast.success(`${cap(as)} approved. Waiting on ${remaining.map(cap).join(' & ')}`)
      if (remaining.length) setAs(remaining[0])
    } else {
      toast(decision === 'changes' ? 'Changes requested — back to the studio' : 'Rejected — back to the studio')
      onClose()
    }
  }

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2">
          <JourneyPill journey={asset.journey} />
          <ReviewBadges asset={asset} />
          {asset.stage === 'approval' && <SlaTimer due={asset.slaDue} />}
        </div>
        <SheetTitle className="text-lg">
          {brief.name} · {f.label}
        </SheetTitle>
        <SheetDescription>Compare the asset with the original brief, then decide. Every action is logged here, not in email.</SheetDescription>
      </SheetHeader>
      <div className="grid grid-cols-2 gap-5 px-4">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Asset</div>
          <AssetThumb asset={asset} box="h-56" />
          <div className="flex items-center gap-2 text-xs">
            <ToolBadge tool={asset.tool} />
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">v{asset.version}</span>
            <span className="text-muted-foreground">
              {f.width}×{f.height}
            </span>
          </div>
          <ol className="space-y-1 text-sm">
            {asset.headlines.map((h, i) => (
              <li key={h + i} className={cn(i > 0 && 'text-muted-foreground')}>
                {i + 1}. {h}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">{asset.body}</p>
          <div className="text-xs">
            CTA: <span className="font-medium">{asset.cta}</span>
          </div>
          {asset.qa && (
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
              <div className="mb-1 font-semibold">Pre-check summary</div>
              {asset.qa.filter((c) => c.status !== 'pass').map((c) => (
                <div key={c.id} className="text-amber-700 dark:text-amber-300">
                  ⚠ {c.detail}
                </div>
              ))}
              {asset.qa.every((c) => c.status === 'pass') && <div className="text-emerald-600 dark:text-emerald-400">✓ All 8 automated checks passed</div>}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Original brief</div>
          <div className="rounded-lg border p-3">
            <BriefDetail brief={brief} compact />
          </div>
        </div>
      </div>

      {asset.stage === 'approval' && (
        <div className="mx-4 space-y-3 rounded-xl border p-3.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold">Review as</span>
            <Segmented
              value={as}
              onChange={setAs}
              options={REVIEW_TYPES.map((t) => ({
                value: t,
                label: (
                  <span className="flex items-center gap-1">
                    {cap(t)} {asset.reviews[t].status === 'approved' && <Check className="size-3 text-emerald-500" />}
                  </span>
                ),
              }))}
            />
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <MemberAvatar id={REVIEWER[as]} size="xs" /> {member(REVIEWER[as]).name}, {member(REVIEWER[as]).role}
            </span>
          </div>
          {done ? (
            <div className="rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              {cap(as)} approved {fmtDateTime(review.at)}. Other reviews continue independently.
            </div>
          ) : (
            <>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Comment (required to request changes or reject)" />
              <div className="flex gap-2">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={() => act('approved')}>
                  <Check /> Approve
                </Button>
                <Button variant="outline" onClick={() => act('changes')}>
                  <MessageSquare /> Request changes
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-600 dark:text-red-400" onClick={() => act('rejected')}>
                  <X /> Reject
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mx-4 mb-6">
        <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Audit trail</div>
        <ol className="relative space-y-3 border-l pl-4">
          {[...asset.audit].reverse().map((e, i) => (
            <li key={i} className="relative text-xs">
              <span className="absolute top-1 -left-[21px] size-2 rounded-full bg-border ring-4 ring-background" />
              <div className="flex items-center gap-2">
                <MemberAvatar id={e.actorId} size="xs" showName />
                <span className="ml-auto text-muted-foreground">{fmtDateTime(e.at)}</span>
              </div>
              <div className="mt-0.5 pl-6 text-muted-foreground">{e.action}</div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

export default function Approvals() {
  const { assets, briefById } = useScoped()
  const startReview = useStore((s) => s.startReview)
  const decide = useStore((s) => s.decide)
  const [openId, setOpenId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const inApproval = assets.filter((a) => a.stage === 'approval')
  const approved = assets
    .filter((a) => a.stage === 'approved')
    .sort((a, b) => (b.approvedAt ?? 0) - (a.approvedAt ?? 0))
    .slice(0, 6)
  const cols: Record<Col, Asset[]> = { pending: [], brand: [], business: [], risk: [], approved }
  for (const a of inApproval) for (const c of columnOf(a)) cols[c].push(a)
  const overdue = inApproval.filter((a) => isOverdue(a)).length
  const open = assets.find((a) => a.id === openId)

  function onDragEnd(e: DragEndEvent) {
    lastDragAt = Date.now()
    const to = e.over?.id as Col | undefined
    const { asset, col } = (e.active.data.current ?? {}) as { asset: Asset; col: Col }
    if (!to || !asset || to === col) return
    if (to === 'pending') return
    if (to === 'approved') {
      if (col === 'pending' || col === 'approved') return void toast.error('Start a review first — approvals are a human decision')
      decide(asset.id, col, 'approved')
      const left = REVIEW_TYPES.filter((t) => t !== col && asset.reviews[t].status !== 'approved')
      toast.success(left.length ? `${TITLE[col]} approved. Still waiting on ${left.map(cap).join(' & ')}` : 'Fully approved — added to the campaign package')
      return
    }
    if (asset.reviews[to].status === 'approved') return void toast(`${TITLE[to]} already approved`)
    startReview(asset.id, to)
    toast.success(`${TITLE[to]} started${col !== 'pending' ? ` in parallel with ${TITLE[col]}` : ''}`)
  }

  const renderCards = (c: Col) =>
    cols[c].map((a) => <Card key={`${a.id}-${c}`} asset={a} brief={briefById.get(a.briefId)!} col={c} onOpen={() => setOpenId(a.id)} />)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Brand, Business & Risk Approval"
        subtitle="Drag a card into a review lane to start it. Reviews run side by side, and each reviewer decides on their own."
        actions={
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">{inApproval.length} in review</span>
            {overdue > 0 && <span className="rounded-md bg-red-500/15 px-2 py-1 font-medium text-red-600 dark:text-red-400">{overdue} past SLA</span>}
          </div>
        }
      />
      <Callout>One tracked workflow with parallel approvals replaces chasing by email.</Callout>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,3.4fr)_minmax(0,0.8fr)] gap-3">
          <Column col="pending" count={cols.pending.length}>
            {renderCards('pending')}
          </Column>
          <div className="rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/4 p-2">
            <div className="mb-2 flex items-center gap-2 px-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              <Split className="size-3.5" /> Parallel review lane — Brand, Business and Risk run at the same time
            </div>
            <div className="grid grid-cols-3 gap-2">
              {REVIEW_TYPES.map((t) => (
                <Column key={t} col={t} count={cols[t].length}>
                  {renderCards(t)}
                </Column>
              ))}
            </div>
          </div>
          <Column col="approved" count={assets.filter((a) => a.stage === 'approved').length}>
            {renderCards('approved')}
          </Column>
        </div>
      </DndContext>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="gap-4 overflow-y-auto data-[side=right]:w-[920px] data-[side=right]:sm:max-w-[920px]">
          {open && <DetailPanel key={open.id} asset={open} brief={briefById.get(open.briefId)!} onClose={() => setOpenId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
