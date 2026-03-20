import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('جاري تسجيل الدخول...');

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: number | undefined;

    const finishSuccess = () => {
      setStatus('تم تسجيل الدخول بنجاح');
      window.setTimeout(() => {
        if (!cancelled) navigate('/onboarding', { replace: true });
      }, 500);
    };

    const failToLogin = () => {
      setStatus('تعذر إكمال تسجيل الدخول');
      window.setTimeout(() => {
        if (!cancelled) navigate('/login', { replace: true });
      }, 2000);
    };

    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[Sadeem] exchangeCodeForSession error:', error);
          }
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session) {
          finishSuccess();
          return;
        }

        if (error) {
          console.error('[Sadeem] getSession error:', error);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (cancelled) return;

          if (event === 'SIGNED_IN' && newSession) {
            if (fallbackTimer) window.clearTimeout(fallbackTimer);
            authListener.subscription.unsubscribe();
            finishSuccess();
          }
        });

        fallbackTimer = window.setTimeout(async () => {
          authListener.subscription.unsubscribe();

          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();

          if (cancelled) return;

          if (retrySession) {
            finishSuccess();
          } else {
            failToLogin();
          }
        }, 2500);
      } catch (err) {
        console.error('[Sadeem] Auth callback failed:', err);
        if (!cancelled) failToLogin();
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'IBM Plex Sans Arabic, Inter, system-ui, sans-serif',
        background: '#f8f9fb',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7ed',
          borderTopColor: '#3b5bdb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px',
        }}
      />
      <p style={{ fontSize: '14px', color: '#5f6580' }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
