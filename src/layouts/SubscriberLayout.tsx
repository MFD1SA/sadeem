import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Topbar } from '@/components/topbar/Topbar';
import { PlanProvider } from '@/hooks/usePlan';
import { TrialBanner } from '@/components/ui/TrialBanner';
import { SubscriptionGate } from '@/router/guards';

export function SubscriberLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);

  return (
    <PlanProvider>
      <div className="flex h-screen w-full overflow-hidden bg-surface-secondary">
        <Sidebar
          mobileSidebarOpen={mobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={openMobileSidebar} />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 xl:px-8">
              <div className="mb-4 sm:mb-5">
                <TrialBanner />
              </div>

              <div className="min-w-0">
                <SubscriptionGate />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PlanProvider>
  );
}
