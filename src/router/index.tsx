// ============================================================================
// SENDA — App Router
// Subscriber pages are eagerly loaded for instant sidebar navigation
// (no per-page JS download delay). Admin pages stay lazy — they are
// rarely visited and not part of the subscriber hot path.
// ============================================================================
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SubscriberLayout } from '@/layouts/SubscriberLayout';
import { RequireAuth, RequireOrganization, RedirectIfAuthenticated } from './guards';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/hooks/useAuth';

// ── Lazy import with auto-retry on chunk load failure (post-deploy) ─────────
function lazyWithRetry(importFn: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    importFn().catch(() => {
      // Chunk file changed after deploy — force one reload
      const key = 'sadeem_chunk_retry';
      const lastRetry = sessionStorage.getItem(key);
      const now = String(Date.now());
      if (!lastRetry || Number(now) - Number(lastRetry) > 10_000) {
        sessionStorage.setItem(key, now);
        window.location.reload();
      }
      // If retry already happened within 10s, show error instead of infinite loop
      return { default: () => null } as { default: React.ComponentType };
    })
  );
}

// ── Eagerly loaded — critical path + all subscriber pages ───────────────────
import Login         from '@/pages/Auth/Login';
import AuthCallback  from '@/pages/Auth/Callback';
import ResetPassword from '@/pages/Auth/ResetPassword';
import Onboarding    from '@/pages/Onboarding';
import Dashboard    from '@/pages/Dashboard';

// Subscriber pages — eager so sidebar navigation is always instant
import ReviewsCenter  from '@/pages/ReviewsCenter';
import ResponsesInbox from '@/pages/ResponsesInbox';
import Analytics      from '@/pages/Analytics';
import Insights       from '@/pages/Insights';
import Branches       from '@/pages/Branches';
import Templates      from '@/pages/Templates';
import Team           from '@/pages/Team';
import Integrations   from '@/pages/Integrations';
import QrReviews      from '@/pages/QrReviews';
import Tasks          from '@/pages/Tasks';
import Notifications  from '@/pages/Notifications';
import Billing        from '@/pages/Billing';
import Support        from '@/pages/Support';
import Settings       from '@/pages/Settings';
import ReviewLanding  from '@/pages/ReviewLanding';
import SeoLanding     from '@/pages/SeoLanding';
import HomePage       from '@/pages/HomePage';
// StoryPage removed — /story now redirects to /
import PrivacyPage    from '@/pages/legal/PrivacyPage';
import TermsPage      from '@/pages/legal/TermsPage';
import FeaturesPage          from '@/pages/marketing/FeaturesPage';
import ReviewsManagementPage from '@/pages/marketing/ReviewsManagementPage';
import AiRepliesPage         from '@/pages/marketing/AiRepliesPage';
import AnalyticsMarketingPage from '@/pages/marketing/AnalyticsPage';
import BranchesMarketingPage  from '@/pages/marketing/BranchesPage';

// ── Public pages ───────────────────────────────────────────────────────────
import AboutPage    from '@/pages/public/AboutPage';
import PublicFeaturesPage from '@/pages/public/FeaturesPage';
import PricingPage  from '@/pages/public/PricingPage';
import FaqPage      from '@/pages/public/FaqPage';
import BlogPage     from '@/pages/public/BlogPage';
import ContactPage  from '@/pages/public/ContactPage';

// ── Lazily loaded admin pages (infrequently visited) ────────────────────────
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import AdminLogin from '@/admin/pages/AdminLogin';

const AdminDashboard      = lazyWithRetry(() => import('@/admin/pages/AdminDashboard'));
const AdminUsers          = lazyWithRetry(() => import('@/admin/pages/AdminUsers'));
const AdminRoles          = lazyWithRetry(() => import('@/admin/pages/AdminRoles'));
const AdminSettings       = lazyWithRetry(() => import('@/admin/pages/AdminSettings'));
const AdminProfile        = lazyWithRetry(() => import('@/admin/pages/AdminProfile'));
const AdminSecurity       = lazyWithRetry(() => import('@/admin/pages/AdminSecurity'));
const AdminSubscribers    = lazyWithRetry(() => import('@/admin/pages/AdminSubscribers'));
const AdminBilling        = lazyWithRetry(() => import('@/admin/pages/AdminBilling'));
const AdminAIUsage        = lazyWithRetry(() => import('@/admin/pages/AdminAIUsage'));
const AdminPaymentGateway = lazyWithRetry(() => import('@/admin/pages/AdminPaymentGateway'));
const AdminAuditLogs      = lazyWithRetry(() => import('@/admin/pages/AdminAuditLogs'));
const AdminTickets        = lazyWithRetry(() => import('@/admin/pages/AdminTickets'));
const AdminIntegrations   = lazyWithRetry(() => import('@/admin/pages/AdminIntegrations'));
const AdminPlans          = lazyWithRetry(() => import('@/admin/pages/AdminPlans'));
const AdminTemplates      = lazyWithRetry(() => import('@/admin/pages/AdminTemplates'));

function PageLoader() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <LoadingState />
    </div>
  );
}

/**
 * Smart 404 handler: authenticated users → /dashboard, guests → /login.
 */
function CatchAllRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* ======================================================= */}
      {/* SUBSCRIBER ROUTES                                        */}
      {/* ======================================================= */}

      <Route path="/" element={<HomePage />} />
      <Route path="/story"   element={<Navigate to="/" replace />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms"   element={<TermsPage />} />
      <Route path="/features"            element={<FeaturesPage />} />
      <Route path="/reviews-management"  element={<ReviewsManagementPage />} />
      <Route path="/ai-replies"          element={<AiRepliesPage />} />
      <Route path="/analytics-page"      element={<AnalyticsMarketingPage />} />
      <Route path="/branches-page"       element={<BranchesMarketingPage />} />

      {/* Public pages */}
      <Route path="/about"      element={<AboutPage />} />
      <Route path="/pricing"    element={<PricingPage />} />
      <Route path="/faq"        element={<FaqPage />} />
      <Route path="/blog"       element={<BlogPage />} />
      <Route path="/contact-us" element={<ContactPage />} />

      <Route path="/r/:slug" element={<ReviewLanding />} />
      <Route path="/s/:city/:industry" element={<SeoLanding />} />
      <Route path="/s/:city" element={<SeoLanding />} />

      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Login defaultSignup />} />
      </Route>

      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      <Route element={<RequireOrganization />}>
        <Route path="/dashboard" element={<SubscriberLayout />}>
          <Route index           element={<Dashboard />} />
          <Route path="reviews"       element={<ReviewsCenter />} />
          <Route path="replies"       element={<ResponsesInbox />} />
          <Route path="analytics"     element={<Analytics />} />
          <Route path="insights"      element={<Insights />} />
          <Route path="branches"      element={<Branches />} />
          <Route path="templates"     element={<Templates />} />
          <Route path="qr"            element={<QrReviews />} />
          <Route path="team"          element={<Team />} />
          <Route path="integrations"  element={<Integrations />} />
          <Route path="tasks"         element={<Tasks />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="billing"       element={<Billing />} />
          <Route path="support"       element={<Support />} />
          <Route path="settings"      element={<Settings />} />
        </Route>
      </Route>

      {/* ======================================================= */}
      {/* ADMIN ROUTES                                             */}
      {/* ======================================================= */}

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"       element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
        <Route path="admins"          element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
        <Route path="roles"           element={<Suspense fallback={<PageLoader />}><AdminRoles /></Suspense>} />
        <Route path="subscribers"     element={<Suspense fallback={<PageLoader />}><AdminSubscribers /></Suspense>} />
        <Route path="billing"         element={<Suspense fallback={<PageLoader />}><AdminBilling /></Suspense>} />
        <Route path="ai-usage"        element={<Suspense fallback={<PageLoader />}><AdminAIUsage /></Suspense>} />
        <Route path="payment-gateway" element={<Suspense fallback={<PageLoader />}><AdminPaymentGateway /></Suspense>} />
        <Route path="tickets"         element={<Suspense fallback={<PageLoader />}><AdminTickets /></Suspense>} />
        <Route path="integrations"    element={<Suspense fallback={<PageLoader />}><AdminIntegrations /></Suspense>} />
        <Route path="plans"           element={<Suspense fallback={<PageLoader />}><AdminPlans /></Suspense>} />
        <Route path="templates"      element={<Suspense fallback={<PageLoader />}><AdminTemplates /></Suspense>} />
        <Route path="settings"        element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
        <Route path="audit-logs"      element={<Suspense fallback={<PageLoader />}><AdminAuditLogs /></Suspense>} />
        <Route path="profile"         element={<Suspense fallback={<PageLoader />}><AdminProfile /></Suspense>} />
        <Route path="security"        element={<Suspense fallback={<PageLoader />}><AdminSecurity /></Suspense>} />
      </Route>

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}
