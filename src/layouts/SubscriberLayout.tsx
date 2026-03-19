import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Topbar } from '@/components/topbar/Topbar';
import { PlanProvider } from '@/hooks/usePlan';
import { TrialBanner } from '@/components/ui/TrialBanner';

export function SubscriberLayout() {
  // Mobile sidebar state only — desktop sidebar is always visible via CSS
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);

  return (
    <PlanProvider>
      <div className="flex h-screen w-full overflow-hidden bg-surface-secondary">
        <Sidebar mobileSidebarOpen={mobileSidebarOpen} onCloseMobile={closeMobileSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar onMenuClick={openMobileSidebar} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <TrialBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </PlanProvider>
  );
}
