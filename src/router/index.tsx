import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SubscriberLayout } from '@/layouts/SubscriberLayout';
import { RequireAuth, RequireOrganization, RedirectIfAuthenticated } from './guards';
import { LoadingState } from '@/components/ui/LoadingState';

// ── Eagerly loaded (critical path) ──────────────────────────────────────────
import Login from '@/pages/Auth/Login';
import AuthCallback from '@/pages/Auth/Callback';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';

// ── Lazily loaded subscriber pages ──────────────────────────────────────────
const reviewsCenterImport  = () => import('@/pages/ReviewsCenter');
const responsesInboxImport = () => import('@/pages/ResponsesInbox');
const analyticsImport      = () => import('@/pages/Analytics');
const insightsImport       = () => import('@/pages/Insights');
const branchesImport       = () => import('@/pages/Branches');
const templatesImport      = () => import('@/pages/Templates');
const teamImport           = () => import('@/pages/Team');
const integrationsImport   = () => import('@/pages/Integrations');
const qrReviewsImport      = () => import('@/pages/QrReviews');
const tasksImport          = () => import('@/pages/Tasks');
const notificationsImport  = () => import('@/pages/Notifications');
const billingImport        = () => import('@/pages/Billing');
const supportImport        = () => import('@/pages/Support');
const settingsImport       = () => import('@/pages/Settings');

const ReviewsCenter   = lazy(reviewsCenterImport);
const ResponsesInbox  = lazy(responsesInboxImport);
const Analytics       = lazy(analyticsImport);
const Insights        = lazy(insightsImport);
const Branches        = lazy(branchesImport);
const Templates       = lazy(templatesImport);
const Team            = lazy(teamImport);
const Integrations    = lazy(integrationsImport);
const QrReviews       = lazy(qrReviewsImport);
const Tasks           = lazy(tasksImport);
const Notifications   = lazy(notificationsImport);
const Billing         = lazy(billingImport);
const Support         = lazy(supportImport);
const Settings        = lazy(settingsImport);
const ReviewLanding   = lazy(() => import('@/pages/ReviewLanding'));

// Prefetch all subscriber page chunks in the background after initial load.
// This eliminates the per-page JS download delay when navigating the sidebar.
export function prefetchSubscriberPages() {
  const imports = [
    reviewsCenterImport, responsesInboxImport, analyticsImport, insightsImport,
    branchesImport, templatesImport, teamImport, integrationsImport,
    qrReviewsImport, tasksImport, notificationsImport, billingImport,
    supportImport, settingsImport,
  ];
  // Stagger prefetches to avoid congesting the network on first load
  imports.forEach((fn, i) => setTimeout(fn, 500 + i * 150));
}

// ── Lazily loaded admin pages ────────────────────────────────────────────────
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import AdminLogin from '@/admin/pages/AdminLogin';

const AdminDashboard      = lazy(() => import('@/admin/pages/AdminDashboard'));
const AdminUsers          = lazy(() => import('@/admin/pages/AdminUsers'));
const AdminRoles          = lazy(() => import('@/admin/pages/AdminRoles'));
const AdminSettings       = lazy(() => import('@/admin/pages/AdminSettings'));
const AdminProfile        = lazy(() => import('@/admin/pages/AdminProfile'));
const AdminSecurity       = lazy(() => import('@/admin/pages/AdminSecurity'));
const AdminSubscribers    = lazy(() => import('@/admin/pages/AdminSubscribers'));
const AdminBilling        = lazy(() => import('@/admin/pages/AdminBilling'));
const AdminAIUsage        = lazy(() => import('@/admin/pages/AdminAIUsage'));
const AdminPaymentGateway = lazy(() => import('@/admin/pages/AdminPaymentGateway'));
const AdminAuditLogs      = lazy(() => import('@/admin/pages/AdminAuditLogs'));
const AdminTickets        = lazy(() => import('@/admin/pages/AdminTickets'));
const AdminIntegrations   = lazy(() => import('@/admin/pages/AdminIntegrations'));
const AdminPlans          = lazy(() => import('@/admin/pages/AdminPlans'));

function PageLoader() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <LoadingState />
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      {/* ======================================================= */}
      {/* SUBSCRIBER ROUTES                                        */}
      {/* ======================================================= */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/r/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <ReviewLanding />
          </Suspense>
        }
      />

      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      <Route element={<RequireOrganization />}>
        <Route path="/dashboard" element={<SubscriberLayout />}>
          <Route index element={<Dashboard />} />
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
        <Route path="settings"        element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
        <Route path="audit-logs"      element={<Suspense fallback={<PageLoader />}><AdminAuditLogs /></Suspense>} />
        <Route path="profile"         element={<Suspense fallback={<PageLoader />}><AdminProfile /></Suspense>} />
        <Route path="security"        element={<Suspense fallback={<PageLoader />}><AdminSecurity /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
