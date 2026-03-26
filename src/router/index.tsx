// ============================================================================
// SADEEM — App Router
// Subscriber pages are eagerly loaded for instant sidebar navigation
// (no per-page JS download delay). Admin pages stay lazy — they are
// rarely visited and not part of the subscriber hot path.
// ============================================================================
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SubscriberLayout } from '@/layouts/SubscriberLayout';
import { RequireAuth, RequireOrganization, RedirectIfAuthenticated } from './guards';
import { LoadingState } from '@/components/ui/LoadingState';

// ── Eagerly loaded — critical path + all subscriber pages ───────────────────
import Login        from '@/pages/Auth/Login';
import AuthCallback from '@/pages/Auth/Callback';
import Onboarding   from '@/pages/Onboarding';
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

// ── Lazily loaded admin pages (infrequently visited) ────────────────────────
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

      <Route path="/r/:slug" element={<ReviewLanding />} />

      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/auth/callback" element={<AuthCallback />} />

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
        <Route path="settings"        element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
        <Route path="audit-logs"      element={<Suspense fallback={<PageLoader />}><AdminAuditLogs /></Suspense>} />
        <Route path="profile"         element={<Suspense fallback={<PageLoader />}><AdminProfile /></Suspense>} />
        <Route path="security"        element={<Suspense fallback={<PageLoader />}><AdminSecurity /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
