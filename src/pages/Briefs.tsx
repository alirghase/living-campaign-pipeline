import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GitBranch, Plus, Recycle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BriefDetail } from '@/components/BriefDetail'
import { Callout, ChannelIcon, ChannelIcons, JourneyPill, MemberAvatar, PageHeader, PriorityBadge, StatusBadge } from '@/components/common'
import { channels } from '@/data/formats'
import { journeyPresets } from '@/data/journeys'
import { member } from '@/data/team'
import type { Channel, Journey, Priority } from '@/data/types'
import { briefStatus, useScoped } from '@/lib/selectors'
import { D, fmtDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { routeMessage, useStore } from '@/store/useStore'

function NewBriefDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createBrief = useStore((s) => s.createBrief)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [development, setDevelopment] = useState('')
  const [objective, setObjective] = useState('')
  const [audience, setAudience] = useState('')
  const [journey, setJourney] = useState<Journey | null>(null)
  const [selected, setSelected] = useState<Channel[]>([])
  const [priority, setPriority] = useState<Priority>('Medium')
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 7 * D).toISOString().slice(0, 10))

  const preset = journey ? journeyPresets[journey] : null
  const valid = name.trim() && objective.trim() && journey && selected.length > 0

  function pickJourney(j: Journey) {
    setJourney(j)
    setSelected(journeyPresets[j].defaultChannels)
    if (!development) setDevelopment(j === 'rental' ? 'Living Stratford' : 'Living Barking Riverside')
  }

  function submit(route: boolean) {
    if (!journey) return
    createBrief(
      {
        name: name.trim(),
        journey,
        development: development.trim() || 'Living Stratford',
        objective: objective.trim(),
        audience: audience.trim() || 'Renters and first-time buyers in the development catchment.',
        channels: selected,
        priority,
        deadline: new Date(deadline).getTime() + 17 * 3_600_000,
      },
      route,
    )
    onOpenChange(false)
    setName('')
    setObjective('')
    setAudience('')
    setJourney(null)
    setSelected([])
    if (route) toast.success(routeMessage(journey), { action: { label: 'View queue', onClick: () => navigate('/routing') } })
    else toast('Saved as draft')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create new brief</DialogTitle>
          <DialogDescription>One structured brief. The pipeline adapts it for every channel you select.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Campaign name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rental Spring Launch Leeds" />
          </div>
          <div className="space-y-1.5">
            <Label>Development</Label>
            <Input value={development} onChange={(e) => setDevelopment(e.target.value)} placeholder="e.g. Living Leeds Dock" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Journey</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['rental', 'shared'] as Journey[]).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => pickJourney(j)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    journey === j ? (j === 'rental' ? 'border-teal-500 bg-teal-500/10' : 'border-purple-500 bg-purple-500/10') : 'hover:bg-muted/60',
                  )}
                >
                  <JourneyPill journey={j} />
                  <p className="mt-2 text-xs text-muted-foreground">{journeyPresets[j].proposition}</p>
                </button>
              ))}
            </div>
          </div>
          {preset && (
            <div className="fade-in col-span-2 grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3 text-xs">
              <div>
                <div className="mb-1 font-semibold">Templates applied</div>
                <ul className="space-y-0.5 text-muted-foreground">
                  {preset.templates.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 font-semibold">Tone guidance</div>
                <ul className="space-y-0.5 text-muted-foreground">
                  {preset.toneGuidance.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 font-semibold">Required disclaimer</div>
                <p className="text-muted-foreground">{preset.disclaimer}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Objective</Label>
            <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} placeholder="What should this campaign achieve?" />
          </div>
          <div className="space-y-1.5">
            <Label>Target audience</Label>
            <Textarea value={audience} onChange={(e) => setAudience(e.target.value)} rows={3} placeholder="Who are we talking to?" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => {
                const on = selected.includes(c.id)
                return (
                  <label key={c.id} className={cn('flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs', on && 'border-primary/50 bg-primary/8')}>
                    <Checkbox checked={on} onCheckedChange={(v) => setSelected((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))} />
                    <ChannelIcon channel={c.id} className="size-3.5" />
                    {c.label}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['High', 'Medium', 'Low'] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={!valid} onClick={() => submit(false)}>
            Save draft
          </Button>
          <Button disabled={!valid} onClick={() => submit(true)}>
            <GitBranch /> Submit & auto-route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Briefs() {
  const { briefs, allAssets } = useScoped()
  const routeBrief = useStore((s) => s.routeBrief)
  const generateAssets = useStore((s) => s.generateAssets)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const id = params.get('open')
    if (id) {
      setOpenId(id)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const open = briefs.find((b) => b.id === openId) ?? null
  const openStatus = open ? briefStatus(open, allAssets) : null

  return (
    <div className="space-y-4">
      <PageHeader
        title="Structured Brief Builder"
        subtitle="Every campaign starts from the same structured brief, so nothing downstream has to guess."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Create new brief
          </Button>
        }
      />
      <Callout>A standardised brief cuts clarification loops and rework downstream.</Callout>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Campaign</TableHead>
              <TableHead>Journey</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {briefs.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenId(b.id)}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-1.5 font-medium">
                    {b.name}
                    {b.reusedFrom && <Recycle className="size-3.5 text-indigo-500" aria-label="Reused" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{b.development}</div>
                </TableCell>
                <TableCell>
                  <JourneyPill journey={b.journey} />
                </TableCell>
                <TableCell>
                  <ChannelIcons channels={b.channels} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={b.priority} />
                </TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(b.createdAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={briefStatus(b, allAssets)} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <MemberAvatar id={b.ownerId} size="xs" />
                    <span className="text-xs">{member(b.ownerId).name}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="overflow-y-auto data-[side=right]:w-[520px] data-[side=right]:sm:max-w-[520px]">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={openStatus!} />
                  {open.reusedFrom && <span className="text-xs text-indigo-500">Reused from an approved campaign</span>}
                </div>
                <SheetTitle className="text-lg">{open.name}</SheetTitle>
                <SheetDescription>Structured brief · created {fmtDate(open.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <BriefDetail brief={open} />
              </div>
              <SheetFooter>
                {openStatus === 'Draft' && (
                  <Button
                    onClick={() => {
                      routeBrief(open.id)
                      toast.success(routeMessage(open.journey))
                    }}
                  >
                    <GitBranch /> Route brief
                  </Button>
                )}
                {openStatus === 'Routed' && (
                  <Button
                    onClick={() => {
                      const n = generateAssets(open.id)
                      toast.success(`Generated ${n} channel assets from one brief`)
                      navigate(`/studio?brief=${open.id}`)
                    }}
                  >
                    <Sparkles /> Generate assets
                  </Button>
                )}
                {openStatus !== 'Draft' && openStatus !== 'Routed' && (
                  <Button variant="outline" onClick={() => navigate(`/studio?brief=${open.id}`)}>
                    View assets
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
      <NewBriefDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}
