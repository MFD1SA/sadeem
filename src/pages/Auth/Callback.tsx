// ============================================================================
// SADEEM — Auth Callback
// Handles PKCE code exchange after Google / OAuth redirect.
// Shows a branded loading screen, then navigates to /dashboard.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    const go = (path: string) => {
      if (done.current) return;
      done.current = true;
      navigate(path, { replace: true });
    };

    // Supabase detects ?code= in the URL automatically (detectSessionInUrl: true).
    // We just wait for SIGNED_IN, then redirect to dashboard.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        go('/dashboard');
      } else if (event === 'INITIAL_SESSION') {
        if (session) {
          subscription.unsubscribe();
          go('/dashboard');
        } else {
          // No session in the callback — go back to login
          subscription.unsubscribe();
          go('/login');
        }
      }
    });

    // Also check immediately (session may already be exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        go('/dashboard');
      }
    });

    // Safety timeout — never leave user stuck on this page
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      go('/login');
    }, 8000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <span className="text-white text-2xl font-bold">س</span>
        </div>
        <div className="text-sm font-medium text-content-primary mb-1">سديم</div>
        <div className="text-xs text-content-tertiary mb-4">جاري تسجيل الدخول…</div>
        <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
