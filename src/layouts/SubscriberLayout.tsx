import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Topbar } from '@/components/topbar/Topbar';
import { PlanProvider } from '@/hooks/usePlan';
import { TrialBanner } from '@/components/ui/TrialBanner';
import { SubscriptionGate } from '@/router/guards';

// ── Prefetch subscriber page chunks in background (after initial render) ────
// This eliminates the loading delay when navigating between pages.
const prefetched = { done: false };
function prefetchSubscriberChunks() {
  if (prefetched.done) return;
  prefetched.done = true;
  const pages = [
    () => import('@/pages/Dashboard'),
    () => import('@/pages/ReviewsCenter'),
    () => import('@/pages/ResponsesInbox'),
    () => import('@/pages/Analytics'),
    () => import('@/pages/Branches'),
    () => import('@/pages/Integrations'),
    () => import('@/pages/Templates'),
    () => import('@/pages/Billing'),
    () => import('@/pages/Settings'),
    () => import('@/pages/Insights'),
    () => import('@/pages/Notifications'),
    () => import('@/pages/Support'),
    () => import('@/pages/Team'),
    () => import('@/pages/QrReviews'),
    () => import('@/pages/Tasks'),
  ];
  // Stagger imports to avoid network congestion
  pages.forEach((load, i) => {
    setTimeout(() => load().catch(() => {}), 300 + i * 150);
  });
}

export function SubscriberLayout() {
  const prefetchRef = useRef(false);

  useEffect(() => {
    if (!prefetchRef.current) {
      prefetchRef.current = true;
      // Start prefetching after 500ms (let current page render first)
      const t = setTimeout(prefetchSubscriberChunks, 500);
      return () => clearTimeout(t);
    }
  }, []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);

  return (
    <PlanProvider>
      <div className="flex h-screen-safe w-full overflow-hidden bg-surface-secondary">
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
