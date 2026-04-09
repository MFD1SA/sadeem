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

// ── Eagerly loaded — only auth-critical pages ─────────────────────────────
import Login         from '@/pages/Auth/Login';
import AuthCallback  from '@/pages/Auth/Callback';
import ResetPassword from '@/pages/Auth/ResetPassword';
import Onboarding    from '@/pages/Onboarding';

// ── Lazy loaded — subscriber pages (load on first visit, then cached) ─────
const Dashboard      = lazyWithRetry(() => import('@/pages/Dashboard'));
const ReviewsCenter  = lazyWithRetry(() => import('@/pages/ReviewsCenter'));
const ResponsesInbox = lazyWithRetry(() => import('@/pages/ResponsesInbox'));
const Analytics      = lazyWithRetry(() => import('@/pages/Analytics'));
const Insights       = lazyWithRetry(() => import('@/pages/Insights'));
const Branches       = lazyWithRetry(() => import('@/pages/Branches'));
const Templates      = lazyWithRetry(() => import('@/pages/Templates'));
const Team           = lazyWithRetry(() => import('@/pages/Team'));
const Integrations   = lazyWithRetry(() => import('@/pages/Integrations'));
const QrReviews      = lazyWithRetry(() => import('@/pages/QrReviews'));
const Tasks          = lazyWithRetry(() => import('@/pages/Tasks'));
const Notifications  = lazyWithRetry(() => import('@/pages/Notifications'));
const Billing        = lazyWithRetry(() => import('@/pages/Billing'));
const Support        = lazyWithRetry(() => import('@/pages/Support'));
const Settings       = lazyWithRetry(() => import('@/pages/Settings'));
const ReviewLanding  = lazyWithRetry(() => import('@/pages/ReviewLanding'));
const SeoLanding     = lazyWithRetry(() => import('@/pages/SeoLanding'));
const HomePage       = lazyWithRetry(() => import('@/pages/HomePage'));
const PrivacyPage    = lazyWithRetry(() => import('@/pages/legal/PrivacyPage'));
const TermsPage      = lazyWithRetry(() => import('@/pages/legal/TermsPage'));
const FeaturesPage          = lazyWithRetry(() => import('@/pages/marketing/FeaturesPage'));
const ReviewsManagementPage = lazyWithRetry(() => import('@/pages/marketing/ReviewsManagementPage'));
const AiRepliesPage         = lazyWithRetry(() => import('@/pages/marketing/AiRepliesPage'));
const AnalyticsMarketingPage = lazyWithRetry(() => import('@/pages/marketing/AnalyticsPage'));
const BranchesMarketingPage  = lazyWithRetry(() => import('@/pages/marketing/BranchesPage'));

// ── Public pages (lazy — each page loads only when visited) ────────────────
const AboutPage           = lazyWithRetry(() => import('@/pages/public/AboutPage'));
const PublicFeaturesPage  = lazyWithRetry(() => import('@/pages/public/FeaturesPage'));
const PricingPage         = lazyWithRetry(() => import('@/pages/public/PricingPage'));
const FaqPage             = lazyWithRetry(() => import('@/pages/public/FaqPage'));
const BlogPage            = lazyWithRetry(() => import('@/pages/public/BlogPage'));
const ArticlePage         = lazyWithRetry(() => import('@/pages/public/ArticlePage'));
const ContactPage         = lazyWithRetry(() => import('@/pages/public/ContactPage'));

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

      <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
      <Route path="/story"   element={<Navigate to="/" replace />} />
      <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
      <Route path="/terms"   element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
      <Route path="/features"            element={<Suspense fallback={<PageLoader />}><PublicFeaturesPage /></Suspense>} />
      <Route path="/reviews-management"  element={<Navigate to="/features" replace />} />
      <Route path="/ai-replies"          element={<Navigate to="/features" replace />} />
      <Route path="/analytics-page"      element={<Navigate to="/features" replace />} />
      <Route path="/branches-page"       element={<Navigate to="/features" replace />} />

      {/* Public pages */}
      <Route path="/about"      element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
      <Route path="/pricing"    element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
      <Route path="/faq"        element={<Suspense fallback={<PageLoader />}><FaqPage /></Suspense>} />
      <Route path="/blog"        element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
      <Route path="/blog/:slug"  element={<Suspense fallback={<PageLoader />}><ArticlePage /></Suspense>} />
      <Route path="/contact-us" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />

      <Route path="/r/:slug" element={<Suspense fallback={<PageLoader />}><ReviewLanding /></Suspense>} />
      <Route path="/s/:city/:industry" element={<Suspense fallback={<PageLoader />}><SeoLanding /></Suspense>} />
      <Route path="/s/:city" element={<Suspense fallback={<PageLoader />}><SeoLanding /></Suspense>} />

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
          <Route index           element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="reviews"       element={<Suspense fallback={<PageLoader />}><ReviewsCenter /></Suspense>} />
          <Route path="replies"       element={<Suspense fallback={<PageLoader />}><ResponsesInbox /></Suspense>} />
          <Route path="analytics"     element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
          <Route path="insights"      element={<Suspense fallback={<PageLoader />}><Insights /></Suspense>} />
          <Route path="branches"      element={<Suspense fallback={<PageLoader />}><Branches /></Suspense>} />
          <Route path="templates"     element={<Suspense fallback={<PageLoader />}><Templates /></Suspense>} />
          <Route path="qr"            element={<Suspense fallback={<PageLoader />}><QrReviews /></Suspense>} />
          <Route path="team"          element={<Suspense fallback={<PageLoader />}><Team /></Suspense>} />
          <Route path="integrations"  element={<Suspense fallback={<PageLoader />}><Integrations /></Suspense>} />
          <Route path="tasks"         element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<PageLoader />}><Notifications /></Suspense>} />
          <Route path="billing"       element={<Suspense fallback={<PageLoader />}><Billing /></Suspense>} />
          <Route path="support"       element={<Suspense fallback={<PageLoader />}><Support /></Suspense>} />
          <Route path="settings"      element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
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
