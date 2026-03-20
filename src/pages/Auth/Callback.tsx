import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('جاري تسجيل الدخول...');

  useEffect(() => {
    let cancelled = false;

    const goLogin = () => {
      window.setTimeout(() => {
        if (!cancelled) navigate('/login', { replace: true });
      }, 1500);
    };

    const goOnboarding = () => {
      window.setTimeout(() => {
        if (!cancelled) navigate('/onboarding', { replace: true });
      }, 500);
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);

        // PKCE flow: ?code=...
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[Sadeem] exchangeCodeForSession error:', error);
          }
        }

        // Hash flow: #access_token=...&refresh_token=...
        if (window.location.hash.includes('access_token')) {
          const hash = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hash.get('access_token');
          const refresh_token = hash.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error('[Sadeem] setSession from hash error:', error);
            } else {
              window.history.replaceState({}, document.title, '/auth/callback');
            }
          }
        }

        // Retry session detection عدة مرات
        for (let i = 0; i < 8; i++) {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (session) {
            setStatus('تم تسجيل الدخول بنجاح');
            goOnboarding();
            return;
          }

          if (error) {
            console.error('[Sadeem] getSession error:', error);
          }

          await sleep(500);
        }

        console.error('[Sadeem] Session not found after callback');
        setStatus('تعذر إكمال تسجيل الدخول');
        goLogin();
      } catch (err) {
        console.error('[Sadeem] Auth callback failed:', err);
        setStatus('حدث خطأ في تسجيل الدخول');
        goLogin();
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
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
