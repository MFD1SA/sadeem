import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Topbar } from '@/components/topbar/Topbar';
import { PlanProvider } from '@/hooks/usePlan';
import { TrialBanner } from '@/components/ui/TrialBanner';
import { SubscriptionGate } from '@/router/guards';

// All subscriber pages are eagerly loaded — no prefetch needed.
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
          {/* Skip to main content link for keyboard/screen reader users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:top-2 focus:left-2"
          >
            تخطي إلى المحتوى الرئيسي
          </a>

          <Topbar onMenuClick={openMobileSidebar} />

          <main id="main-content" className="flex-1 overflow-y-auto" role="main" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
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
