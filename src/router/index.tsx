import { Routes, Route, Navigate } from 'react-router-dom';
import { SubscriberLayout } from '@/layouts/SubscriberLayout';
import { RequireAuth, RequireOrganization, RedirectIfAuthenticated } from './guards';

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

export function AppRouter() {
  return (
    <Routes>
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

      {/* Catch-all: redirect to login (safe default) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
