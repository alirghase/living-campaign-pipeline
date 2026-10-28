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
  type LucideIcon,
} from 'lucide-react'
import { stageInfo, useScoped } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import { VOLUME_ESTIMATE } from '@/data/team'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  stage?: string
}

const groups: { title: string; items: Item[] }[] = [
  {
    title: 'Pipeline',
    items: [
      { to: '/', label: 'Pipeline Overview', icon: LayoutDashboard },
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

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <img src="favicon.svg" alt="" className="size-7" />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Living</div>
          <div className="text-[11px] text-muted-foreground">Campaign Pipeline</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{g.title}</div>
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
                          'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                          isActive ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                        )
                      }
                    >
                      <item.icon className="size-4" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {s && s.count > 0 && (
                        <span
                          className={cn(
                            'min-w-5 rounded-full px-1.5 text-center text-[10px] font-semibold tabular-nums',
                            s.health === 'red' ? 'bg-red-500/15 text-red-500' : s.health === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground',
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
      <div className="m-2.5 rounded-lg border border-sidebar-border p-3 text-[11px] text-muted-foreground">
        <div className="mb-1 font-medium text-foreground">Volume estimate (synthetic)</div>
        ~{VOLUME_ESTIMATE.campaignsPerQuarter} campaigns · ~{VOLUME_ESTIMATE.assetsPerQuarter} assets per quarter across both journeys
      </div>
    </aside>
  )
}
