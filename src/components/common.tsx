import { useEffect, useState, type ReactNode } from 'react'
import { Info, Mail, Monitor } from 'lucide-react'
import { formats, journeyLabel, channelLabel } from '@/data/formats'
import { member } from '@/data/team'
import type { Asset, Channel, Journey } from '@/data/types'
import { GRADIENTS, journeyClass } from '@/lib/colors'
import { fmtDuration } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function JourneyPill({ journey, className }: { journey: Journey; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', journeyClass[journey].pill, className)}>
      <span className={cn('size-1.5 rounded-full', journey === 'rental' ? 'bg-teal-400' : 'bg-purple-400')} />
      {journeyLabel[journey]}
    </span>
  )
}

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const cls = cn('size-4', className)
  switch (channel) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-label="Facebook">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18" />
          <path d="M13.2 19v-6h2l.3-2.4h-2.3V9.2c0-.7.2-1.1 1.2-1.1h1.2V6c-.2 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.6H8.8V13h2v6z" fill="currentColor" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" aria-label="Instagram">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.8" />
          <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-label="LinkedIn">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity=".18" />
          <path d="M7 10h2.2v7H7zm1.1-3.6a1.2 1.2 0 1 1 0 2.5 1.2 1.2 0 0 1 0-2.5M11 10h2.1v1c.3-.6 1.1-1.2 2.2-1.2 2.3 0 2.7 1.5 2.7 3.4V17h-2.2v-3.4c0-.8 0-1.9-1.2-1.9s-1.4.9-1.4 1.8V17H11z" fill="currentColor" />
        </svg>
      )
    case 'google':
      return <Monitor className={cls} aria-label="Google Display" />
    case 'email':
      return <Mail className={cls} aria-label="Email" />
  }
}

export function ChannelIcons({ channels, className }: { channels: Channel[]; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>
      {channels.map((c) => (
        <Tooltip key={c}>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <ChannelIcon channel={c} className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{channelLabel(c)}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

/** Placeholder creative: journey gradient at the format's true aspect ratio. */
export function AssetThumb({
  asset,
  className,
  box = 'h-36',
  showCopy = true,
}: {
  asset: Pick<Asset, 'journey' | 'format' | 'headlines' | 'cta' | 'variant' | 'id'>
  className?: string
  box?: string
  showCopy?: boolean
}) {
  const f = formats[asset.format]
  const ratio = f.width / f.height
  const g = GRADIENTS[asset.journey]
  const bg = g[(asset.variant + asset.format.length + asset.id.length) % g.length]
  const tiny = f.height <= 100
  return (
    <div className={cn('flex w-full items-center justify-center rounded-lg bg-muted/40 p-2', box, className)}>
      <div
        className="relative overflow-hidden rounded-md shadow-sm ring-1 ring-black/10"
        style={{
          background: bg,
          aspectRatio: `${f.width} / ${f.height}`,
          ...(ratio >= 1.6 ? { width: '100%' } : { height: '100%' }),
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,.25),transparent_45%)]" />
        {!showCopy ? (
          <div className="absolute inset-0 flex items-center justify-center p-0.5">
            <span className="truncate font-mono text-[8px] font-semibold text-white/90">{f.short}</span>
          </div>
        ) : (
        <div className={cn('absolute inset-0 flex text-white', tiny ? 'flex-row items-center gap-2 px-2' : 'flex-col justify-between p-[7%]')}>
          <span className={cn('font-semibold tracking-tight opacity-95', tiny ? 'text-[9px]' : 'text-[10px]')}>Living</span>
          <span
            className={cn(
              'leading-tight font-semibold drop-shadow-sm',
              tiny ? 'line-clamp-1 flex-1 text-[9px]' : ratio < 0.8 ? 'line-clamp-4 text-[10px]' : 'line-clamp-2 text-[11px]',
            )}
          >
            {asset.headlines[0]}
          </span>
          <span className={cn('flex justify-between gap-1', ratio < 0.8 ? 'flex-col items-start' : 'items-center', tiny && 'shrink-0')}>
            {!tiny && <span className="rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold text-slate-900">{asset.cta}</span>}
            <span className="rounded bg-black/35 px-1 py-0.5 font-mono text-[8px] backdrop-blur-sm">
              {f.short} {f.width}×{f.height}
            </span>
          </span>
        </div>
        )}
      </div>
    </div>
  )
}

export function Callout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border border-indigo-500/25 bg-indigo-500/8 px-3.5 py-2.5 text-sm text-indigo-900 dark:text-indigo-200', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-indigo-500" />
      <span>{children}</span>
    </div>
  )
}

export function StatusDot({ health, pulse }: { health: 'green' | 'amber' | 'red'; pulse?: boolean }) {
  const c = { green: 'bg-emerald-500 text-emerald-500', amber: 'bg-amber-500 text-amber-500', red: 'bg-red-500 text-red-500' }[health]
  return <span className={cn('inline-block size-2 rounded-full', c, pulse && health !== 'green' && 'animate-[pulse-ring_1.6s_ease-out_infinite]')} />
}

export function MemberAvatar({ id, size = 'sm', showName }: { id: string | undefined; size?: 'xs' | 'sm' | 'md'; showName?: boolean }) {
  if (id === 'system') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-semibold text-indigo-400">AI</span>
        {showName && <span className="text-xs">Automation</span>}
      </span>
    )
  }
  const m = member(id)
  const s = { xs: 'size-5 text-[9px]', sm: 'size-6 text-[10px]', md: 'size-8 text-xs' }[size]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', s)} style={{ background: m.color }} title={`${m.name} — ${m.role}`}>
        {m.initials}
      </span>
      {showName && <span className="truncate text-xs">{m.name}</span>}
    </span>
  )
}

function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

export function SlaTimer({ due, label = 'remaining', className }: { due: number | undefined; label?: string; className?: string }) {
  const now = useNow()
  if (!due) return null
  const left = due - now
  const overdue = left < 0
  const tight = !overdue && left < 3 * 3_600_000
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap tabular-nums',
        overdue ? 'bg-red-500/15 text-red-600 dark:text-red-400' : tight ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {overdue ? `${fmtDuration(left)} overdue` : `${fmtDuration(left)} ${label}`}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ToolBadge({ tool }: { tool: Asset['tool'] }) {
  const c = { Firefly: 'text-orange-600 dark:text-orange-300 bg-orange-500/12', 'Figma AI': 'text-pink-600 dark:text-pink-300 bg-pink-500/12', Copilot: 'text-sky-600 dark:text-sky-300 bg-sky-500/12' }[tool]
  return <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', c)}>{tool}</span>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{children}</div>
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-lg bg-muted p-0.5 text-xs', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 font-medium whitespace-nowrap transition-colors',
            value === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const STATUS_CLS: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Routed: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  'In Production': 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
  'In Review': 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  Approved: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  Live: 'bg-emerald-500 text-white',
  Scheduled: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  Paused: 'bg-muted text-muted-foreground',
  Published: 'bg-emerald-500 text-white',
  Ready: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap', STATUS_CLS[status] ?? 'bg-muted', className)}>
      {status === 'Live' && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: 'High' | 'Medium' | 'Low' }) {
  const cls = { High: 'text-red-600 dark:text-red-400', Medium: 'text-amber-600 dark:text-amber-400', Low: 'text-muted-foreground' }[priority]
  const bars = { High: 3, Medium: 2, Low: 1 }[priority]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cls)}>
      <span className="flex items-end gap-px">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('w-[3px] rounded-sm', i <= bars ? 'bg-current' : 'bg-muted')} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {priority}
    </span>
  )
}
