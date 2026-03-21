import { Routes, Route, Navigate } from 'react-router-dom';
import { SubscriberLayout } from '@/layouts/SubscriberLayout';
import { RequireAuth, RequireOrganization, RedirectIfAuthenticated } from './guards';

// --- Subscriber pages ---
import Login from '@/pages/Auth/Login';
import AuthCallback from '@/pages/Auth/Callback';
import Onboarding from '@/pages/Onboarding';

import Dashboard from '@/pages/Dashboard';
import ReviewsCenter from '@/pages/ReviewsCenter';
import ResponsesInbox from '@/pages/ResponsesInbox';
import Analytics from '@/pages/Analytics';
import Insights from '@/pages/Insights';
import Branches from '@/pages/Branches';
import Templates from '@/pages/Templates';
import Team from '@/pages/Team';
import Integrations from '@/pages/Integrations';
import QrReviews from '@/pages/QrReviews';
import Tasks from '@/pages/Tasks';
import Notifications from '@/pages/Notifications';
import Billing from '@/pages/Billing';
import Support from '@/pages/Support';
import Settings from '@/pages/Settings';
import ReviewLanding from '@/pages/ReviewLanding';

// --- Admin pages (completely independent layer) ---
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import AdminLogin from '@/admin/pages/AdminLogin';
import AdminDashboard from '@/admin/pages/AdminDashboard';
import AdminUsers from '@/admin/pages/AdminUsers';
import AdminRoles from '@/admin/pages/AdminRoles';
import AdminSettings from '@/admin/pages/AdminSettings';
import AdminProfile from '@/admin/pages/AdminProfile';
import AdminSecurity from '@/admin/pages/AdminSecurity';
import AdminSubscribers from '@/admin/pages/AdminSubscribers';
import AdminBilling from '@/admin/pages/AdminBilling';
import AdminAIUsage from '@/admin/pages/AdminAIUsage';
import AdminPaymentGateway from '@/admin/pages/AdminPaymentGateway';

export function AppRouter() {
  return (
    <Routes>
      {/* ========================================= */}
      {/* SUBSCRIBER ROUTES (unchanged)             */}
      {/* ========================================= */}

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public: Review Landing Page (no auth required) */}
      <Route path="/r/:slug" element={<ReviewLanding />} />

      {/* Public routes */}
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Auth callback */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Onboarding (auth required, no org required) */}
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Dashboard (auth + org required) */}
      <Route element={<RequireOrganization />}>
        <Route path="/dashboard" element={<SubscriberLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="reviews" element={<ReviewsCenter />} />
          <Route path="replies" element={<ResponsesInbox />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="insights" element={<Insights />} />
          <Route path="branches" element={<Branches />} />
          <Route path="templates" element={<Templates />} />
          <Route path="qr" element={<QrReviews />} />
          <Route path="team" element={<Team />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="billing" element={<Billing />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* ========================================= */}
      {/* ADMIN ROUTES (independent layer)          */}
      {/* AdminAuthProvider is inside AdminLayout,   */}
      {/* NOT in main.tsx — zero impact on subscriber*/}
      {/* ========================================= */}

      {/* Admin login (public, own auth provider) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin authenticated routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="admins" element={<AdminUsers />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="subscribers" element={<AdminSubscribers />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="ai-usage" element={<AdminAIUsage />} />
        <Route path="payment-gateway" element={<AdminPaymentGateway />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="security" element={<AdminSecurity />} />
      </Route>

      {/* Catch-all: redirect to login (safe default) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
