import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Moon, RotateCcw, Search, Sun, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MemberAvatar, Segmented } from '@/components/common'
import { formats } from '@/data/formats'
import { CURRENT_USER_ID, member } from '@/data/team'
import { PILOT_BRIEF_ID } from '@/data/briefs'
import { attentionItems, matchesSearch } from '@/lib/selectors'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export function TopBar() {
  const navigate = useNavigate()
  const { pilot, setPilot, theme, toggleTheme, search, setSearch, briefs, assets, reset } = useStore()
  const [focused, setFocused] = useState(false)
  const items = pilot
    ? attentionItems(briefs.filter((b) => b.id === PILOT_BRIEF_ID), assets.filter((a) => a.briefId === PILOT_BRIEF_ID))
    : attentionItems(briefs, assets)
  const urgent = items.filter((i) => i.tone === 'red').length
  const me = member(CURRENT_USER_ID)

  const results = useMemo(() => {
    if (!search) return []
    const byId = new Map(briefs.map((b) => [b.id, b]))
    return assets
      .filter((a) => (!pilot || a.briefId === PILOT_BRIEF_ID) && matchesSearch(search, a, byId.get(a.briefId)))
      .slice(0, 6).map((a) => ({ a, b: byId.get(a.briefId)! }))
  }, [search, briefs, assets, pilot])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur">
      <div className="text-sm font-semibold tracking-tight whitespace-nowrap">Living Campaign Pipeline</div>
      <Segmented
        value={pilot ? 'pilot' : 'full'}
        onChange={(v) => {
          setPilot(v === 'pilot')
          toast(v === 'pilot' ? 'Pilot scope: one Rental campaign end to end' : 'Full view: all campaigns, both journeys')
        }}
        options={[
          { value: 'pilot', label: 'Pilot' },
          { value: 'full', label: 'Full' },
        ]}
      />
      <div className="relative ml-auto w-80">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search assets, campaigns, formats…"
          className="h-8 pr-8 pl-8"
        />
        {search && (
          <button className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')} aria-label="Clear search">
            <X className="size-3.5" />
          </button>
        )}
        {focused && search && (
          <div className="absolute top-10 right-0 left-0 z-40 overflow-hidden rounded-lg border bg-popover shadow-xl">
            <div className="border-b px-3 py-1.5 text-[11px] text-muted-foreground">Filtering every view · {results.length ? 'top matches' : 'no assets match'}</div>
            {results.map(({ a, b }) => (
              <button
                key={a.id}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                onMouseDown={() => navigate(a.stage === 'approved' || a.stage === 'published' ? '/library' : a.stage === 'approval' ? '/approvals' : a.stage === 'qa' ? '/checks' : '/studio')}
              >
                <span className={cn('size-2 rounded-full', a.journey === 'rental' ? 'bg-teal-400' : 'bg-purple-400')} />
                <span className="flex-1 truncate">{b.name}</span>
                <span className="text-muted-foreground">{formats[a.format].short}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun /> : <Moon />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell />
            {urgent > 0 && <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">{urgent}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96">
          <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.slice(0, 8).map((i) => (
            <DropdownMenuItem key={i.id} onSelect={() => navigate(i.path)} className="items-start gap-2 text-xs">
              <span className={cn('mt-1 size-2 shrink-0 rounded-full', i.tone === 'red' ? 'bg-red-500' : 'bg-amber-500')} />
              {i.text}
            </DropdownMenuItem>
          ))}
          {!items.length && <div className="p-3 text-xs text-muted-foreground">All clear.</div>}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Account">
            <MemberAvatar id={CURRENT_USER_ID} size="md" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm">{me.name}</div>
            <div className="text-xs font-normal text-muted-foreground">{me.role}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              reset()
              navigate('/')
              toast.success('Demo data reset')
            }}
          >
            <RotateCcw /> Reset demo data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
