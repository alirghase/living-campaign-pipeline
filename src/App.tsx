import { useEffect } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useStore } from '@/store/useStore'
import Overview from '@/pages/Overview'
import Briefs from '@/pages/Briefs'
import Routing from '@/pages/Routing'
import Studio from '@/pages/Studio'
import Checks from '@/pages/Checks'
import Approvals from '@/pages/Approvals'
import Library from '@/pages/Library'
import Delivery from '@/pages/Delivery'
import Insights from '@/pages/Insights'

function Shell() {
  const pilot = useStore((s) => s.pilot)
  const location = useLocation()
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {pilot && (
          <div className="flex items-center gap-2 border-b border-teal-500/30 bg-teal-500/10 px-6 py-2 text-sm text-teal-800 dark:text-teal-200">
            <FlaskConical className="size-4" />
            Pilot: One development-specific Rental campaign. Prove the workflow, then adapt for Shared Ownership.
          </div>
        )}
        <main key={location.pathname} className="fade-in mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <TooltipProvider delayDuration={200}>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="briefs" element={<Briefs />} />
            <Route path="routing" element={<Routing />} />
            <Route path="studio" element={<Studio />} />
            <Route path="checks" element={<Checks />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="library" element={<Library />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="insights" element={<Insights />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster theme={theme} position="top-center" />
    </TooltipProvider>
  )
}
