import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('جاري تسجيل الدخول...');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // Wait for Supabase to process the OAuth callback from URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (cancelled) return;

        if (error) {
          console.error('[Sadeem] Auth callback error:', error);
          setStatus('حدث خطأ في تسجيل الدخول');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        if (session) {
          setStatus('تم تسجيل الدخول بنجاح');
          // Short delay to let AuthProvider detect the session
          setTimeout(() => {
            if (!cancelled) navigate('/dashboard', { replace: true });
          }, 500);
        } else {
          // No session yet - listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, newSession: any) => {
            if (cancelled) return;
            if (event === 'SIGNED_IN' && newSession) {
              setStatus('تم تسجيل الدخول بنجاح');
              setTimeout(() => {
                if (!cancelled) navigate('/dashboard', { replace: true });
              }, 500);
              subscription.unsubscribe();
            }
          });

          // Fallback timeout
          setTimeout(() => {
            if (!cancelled) {
              subscription.unsubscribe();
              navigate('/login', { replace: true });
            }
          }, 8000);
        }
      } catch (err) {
        console.error('[Sadeem] Auth callback failed:', err);
        if (!cancelled) {
          setStatus('حدث خطأ');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }
    };

    handleCallback();

    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'IBM Plex Sans Arabic, Inter, system-ui, sans-serif',
      background: '#f8f9fb',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e5e7ed',
        borderTopColor: '#3b5bdb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '16px',
      }} />
      <p style={{ fontSize: '14px', color: '#5f6580' }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
