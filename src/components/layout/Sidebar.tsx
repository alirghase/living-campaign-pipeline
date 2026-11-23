import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  GitBranch,
  LayoutDashboard,
  Package,
  Send,
  ShieldCheck,
  Sparkles,
  Stamp,
  Bot,
  type LucideIcon,
} from 'lucide-react'
import { stageInfo, useScoped } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import { VOLUME_ESTIMATE } from '@/data/team'
import { Wordmark } from '@/components/creative/Creative'
import { isLive, useAiSettings } from '@/ai/settings'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  stage?: string
}

const groups: { title: string; items: Item[] }[] = [
  {
    title: 'Agentic',
    items: [{ to: '/', label: 'Campaign Agent', icon: Bot }],
  },
  {
    title: 'Pipeline',
    items: [
      { to: '/overview', label: 'Pipeline Overview', icon: LayoutDashboard },
      { to: '/briefs', label: 'Structured Briefs', icon: FileText, stage: 'brief' },
      { to: '/routing', label: 'Journey Routing', icon: GitBranch, stage: 'routing' },
      { to: '/studio', label: 'Content Studio', icon: Sparkles, stage: 'creation' },
      { to: '/checks', label: 'Pre-Checks & QA', icon: ShieldCheck, stage: 'qa' },
      { to: '/approvals', label: 'Approvals', icon: Stamp, stage: 'approval' },
    ],
  },
  {
    title: 'Library',
    items: [
      { to: '/library', label: 'Campaign Package', icon: Package, stage: 'package' },
      { to: '/delivery', label: 'Channel Delivery', icon: Send, stage: 'delivery' },
    ],
  },
  { title: 'Insights', items: [{ to: '/insights', label: 'Measurement', icon: BarChart3 }] },
]

export function Sidebar() {
  const { briefs, assets } = useScoped()
  const stages = Object.fromEntries(stageInfo(briefs, assets).map((s) => [s.key, s]))
  const live = useAiSettings(isLive)

  return (
    <aside className="sticky top-0 hidden h-screen w-60 lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 flex-col justify-center gap-0.5 border-b border-sidebar-border px-4">
        <Wordmark size={17} />
        <div className="pl-[27px] text-[10px] font-medium tracking-wider text-sidebar-foreground/55 uppercase">Campaign Studio</div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">{g.title}</div>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const s = item.stage ? stages[item.stage] : undefined
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                          isActive
                            ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:top-2 before:bottom-2 before:-left-2.5 before:w-1 before:rounded-r before:bg-sidebar-primary'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )
                      }
                    >
                      <item.icon className="size-4" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.to === '/' && (
                        <span className={cn('rounded px-1.5 py-px text-[9px] font-bold tracking-wide uppercase', live ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-white/12 text-sidebar-foreground/80')}>
                          {live ? 'Live' : 'Demo'}
                        </span>
                      )}
                      {s && s.count > 0 && (
                        <span
                          className={cn(
                            'min-w-5 rounded-full px-1.5 text-center text-[10px] font-semibold tabular-nums',
                            s.health === 'red' ? 'bg-red-400/20 text-red-200' : s.health === 'amber' ? 'bg-amber-300/20 text-amber-200' : 'bg-white/10 text-sidebar-foreground/70',
                          )}
                        >
                          {s.count}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-2.5 rounded-xl bg-white/6 p-3 text-[11px] text-sidebar-foreground/65 ring-1 ring-sidebar-border">
        <div className="mb-1 font-semibold text-sidebar-foreground">Volume estimate (synthetic)</div>
        ~{VOLUME_ESTIMATE.campaignsPerQuarter} campaigns · ~{VOLUME_ESTIMATE.assetsPerQuarter} assets per quarter across both journeys
      </div>
    </aside>
  )
}
