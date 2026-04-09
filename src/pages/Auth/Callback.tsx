// ============================================================================
// SENDA — Auth Callback
// Handles three flows:
//   1. Google OAuth PKCE  — URL has ?code=  (Supabase exchanges automatically)
//   2. Email confirmation — URL has ?token_hash=&type=email (must call verifyOtp)
//   3. Google Business linking — URL has ?from=integrations (save tokens to DB)
// Shows a branded loading screen, then navigates appropriately.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * After Google OAuth for Business Profile linking, capture provider_token
 * and provider_refresh_token from the session and save them to google_tokens.
 */
async function saveGoogleTokensIfNeeded(
  session: { provider_token?: string | null; provider_refresh_token?: string | null; user: { id: string; email?: string } },
  fromIntegrations: boolean,
) {
  if (!fromIntegrations || !session.provider_token) return;

  try {
    // Get the user's organization
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!membership?.organization_id) {
      console.warn('[Callback] No organization found for token save');
      return;
    }

    // Save tokens via RPC
    const { error } = await supabase.rpc('save_google_tokens', {
      p_organization_id: membership.organization_id,
      p_access_token: session.provider_token,
      p_refresh_token: session.provider_refresh_token || null,
      p_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(), // ~1 hour
      p_google_email: session.user.email || null,
    });

    if (error) {
      console.error('[Callback] Failed to save Google tokens:', error.message);
    } else {
      console.log('[Callback] Google tokens saved successfully');
    }
  } catch (err) {
    console.error('[Callback] Error saving Google tokens:', err);
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const fromIntegrations = sp.get('from') === 'integrations';

    const go = (path: string) => {
      if (done.current) return;
      done.current = true;
      navigate(path, { replace: true });
    };

    const tokenHash = sp.get('token_hash');
    const type = sp.get('type');

    // ── Email confirmation flow ──────────────────────────────────────────────
    if (tokenHash && type === 'email') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
        .then(({ data, error }) => {
          if (!error && data.session) go('/dashboard');
          else go('/login?error=confirmation_failed');
        });
      return;
    }

    // ── Password reset flow ──────────────────────────────────────────────────
    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        .then(({ data, error }) => {
          if (!error && data.session) go('/reset-password');
          else go('/login?error=confirmation_failed');
        });
      return;
    }

    // ── Google OAuth PKCE flow ───────────────────────────────────────────────
    const defaultRedirect = fromIntegrations ? '/dashboard/integrations' : '/dashboard';

    const handleSession = async (session: unknown) => {
      const s = session as { provider_token?: string | null; provider_refresh_token?: string | null; user: { id: string; email?: string } } | null;
      if (!s) return;

      // Save Google tokens to DB if coming from integrations page
      await saveGoogleTokensIfNeeded(s, fromIntegrations);

      go(defaultRedirect);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        handleSession(session);
      } else if (event === 'INITIAL_SESSION') {
        if (session) {
          subscription.unsubscribe();
          handleSession(session);
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
        handleSession(session);
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
