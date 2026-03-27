// ============================================================================
// SADEEM — Story Page (قصة سديم)
// Premium dark public page — matches homepage design tokens
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const C = {
  bg:     '#0F1117',
  card:   '#151922',
  border: '#242A36',
  text:   '#F3F4F6',
  muted:  '#A7AFBD',
  cyan:   '#06B6D4',
  purple: '#8B5CF6',
};
const GRAD = 'linear-gradient(135deg, #06B6D4, #8B5CF6)';

export default function StoryPage() {
  const navigate = useNavigate();

  return (
    <div dir="rtl" style={{ background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* ── Header — matches main site ── */}
      <div style={{
        background: 'rgba(15,17,23,0.96)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14 }}
            onMouseOver={e => (e.currentTarget.style.color = C.text)}
            onMouseOut={e => (e.currentTarget.style.color = C.muted)}
          >
            <ArrowRight size={16} />
            <span>العودة للرئيسية</span>
          </button>

          {/* Logo — no background, no border, no box */}
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img src="/sadeem-logo.png" alt="SADEEM | سديم" style={{ height: 30, width: 'auto', display: 'block' }} />
          </button>

          {/* CTA */}
          <button
            onClick={() => navigate('/register')}
            style={{
              background: GRAD,
              color: 'white',
              fontSize: 13,
              padding: '8px 20px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              boxShadow: '0 4px 14px rgba(6,182,212,0.22)',
            }}
          >ابدأ مجانًا</button>
        </div>
      </div>

      {/* ── Hero image — provided image exactly ── */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(280px, 46vw, 540px)', overflow: 'hidden' }}>
        <img
          src="/story-hero.jpg"
          alt="سديم"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Fade bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to bottom, transparent, #0F1117)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Story content — exact text as provided ── */}
      <section style={{ padding: '72px 0 96px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

          {/* Opening line */}
          <p style={{
            fontSize: 'clamp(22px, 3.5vw, 34px)',
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.55,
            marginBottom: 48,
          }}>
            سديم لم تبدأ كفكرة… بل كحاجة.
          </p>

          {/* Divider */}
          <div style={{ width: 48, height: 3, background: GRAD, borderRadius: 2, marginBottom: 48 }} />

          {/* Block 1 */}
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 2, marginBottom: 40, fontWeight: 400 }}>
            في عالم أصبحت فيه التقييمات هي أول ما يراه العميل،<br />
            لم يعد الانطباع الأول يُبنى داخل المتجر… بل على Google.
          </p>

          {/* Emphasis line */}
          <p style={{
            fontSize: 'clamp(17px, 2.2vw, 22px)',
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.6,
            marginBottom: 40,
          }}>
            وهنا ظهرت المشكلة.
          </p>

          {/* Block 2 */}
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 2, marginBottom: 48, fontWeight: 400 }}>
            التقييمات تتدفق،<br />
            لكن الردود؟<br />
            إما متأخرة، أو مكررة، أو غير احترافية.
          </p>

          {/* Emphasis line */}
          <p style={{
            fontSize: 'clamp(17px, 2.2vw, 22px)',
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.6,
            marginBottom: 48,
          }}>
            سديم وُجدت لتغيّر ذلك.
          </p>

          {/* Block 3 — gradient accent */}
          <div style={{
            borderRight: `3px solid`,
            borderImage: `${GRAD} 1`,
            paddingRight: 28,
            marginBottom: 56,
          }}>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 2.1, margin: 0, fontWeight: 400 }}>
              ليست أداة ردود…<br />
              بل كيان يفهم ما يُقال،<br />
              يحلل النبرة،<br />
              ويصنع ردًا يعكس هوية النشاط بدقة.
            </p>
          </div>

          {/* Closing lines */}
          <p style={{
            fontSize: 'clamp(17px, 2.5vw, 24px)',
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.7,
            marginBottom: 48,
          }}>
            سديم لا تكتب فقط…<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              سديم تفهم، وتقرر، وتتصرف.
            </span>
          </p>

          <p style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', color: C.muted, lineHeight: 2, fontWeight: 400 }}>
            من أول تقييم…<br />
            إلى بناء صورة رقمية متكاملة.
          </p>

        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ background: '#0A0D14', borderTop: `1px solid ${C.border}`, padding: '24px 0' }}>
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
        >
          <img src="/sadeem-logo.png" alt="SADEEM" style={{ height: 22, width: 'auto', opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: C.muted, margin: 0, opacity: 0.6 }}>© 2026 سديم. جميع الحقوق محفوظة.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'سياسة الخصوصية', path: '/privacy' },
              { label: 'شروط الاستخدام', path: '/terms' },
            ].map(l => (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.muted, opacity: 0.6 }}
                onMouseOver={e => { e.currentTarget.style.opacity = '1'; }}
                onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; }}
              >{l.label}</button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
