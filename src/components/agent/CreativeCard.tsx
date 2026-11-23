import { useState } from 'react'
import { Loader2, RefreshCw, Wand2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChannelIcon } from '@/components/common'
import { Creative } from '@/components/creative/Creative'
import { formats } from '@/data/formats'
import type { Journey } from '@/data/types'
import type { RunCreative } from '@/ai/agents'
import { useRun } from '@/ai/runStore'
import { cn } from '@/lib/utils'
import { ChannelPreview } from './ChannelPreview'

const STATUS: Record<RunCreative['status'], { label: string; cls: string }> = {
  waiting: { label: 'Waiting', cls: 'bg-muted text-muted-foreground' },
  writing: { label: 'Writing copy', cls: 'bg-rental-500/15 text-rental-800 dark:text-rental-300' },
  painting: { label: 'Generating image', cls: 'bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300' },
  checking: { label: 'QA checking', cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  fixing: { label: 'Self-repairing', cls: 'bg-orange-500/15 text-orange-800 dark:text-orange-300' },
  ready: { label: 'Ready', cls: 'bg-brand-500/12 text-brand-700 dark:text-brand-300' },
  error: { label: 'Error', cls: 'bg-destructive/12 text-destructive' },
}

const SUGGESTIONS = ['Golden hour light', 'Add a family dog', 'More greenery', 'Show people unpacking']

export function CreativeCard({ c, journey, seed, view, locked }: { c: RunCreative; journey: Journey; seed: string; view: 'creative' | 'channel'; locked: boolean }) {
  const { selectHeadline, refine, refining } = useRun()
  const [direction, setDirection] = useState('')
  const f = formats[c.format]
  const busy = c.status !== 'ready' && c.status !== 'error'
  const headline = c.headlines[c.selected] ?? ''
  const isRefining = refining === c.format
  const passed = c.qa?.filter((q) => q.status === 'pass').length ?? 0
  const status = c.status === 'ready' && c.qaState === 'warn' ? { label: 'Ready · warning', cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' } : c.status === 'ready' && c.qaState === 'fail' ? { label: 'Needs people', cls: 'bg-destructive/12 text-destructive' } : STATUS[c.status]

  const props = {
    format: c.format,
    journey,
    headline: headline || ' ',
    body: c.body,
    cta: c.cta || '…',
    image: c.image,
    seed: `${seed}-${c.revisions}`,
    loading: c.status === 'painting' || isRefining,
  }

  const submit = async (text: string) => {
    if (!text.trim()) return
    try {
      await refine(c.format, text.trim())
      setDirection('')
    } catch (e) {
      toast.error('Image edit failed', { description: (e as Error).message })
    }
  }

  return (
    <div className={cn('fade-in flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft', (c.format === 'gd-leaderboard' || c.format === 'email-header') && 'md:col-span-2')}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <ChannelIcon channel={f.channel} className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{f.label}</div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {f.width}×{f.height} · image {c.aspect}
          </div>
        </div>
        {c.revisions > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/12 px-1.5 py-0.5 text-[10px] font-medium text-orange-800 dark:text-orange-300">
                <Wrench className="size-3" /> {c.revisions}
              </span>
            </TooltipTrigger>
            <TooltipContent>Revised {c.revisions}× by the agents before people saw it</TooltipContent>
          </Tooltip>
        )}
        <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap', status.cls)}>
          {busy && <Loader2 className="size-3 animate-spin" />}
          {status.label}
        </span>
      </div>

      <div className={cn('bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgb(0_0_0/0.018)_10px_20px)] p-4', c.format === 'ig-story' && 'flex justify-center')}>
        <div className={cn(c.format === 'ig-story' && 'w-[210px]', c.format === 'gd-mpu' && view === 'creative' && 'mx-auto max-w-[300px]')}>
          {c.headlines.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg bg-muted" style={{ aspectRatio: `${f.width} / ${f.height}`, maxHeight: 360 }}>
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : view === 'channel' ? (
            <ChannelPreview {...props} />
          ) : (
            <Creative {...props} className="rounded-lg" />
          )}
        </div>
      </div>

      {c.headlines.length > 0 && (
        <div className="space-y-3 border-t px-4 py-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Headline options
              <span className={cn('font-mono normal-case', headline.length > f.maxHeadline ? 'text-destructive' : 'text-muted-foreground')}>
                {headline.length}/{f.maxHeadline}
              </span>
            </div>
            <div className="space-y-1">
              {c.headlines.map((h, i) => (
                <button
                  key={i}
                  disabled={locked}
                  onClick={() => selectHeadline(c.format, i)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] leading-snug transition-colors',
                    i === c.selected ? 'bg-brand-500/10 font-medium text-foreground ring-1 ring-brand-500/30' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className={cn('mt-1 size-2.5 shrink-0 rounded-full border-2', i === c.selected ? 'border-brand-500 bg-brand-500' : 'border-muted-foreground/40')} />
                  {h}
                </button>
              ))}
            </div>
          </div>

          {c.qa && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                QA agent
                <span className="normal-case">
                  {passed}/{c.qa.length} passed
                </span>
              </div>
              <div className="flex gap-1">
                {c.qa.map((q) => (
                  <Tooltip key={q.id}>
                    <TooltipTrigger asChild>
                      <span className={cn('h-2 flex-1 rounded-full', q.status === 'pass' ? 'bg-brand-500' : q.status === 'warn' ? 'bg-amber-500' : 'bg-destructive')} />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                      <div className="font-semibold">{q.label}</div>
                      <div className="opacity-80">{q.detail}</div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {c.notes && <p className="mt-1.5 text-[11px] text-muted-foreground italic">“{c.notes}”</p>}
            </div>
          )}

          {!locked && c.status === 'ready' && (
            <div className="space-y-1.5">
              <form
                className="flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault()
                  submit(direction)
                }}
              >
                <Input value={direction} onChange={(e) => setDirection(e.target.value)} placeholder="Direct the image… e.g. make it golden hour" className="h-8 text-xs" disabled={isRefining} />
                <Button type="submit" size="sm" variant="outline" disabled={isRefining || !direction.trim()} className="h-8">
                  {isRefining ? <Loader2 className="animate-spin" /> : <Wand2 />} Refine
                </Button>
              </form>
              <div className="flex flex-wrap gap-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} disabled={isRefining} onClick={() => submit(s)} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-brand-500/40 hover:text-foreground">
                    <RefreshCw className="mr-1 inline size-2.5" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {c.imagePrompt && (
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none hover:text-foreground">Image prompt</summary>
              <p className="mt-1 rounded-md bg-muted p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">{c.imagePrompt}</p>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
