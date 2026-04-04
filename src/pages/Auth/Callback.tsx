// ============================================================================
// SENDA — Auth Callback
// Handles two flows:
//   1. Google OAuth PKCE  — URL has ?code=  (Supabase exchanges automatically)
//   2. Email confirmation — URL has ?token_hash=&type=email (must call verifyOtp)
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

    const sp = new URLSearchParams(window.location.search);
    const tokenHash = sp.get('token_hash');
    const type = sp.get('type');

    // ── Email confirmation flow ──────────────────────────────────────────────
    // Supabase sends: /auth/callback?token_hash=xxx&type=email
    if (tokenHash && type === 'email') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
        .then(({ data, error }) => {
          if (!error && data.session) go('/dashboard');
          else go('/login?error=confirmation_failed');
        });
      return;
    }

    // ── Password reset flow ──────────────────────────────────────────────────
    // Supabase sends: /auth/callback?token_hash=xxx&type=recovery
    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        .then(({ data, error }) => {
          if (!error && data.session) go('/reset-password');
          else go('/login?error=confirmation_failed');
        });
      return;
    }

    // ── Google OAuth PKCE flow ───────────────────────────────────────────────
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
      <div className="text-center flex flex-col items-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-brand-500 animate-spin mb-4" />
        <p className="text-sm text-content-tertiary">{document.documentElement.lang === 'en' ? 'Signing in…' : 'جاري تسجيل الدخول…'}</p>
      </div>
    </div>
  );
}
