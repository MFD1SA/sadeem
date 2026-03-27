// ============================================================================
// SADEEM — Public Marketing Homepage
// Colors: bg=#0F1117 · card=#151922 · border=#242A36
//         text=#F3F4F6 · muted=#A7AFBD · brand=#C9D8E6
// Typography: Semibold headings, Medium labels, Regular body — no excessive bold
// Routing: دخول المشتركين → /login  |  تسجيل جديد → /login
// Contact form submits to Edge Function (destination email never exposed)
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageSquare, QrCode, BarChart3, Building2, Users, Zap, Shield,
  Brain, FileText, CheckCircle2, X, ChevronDown, Send, Loader2, Menu,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#0F1117',
  card:    '#151922',
  card2:   '#1A2030',
  border:  '#242A36',
  text:    '#F3F4F6',
  muted:   '#A7AFBD',
  brand:   '#C9D8E6',
  cyan:    '#06B6D4',
  purple:  '#8B5CF6',
  green:   '#10B981',
  amber:   '#F59E0B',
  pink:    '#EC4899',
  orange:  '#F97316',
  red:     '#EF4444',
  indigo:  '#6366F1',
};
const GRAD = 'linear-gradient(135deg, #06B6D4, #8B5CF6)';

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV: { label: string; id?: string; href?: string }[] = [
  { label: 'الرئيسية',        id: 'hero'         },
  { label: 'المميزات',        id: 'features'     },
  { label: 'كيف تعمل',       id: 'how-it-works' },
  { label: 'الأسعار',         id: 'pricing'      },
  { label: 'الأسئلة الشائعة', id: 'faq'         },
  { label: 'قصة سديم',        href: '/story'     },
  { label: 'اتصل بنا',        id: 'contact'      },
];

// ─── Static QR pixel pattern (8×8 deterministic) ─────────────────────────────
const QR_GRID = [
  1,1,1,0,1,1,1,1,
  1,0,1,1,0,0,1,0,
  1,0,1,0,1,1,1,1,
  0,1,0,1,0,1,0,0,
  1,1,1,1,1,0,1,1,
  0,0,1,0,0,1,0,1,
  1,1,0,1,1,1,0,1,
  1,0,1,1,0,0,1,1,
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
function SectionLabel({ color = C.cyan, children }: { color?: string; children: string }) {
  return (
    <div style={{ fontSize: 12, color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {children}
    </div>
  );
}

function CheckItem({ children, color = C.cyan }: { children: string; color?: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{children}</span>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const [faqOpen,    setFaqOpen]      = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  // Navbar background on scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setFormError('');
    try {
      const { error } = await supabase.functions.invoke('send-contact', { body: form });
      if (error) throw error;
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err) {
      console.error('[Contact]', err);
      setStatus('error');
      setFormError('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.');
    }
  };

  // ── Input style helper ──
  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = C.cyan);
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = C.border);

  return (
    <div dir="rtl" style={{ background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════
          MAIN NAVBAR (sticky)
      ══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(15,17,23,0.96)' : 'rgba(15,17,23,0.8)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        transition: 'all 0.25s ease',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo */}
          {/* Logo — actual SADEEM PNG in a white container so it renders on dark bg */}
          <button onClick={() => scrollTo('hero')} className="flex items-center flex-shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: '5px 14px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
              <img src="/sadeem-logo.png" alt="SADEEM | سديم" style={{ height: 28, width: 'auto', display: 'block' }} />
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {NAV.map(n => (
              <button
                key={n.id ?? n.href}
                onClick={() => n.href ? navigate(n.href) : scrollTo(n.id!)}
                style={{ color: C.muted, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 400 }}
                onMouseOver={e => (e.currentTarget.style.color = C.text)}
                onMouseOut={e => (e.currentTarget.style.color = C.muted)}
              >{n.label}</button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language toggle */}
            <button
              style={{ color: C.muted, fontSize: 12, padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}
              className="hidden md:block"
              onMouseOver={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = '#374151'; }}
              onMouseOut={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
            >EN</button>
            <button
              onClick={() => navigate('/login')}
              style={{ color: C.muted, fontSize: 13, padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer' }}
              className="hidden sm:block"
              onMouseOver={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = C.text; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >دخول المشتركين</button>
            <button
              onClick={() => navigate('/login')}
              style={{ background: GRAD, color: 'white', fontSize: 13, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(6,182,212,0.25)', fontWeight: 500 }}
            >تسجيل جديد</button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              className="lg:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className="lg:hidden">
            <div style={{ padding: '12px 16px 16px' }}>
              {NAV.map(n => (
                <button
                  key={n.id ?? n.href}
                  onClick={() => n.href ? navigate(n.href) : scrollTo(n.id!)}
                  style={{ display: 'block', width: '100%', textAlign: 'right', padding: '12px 16px', color: C.muted, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10 }}
                  onMouseOver={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text; }}
                  onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = C.muted; }}
                >{n.label}</button>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate('/login')} style={{ flex: 1, color: C.muted, fontSize: 14, padding: '11px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer' }}>دخول المشتركين</button>
                <button onClick={() => navigate('/login')} style={{ flex: 1, background: GRAD, color: 'white', fontSize: 14, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>تسجيل جديد</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section id="hero" style={{ padding: '88px 0 100px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 700, background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.10) 0%, rgba(139,92,246,0.07) 40%, transparent 70%)' }} />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ position: 'relative' }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8" style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 30, padding: '6px 18px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.cyan }} className="animate-pulse" />
            <span style={{ color: C.cyan, fontSize: 13 }}>منصة إدارة تقييمات جوجل رقم 1 عربيًا</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(30px, 5.5vw, 62px)', fontWeight: 600, lineHeight: 1.28, marginBottom: 24, color: C.text, letterSpacing: '-0.01em' }}>
            كل تقييم جوجل{' '}
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              فرصة حقيقية
            </span>
            {' '}لنمو عملك
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, maxWidth: 620, margin: '0 auto 44px', lineHeight: 1.75, fontWeight: 400 }}>
            منصة بالذكاء الاصطناعي تساعدك على الرد على تقييمات جوجل، جمع تقييمات جديدة بالـ QR، وقياس أداء سمعتك عبر جميع فروعك — في مكان واحد
          </p>

          {/* Hero CTAs — 3 buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap" style={{ marginBottom: 64 }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: GRAD, color: 'white', fontSize: 15, padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(6,182,212,0.28)', fontWeight: 500 }}
            >ابدأ الآن</button>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'transparent', color: C.text, fontSize: 14, padding: '13px 24px', borderRadius: 12, border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 400 }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#374151'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = C.border; }}
            >دخول المشتركين</button>
            <button
              onClick={() => scrollTo('how-it-works')}
              style={{ background: 'transparent', color: C.muted, fontSize: 14, padding: '13px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseOver={e => (e.currentTarget.style.color = C.text)}
              onMouseOut={e => (e.currentTarget.style.color = C.muted)}
            >
              <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', border: `1px solid ${C.border}`, textAlign: 'center', lineHeight: '18px', fontSize: 10 }}>▶</span>
              شاهد كيف تعمل سديم
            </button>
          </div>

          {/* Dashboard visual — Google Reviews + AI reply composition */}
          <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
            {/* Glow halo behind the dashboard */}
            <div style={{ position: 'absolute', inset: -32, background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.08) 45%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, background: C.card, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 24, padding: 28, boxShadow: '0 48px 140px rgba(0,0,0,0.65), 0 0 0 1px rgba(6,182,212,0.06)' }}>
              {/* Window chrome */}
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <div className="flex items-center gap-1.5">
                  {[C.red, C.amber, C.green].map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c + '90' }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>لوحة تحكم سديم</div>
                <div style={{ width: 64, height: 8, background: C.border, borderRadius: 4 }} />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
                {[
                  { label: 'إجمالي التقييمات', value: '2,847', color: C.cyan },
                  { label: 'متوسط التقييم',    value: '4.8 ★', color: C.amber },
                  { label: 'نسبة الرد',        value: '94%',   color: C.green },
                  { label: 'هذا الشهر',        value: '+124',  color: C.purple },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Reviews list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { stars: 5, text: 'خدمة ممتازة وسريعة جدًا — سأعود بكل تأكيد!', replied: true },
                  { stars: 4, text: 'تجربة جيدة بشكل عام، بعض التفاصيل تحتاج تحسينًا',    replied: false },
                  { stars: 5, text: 'الأفضل في المنطقة بكل تأكيد. أنصح الجميع!',          replied: true  },
                ].map((r, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: C.amber, flexShrink: 0 }}>{'★'.repeat(r.stars)}</div>
                    <span style={{ fontSize: 11, color: C.muted, flex: 1, textAlign: 'right' }}>{r.text}</span>
                    <div style={{ fontSize: 10, padding: '2px 10px', borderRadius: 20, flexShrink: 0, background: r.replied ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: r.replied ? C.green : C.red }}>
                      {r.replied ? 'تم الرد' : 'انتظار'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating: AI reply card */}
            <div
              style={{ position: 'absolute', bottom: 32, left: -72, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.45)', width: 220 }}
              className="hidden xl:block"
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={13} style={{ color: 'white' }} />
                </div>
                <span style={{ fontSize: 12, color: C.cyan, fontWeight: 500 }}>رد ذكي جاهز</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>
                "شكرًا جزيلًا على تقييمك الرائع! يسعدنا دائمًا..."
              </p>
              <div className="flex gap-2">
                <div style={{ flex: 1, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 7, padding: '5px 0', fontSize: 11, color: C.cyan, textAlign: 'center' }}>نشر</div>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 10px', fontSize: 11, color: C.muted }}>تعديل</div>
              </div>
            </div>

            {/* Floating: Google review card */}
            <div
              style={{ position: 'absolute', top: 24, right: -80, background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', width: 210 }}
              className="hidden xl:block"
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#EA4335', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15, fontWeight: 700 }}>G</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>تقييم جوجل جديد</div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>منذ دقيقتين</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: '#F59E0B', marginBottom: 4 }}>★★★★★</div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>"أحسنتم! السرعة والجودة في مكان واحد"</p>
            </div>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center flex-wrap gap-8" style={{ marginTop: 60 }}>
            {[
              { val: '+500',  lbl: 'عمل نشط'       },
              { val: '98%',   lbl: 'رضا العملاء'    },
              { val: '4.8★',  lbl: 'تقييمنا'        },
              { val: '24/7',  lbl: 'دعم مستمر'      },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div style={{ fontSize: 24, fontWeight: 600, color: C.brand }}>{s.val}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BENEFITS STRIP
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '22px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: <Brain size={17} />,     label: 'ردود بالذكاء الاصطناعي', color: C.cyan   },
              { icon: <QrCode size={17} />,    label: 'جمع تقييمات بـ QR',      color: C.purple },
              { icon: <BarChart3 size={17} />, label: 'تحليلات متقدمة',         color: C.amber  },
              { icon: <Building2 size={17} />, label: 'إدارة الفروع',           color: C.green  },
              { icon: <Users size={17} />,     label: 'تعاون الفريق',           color: C.pink   },
              { icon: <Zap size={17} />,       label: 'تكاملات سلسة',           color: C.orange },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <span style={{ color: b.color }}>{b.icon}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CORE VALUES (8 cards)
      ══════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 60 }}>
            <SectionLabel>لماذا سديم؟</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 600, color: C.text, marginBottom: 14, letterSpacing: '-0.01em' }}>
              كل ما تحتاجه لإدارة سمعتك الرقمية
            </h2>
            <p style={{ fontSize: 17, color: C.muted, maxWidth: 520, margin: '0 auto', fontWeight: 400, lineHeight: 1.75 }}>
              سديم يجمع في منصة واحدة جميع الأدوات التي تحتاجها لتحسين تقييماتك وبناء ثقة عملائك
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Brain size={22} />,     color: C.cyan,   title: 'ردود بالذكاء الاصطناعي',  desc: 'ردود مخصصة لكل تقييم تعكس هوية علامتك في ثوانٍ معدودة'              },
              { icon: <Zap size={22} />,       color: C.amber,  title: 'سرعة رد غير مسبوقة',      desc: 'رد قبل المنافسين وأثبت لعملائك اهتمامك الحقيقي بآرائهم'            },
              { icon: <QrCode size={22} />,    color: C.purple, title: 'جمع تقييمات بـ QR',       desc: 'حوّل كل لقاء مع عميل إلى تقييم جوجل بمجرد مسح رمز بسيط'           },
              { icon: <BarChart3 size={22} />, color: C.green,  title: 'تحليلات عميقة',            desc: 'بيانات حقيقية عن أداء سمعتك لاتخاذ قرارات أذكى وأسرع'            },
              { icon: <Building2 size={22} />, color: C.pink,   title: 'إدارة متعددة الفروع',     desc: 'أدر جميع فروعك ومواقعك من لوحة تحكم مركزية واحدة'                  },
              { icon: <FileText size={22} />,  color: C.orange, title: 'قوالب ردود احترافية',    desc: 'مكتبة من القوالب الجاهزة يمكنك تخصيصها لتناسب نبرة علامتك'         },
              { icon: <Users size={22} />,     color: C.cyan,   title: 'إدارة الفريق',            desc: 'وزّع المهام وراقب أداء الفريق مع صلاحيات مخصصة لكل عضو'           },
              { icon: <Shield size={22} />,    color: C.indigo, title: 'أمان وموثوقية',           desc: 'بياناتك محمية بمعايير تشفير عالمية مع نسخ احتياطية تلقائية'        },
            ].map((c, i) => {
              const bgRgb = c.color.startsWith('#06') ? '6,182,212' : c.color.startsWith('#F5') ? '245,158,11' : c.color.startsWith('#8B') ? '139,92,246' : c.color.startsWith('#10') ? '16,185,129' : c.color.startsWith('#EC') ? '236,72,153' : c.color.startsWith('#F9') ? '249,115,22' : c.color.startsWith('#63') ? '99,102,241' : '6,182,212';
              return (
                <div
                  key={i}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, transition: 'all 0.2s ease', cursor: 'default' }}
                  onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = c.color + '50'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 12px 40px rgba(${bgRgb},0.12)`; }}
                  onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = C.border; el.style.transform = ''; el.style.boxShadow = ''; }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: `rgba(${bgRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 16 }}>
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{c.title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, fontWeight: 400, margin: 0 }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MARKETING SECTIONS (4 alternating)
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '20px 0 100px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>

          {/* ── 1: AI replies ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel color={C.cyan}>الذكاء الاصطناعي</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                الذكاء الاصطناعي يرد بدلًا عنك — بأسلوبك أنت
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                لا مزيد من قضاء ساعات في صياغة ردود على التقييمات. سديم يحلل كل تقييم ويولّد ردًا يناسب نبرة علامتك التجارية — سواء كان التقييم إيجابيًا أو سلبيًا. فقط راجع وانشر.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['تحليل المشاعر وفهم سياق التقييم تلقائيًا', 'ردود باللغة العربية والإنجليزية', 'تعديل النبرة بما يناسب نوع عملك', 'مراجعة وتعديل الرد قبل نشره'].map((t, i) => (
                  <CheckItem key={i} color={C.cyan}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.amber }}>★★★★★</span>
                    <span style={{ fontSize: 11, color: C.muted }}>محمد أحمد</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.text, margin: 0 }}>خدمة ممتازة ومحترفة. سأعود بكل تأكيد!</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={12} style={{ color: 'white' }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.cyan }}>سديم يولد ردًا مناسبًا...</span>
                </div>
                <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: '0 0 12px' }}>
                    شكرًا جزيلًا يا محمد على هذا التقييم الجميل! يسعدنا أنك أحببت تجربتك معنا، ننتظر زيارتك القادمة بكل سرور 😊
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, background: GRAD, color: 'white', fontSize: 12, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 500 }}>نشر الرد</button>
                    <button style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, padding: '8px 14px', borderRadius: 9, cursor: 'pointer' }}>تعديل</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2: QR Code ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <SectionLabel color={C.purple}>QR Reviews</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                اجمع تقييمات جوجل بمسح بسيط
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                بدلًا من طلب التقييم بشكل محرج، ضع QR Code على الطاولة أو المنصة أو الفاتورة. يمسحه العميل، يختار الموظف، ويصل مباشرة لصفحة جوجل.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['QR Code مخصص لكل فرع أو موظف', 'تتبع مصدر كل تقييم تلقائيًا', 'تصميم بهوية علامتك التجارية', 'بيانات آنية عن حجم التقييمات'].map((t, i) => (
                  <CheckItem key={i} color={C.purple}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="lg:order-1">
              {/* QR visual */}
              <div style={{ width: 156, height: 156, background: 'white', borderRadius: 16, padding: 14, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
                {QR_GRID.map((v, i) => (
                  <div key={i} style={{ background: v ? '#1F2937' : 'transparent', borderRadius: 2 }} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, textAlign: 'center' }}>امسح واكتب تقييمك على جوجل</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
                {[
                  { name: 'فرع الرياض', count: 47 },
                  { name: 'فرع جدة',    count: 32 },
                  { name: 'فرع الدمام', count: 28 },
                ].map((b, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 11, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: C.purple }}>{b.count}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{b.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3: Analytics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel color={C.green}>التحليلات</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                تحليلات تخبرك بما لا تراه بالعين المجردة
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                من أي فرع يأتي أكثر التقييمات؟ ما الكلمات التي تتكرر في التقييمات السلبية؟ متى يتراجع معدل الرد؟ سديم يجيب تلقائيًا حتى تعرف أين تركز جهودك.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['مقارنة الأداء بين جميع الفروع', 'تحليل المشاعر والكلمات المتكررة', 'تقارير أسبوعية وشهرية تلقائية', 'تنبيهات فورية للتقييمات السلبية'].map((t, i) => (
                  <CheckItem key={i} color={C.green}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>التقييمات هذا الشهر</span>
                <span style={{ fontSize: 13, color: C.green }}>↑ 23%</span>
              </div>
              {[
                { label: 'فرع الرياض', pct: 78 },
                { label: 'فرع جدة',    pct: 65 },
                { label: 'فرع الدمام', pct: 52 },
              ].map((b, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{b.label}</span>
                    <span style={{ fontSize: 12, color: C.text }}>{b.pct}%</span>
                  </div>
                  <div style={{ height: 7, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', background: `linear-gradient(90deg, ${C.green}, ${C.cyan})`, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                {[
                  { label: 'متوسط التقييم', value: '4.7', color: C.amber },
                  { label: 'معدل الرد',     value: '91%', color: C.green },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 4: Team ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <SectionLabel color={C.pink}>إدارة الفريق</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                فريقك الكامل في بيئة عمل واحدة
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                أضف أعضاء الفريق، خصص صلاحياتهم، واجعل كل شخص يرى فقط ما يحتاجه. من مدير الفرع إلى صاحب العمل — الجميع في صفحة واحدة بمعلومات صحيحة.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['أدوار وصلاحيات مرنة لكل عضو', 'مراقبة أداء الفريق في الوقت الفعلي', 'تعيين تقييمات محددة لأفراد', 'إشعارات فورية للمهام الجديدة'].map((t, i) => (
                  <CheckItem key={i} color={C.pink}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24 }} className="lg:order-1">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'أحمد', role: 'مدير عام',           replies: 24, color: C.cyan   },
                  { name: 'سارة', role: 'مديرة فرع الرياض',  replies: 31, color: C.purple },
                  { name: 'خالد', role: 'مشرف فرع جدة',      replies: 18, color: C.green  },
                  { name: 'نورة', role: 'موظفة دعم العملاء', replies: 12, color: C.amber  },
                ].map((m, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: m.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, fontSize: 15, fontWeight: 600, flexShrink: 0 }}>
                      {m.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{m.role}</div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: m.color }}>{m.replies}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>ردًا</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BEFORE / AFTER
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 600, color: C.text, marginBottom: 8 }}>قبل وبعد سديم</h2>
            <p style={{ fontSize: 16, color: C.muted, fontWeight: 400 }}>الفرق واضح — والنتائج حقيقية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} style={{ color: C.red }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.red, margin: 0 }}>قبل سديم</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'ردود متأخرة أو مفقودة على التقييمات',
                  'جمع التقييمات يعتمد على الحظ والمزاج',
                  'لا رؤية حقيقية للأداء عبر الفروع',
                  'الفريق يعمل دون تنسيق واضح',
                  'ساعات ضائعة في صياغة ردود يدوية',
                  'التقييمات السلبية تمر دون تدخل',
                ].map((t, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <X size={10} style={{ color: C.red }} />
                    </div>
                    <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} style={{ color: C.green }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.green, margin: 0 }}>بعد سديم</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'رد في دقائق بمساعدة الذكاء الاصطناعي',
                  'QR Code يجمع التقييمات بشكل منتظم',
                  'تقارير شاملة لكل فرع في مكان واحد',
                  'فريق منظم بصلاحيات وأدوار واضحة',
                  'وقت أقل — نتائج وسمعة أفضل بكثير',
                  'تنبيهات فورية للتقييمات تحتاج اهتمامًا',
                ].map((t, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle2 size={10} style={{ color: C.green }} />
                    </div>
                    <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PHILOSOPHY (4 cards)
      ══════════════════════════════════════════════════════════ */}
      <section id="philosophy" style={{ padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <SectionLabel>من نحن</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 14, letterSpacing: '-0.01em' }}>
              ما الذي يجعلنا مختلفين؟
            </h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 480, margin: '0 auto', fontWeight: 400, lineHeight: 1.7 }}>
              سديم ليس مجرد أداة — هو شريك تقني مبني للسوق العربي بكل تفاصيله واحتياجاته
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🎯', title: 'سهولة الاستخدام', desc: 'منتج بسيط بما يكفي أن تستخدمه بدون تدريب أو خبرة تقنية مسبقة',                   color: C.cyan   },
              { emoji: '🌍', title: 'عربي في جوهره',   desc: 'مبني للسوق العربي من البداية، وليس مجرد ترجمة لمنتج غربي',                         color: C.purple },
              { emoji: '🤝', title: 'شراكة حقيقية',   desc: 'نستمع لعملائنا باستمرار ونبني ما يحتاجونه فعلًا، لا ما نظن أنهم يريدونه',         color: C.green  },
              { emoji: '🚀', title: 'نمو مستمر',       desc: 'نحدّث سديم باستمرار بناءً على ملاحظاتك ومتطلبات السوق المتغيرة',                   color: C.amber  },
            ].map((c, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, textAlign: 'center', transition: 'border-color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = c.color + '40')}
                onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <div style={{ fontSize: 44, marginBottom: 16 }}>{c.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 10 }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 0 100px' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <SectionLabel>الخطط والأسعار</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 10, letterSpacing: '-0.01em' }}>
              ابدأ بالخطة المناسبة لعملك
            </h2>
            <p style={{ fontSize: 15, color: C.muted, fontWeight: 400 }}>جميع الخطط تشمل فترة تجريبية مجانية — لا بطاقة ائتمان مطلوبة</p>
          </div>

          {/* Plan cards — 4 plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              {
                name: 'Orbit', nameAr: 'الأساسي',
                desc: 'للمشاريع الصغيرة التي تبدأ رحلتها في إدارة السمعة',
                highlight: false, badge: null as string | null,
                color: C.cyan,
                features: ['فرع واحد', 'رد ذكي بالـ AI', 'QR Code مخصص', 'تقارير أساسية', 'دعم عبر البريد'],
              },
              {
                name: 'Nova', nameAr: 'المتقدم',
                desc: 'للأعمال المتنامية التي تدير أكثر من فرع وفريق عمل',
                highlight: true, badge: 'الأكثر طلبًا' as string | null,
                color: C.cyan,
                features: ['حتى 5 فروع', 'كل مميزات Orbit', 'إدارة الفريق', 'تحليلات متقدمة', 'قوالب مخصصة', 'دعم أولوية'],
              },
              {
                name: 'Galaxy', nameAr: 'المحترف',
                desc: 'للمؤسسات الكبيرة التي تحتاج حلولًا متكاملة وغير محدودة',
                highlight: false, badge: null as string | null,
                color: C.purple,
                features: ['فروع غير محدودة', 'كل مميزات Nova', 'تكاملات API', 'تقارير مخصصة', 'مدير حساب مخصص', 'SLA مضمون'],
              },
              {
                name: 'Infinity', nameAr: 'المؤسسي',
                desc: 'للمجموعات والامتيازات الكبيرة — حل مؤسسي شامل بلا قيود',
                highlight: false, badge: null as string | null,
                color: C.amber,
                features: ['فروع غير محدودة', 'كل مميزات Galaxy', 'API كامل', 'تقارير white-label', 'فريق دعم مخصص', 'SLA 99.9%', 'تدريب الفريق'],
              },
            ].map((plan, i) => (
              <div
                key={i}
                style={{
                  background: plan.highlight ? C.card2 : C.bg,
                  border: plan.highlight ? `1px solid rgba(6,182,212,0.35)` : `1px solid ${C.border}`,
                  borderRadius: 20, padding: '26px 22px', position: 'relative',
                  boxShadow: plan.highlight ? '0 24px 64px rgba(6,182,212,0.1)' : 'none',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -13, right: 20, background: GRAD, color: 'white', fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 500 }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: plan.highlight ? C.cyan : plan.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>{plan.nameAr}</div>
                  <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, margin: 0 }}>{plan.desc}</p>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <CheckCircle2 size={14} style={{ color: plan.highlight ? C.cyan : plan.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: C.muted }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%', padding: '11px 0',
                    background: plan.highlight ? GRAD : 'transparent',
                    color: plan.highlight ? 'white' : C.text,
                    border: plan.highlight ? 'none' : `1px solid ${C.border}`,
                    borderRadius: 11, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                    boxShadow: plan.highlight ? '0 8px 24px rgba(6,182,212,0.22)' : 'none',
                  }}
                  onMouseOver={e => { if (!plan.highlight) e.currentTarget.style.borderColor = '#374151'; }}
                  onMouseOut={e => { if (!plan.highlight) e.currentTarget.style.borderColor = C.border; }}
                >
                  {plan.highlight ? 'ابدأ مجانًا الآن' : 'ابدأ مجانًا'}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ marginTop: 56 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, textAlign: 'center', marginBottom: 28 }}>مقارنة بين الخطط</h3>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: 13, color: C.muted, fontWeight: 500, width: '35%' }}>الميزة</th>
                    {['Orbit', 'Nova', 'Galaxy', 'Infinity'].map((p, i) => (
                      <th key={i} style={{ padding: '14px 12px', textAlign: 'center', fontSize: 12, color: i === 1 ? C.cyan : C.muted, fontWeight: i === 1 ? 600 : 500 }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'عدد الفروع',              vals: ['1', '5', 'غير محدود', 'غير محدود'] },
                    { label: 'رد ذكي بالـ AI',           vals: ['✓', '✓', '✓', '✓'] },
                    { label: 'QR Code مخصص',             vals: ['✓', '✓', '✓', '✓'] },
                    { label: 'إدارة الفريق',             vals: ['—', '✓', '✓', '✓'] },
                    { label: 'تحليلات متقدمة',          vals: ['—', '✓', '✓', '✓'] },
                    { label: 'تكامل API',               vals: ['—', '—', '✓', '✓'] },
                    { label: 'مدير حساب مخصص',          vals: ['—', '—', '✓', '✓'] },
                    { label: 'White-label',              vals: ['—', '—', '—', '✓'] },
                    { label: 'SLA مضمون',                vals: ['—', '—', '✓', '99.9%'] },
                    { label: 'دعم',                     vals: ['بريد', 'أولوية', 'مخصص', 'فريق كامل'] },
                  ].map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: ri < 9 ? `1px solid ${C.border}` : 'none', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: C.muted }}>{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} style={{ padding: '12px 12px', textAlign: 'center', fontSize: 13, color: v === '✓' ? C.green : v === '—' ? '#3A4150' : vi === 1 ? C.cyan : C.muted, fontWeight: v === '✓' ? 600 : 400 }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: C.muted }}>
            تحتاج خطة مخصصة لمؤسستك؟{' '}
            <button onClick={() => scrollTo('contact')} style={{ color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              تواصل معنا
            </button>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '96px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <SectionLabel>الأسئلة الشائعة</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>
              لديك أسئلة؟ لدينا إجابات
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { q: 'ما هو سديم وكيف يساعد عملي؟',
                a: 'سديم منصة متكاملة لإدارة تقييمات جوجل. تساعدك على الرد على التقييمات بالذكاء الاصطناعي، وجمع تقييمات جديدة عبر QR Code، ومراقبة أداء سمعتك عبر جميع فروعك في لوحة تحكم واحدة.' },
              { q: 'كيف يعمل الرد التلقائي بالذكاء الاصطناعي؟',
                a: 'عند وصول تقييم جديد، يقرأ نظام الذكاء الاصطناعي التقييم ويولّد ردًا يتطابق مع نبرة علامتك التجارية. يمكنك مراجعة الرد وتعديله قبل النشر، أو ضبط الرد التلقائي الفوري.' },
              { q: 'هل يمكنني إدارة أكثر من فرع؟',
                a: 'بالطبع! سديم مصمم أصلًا لإدارة متعددة الفروع. تستطيع ربط جميع مواقعك ورؤية التقارير والتقييمات لكل فرع بشكل منفصل أو مجمّع.' },
              { q: 'هل هناك تجربة مجانية؟',
                a: 'نعم! جميع الخطط تتضمن فترة تجريبية مجانية لا تحتاج فيها إلى بطاقة ائتمان. سجّل الآن وجرّب سديم بكل راحة.' },
              { q: 'ما الفرق بين خطط Orbit وNova وGalaxy؟',
                a: 'Orbit مثالية للمشاريع الصغيرة بفرع واحد. Nova مناسبة للأعمال المتنامية بعدة فروع وفريق عمل. Galaxy مصممة للمؤسسات الكبيرة بفروع غير محدودة وتكاملات API ومدير حساب مخصص.' },
              { q: 'كيف يعمل نظام QR Code بالتفصيل؟',
                a: 'تنشئ رمز QR خاصًا بكل فرع أو موظف عبر سديم، تطبعه أو تعرضه للعملاء. عند المسح، يصل العميل مباشرة لصفحة التقييم على جوجل مع تتبع تلقائي لمصدر التقييم والموظف المُخدِّم.' },
              { q: 'هل بياناتي ومعلومات عملائي آمنة؟',
                a: 'بالتأكيد. نستخدم معايير تشفير عالمية لحماية جميع البيانات مع نسخ احتياطية تلقائية يومية. لا نبيع أو نشارك أي بيانات مع أطراف خارجية بأي شكل.' },
              { q: 'كيف أتواصل مع فريق الدعم؟',
                a: 'نقدم دعمًا متخصصًا عبر البريد الإلكتروني وبوابة الدعم داخل لوحة التحكم. عملاء خطة Galaxy يحصلون على مدير حساب مخصص مع استجابة مضمونة خلال ساعة عمل.' },
            ].map((item, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', color: C.text, textAlign: 'right', gap: 12 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{item.q}</span>
                  <ChevronDown size={18} style={{ color: C.muted, flexShrink: 0, transform: faqOpen === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: '16px 0 0', fontWeight: 400 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CONTACT FORM
      ══════════════════════════════════════════════════════════ */}
      <section id="contact" style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '80px 0 100px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <SectionLabel>تواصل معنا</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 10, letterSpacing: '-0.01em' }}>
              نحب أن نسمع منك
            </h2>
            <p style={{ fontSize: 15, color: C.muted, fontWeight: 400 }}>سواء كان لديك سؤال، طلب تجربة، أو تريد معرفة المزيد — فريقنا هنا</p>
          </div>

          {status === 'success' ? (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 22, padding: 56, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 8 }}>تم إرسال رسالتك بنجاح!</h3>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 20 }}>سيتواصل معك فريقنا في أقرب وقت ممكن</p>
              <button onClick={() => setStatus('idle')} style={{ color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 22, padding: 32 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>الاسم الكامل *</label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="محمد أحمد"
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>البريد الإلكتروني *</label>
                  <input
                    type="email" required dir="ltr"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>رقم الهاتف</label>
                  <input
                    type="tel" dir="ltr"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+966 5X XXX XXXX"
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                {/* Company */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>اسم الشركة</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="شركتك أو مطعمك..."
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>رسالتك *</label>
                <textarea
                  required rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="أخبرنا عن عملك وما تحتاجه..."
                  style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Error */}
              {status === 'error' && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.red }}>
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 12,
                  background: status === 'loading' ? C.card : GRAD,
                  color: 'white', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  boxShadow: status === 'loading' ? 'none' : '0 6px 24px rgba(6,182,212,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {status === 'loading'
                  ? <><Loader2 size={17} className="animate-spin" /> جاري الإرسال...</>
                  : <><Send size={16} /> إرسال الرسالة</>
                }
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A0D14', borderTop: `1px solid ${C.border}`, paddingTop: 64 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10" style={{ marginBottom: 56 }}>

            {/* Col 1: About + social */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ background: 'white', borderRadius: 9, padding: '5px 14px', display: 'inline-flex', alignItems: 'center' }}>
                  <img src="/sadeem-logo.png" alt="SADEEM | سديم" style={{ height: 26, width: 'auto', display: 'block' }} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20, fontWeight: 400 }}>
                منصة متكاملة لإدارة تقييمات جوجل وتحسين السمعة الرقمية للأعمال العربية
              </p>
              {/* Social icons — 5 key platforms */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { name: 'X',         sym: '𝕏',  hov: '#E7E9EA' },
                  { name: 'Instagram', sym: '◈',  hov: '#E1306C' },
                  { name: 'TikTok',    sym: '▲',  hov: '#FF0050' },
                  { name: 'Snapchat',  sym: '◎',  hov: '#FFFC00' },
                  { name: 'LinkedIn',  sym: 'in', hov: '#0A66C2' },
                ].map((s, i) => (
                  <a
                    key={i}
                    href="#"
                    title={s.name}
                    aria-label={s.name}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A94A6', fontSize: s.sym === 'in' ? 12 : 14, fontWeight: s.sym === 'in' ? 700 : 400, textDecoration: 'none', transition: 'all 0.18s', letterSpacing: s.sym === 'in' ? '-0.02em' : 0 }}
                    onMouseOver={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = s.hov; el.style.borderColor = s.hov + '55'; el.style.background = s.hov + '12'; }}
                    onMouseOut={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#8A94A6'; el.style.borderColor = C.border; el.style.background = 'rgba(255,255,255,0.04)'; }}
                  >{s.sym}</a>
                ))}
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 18 }}>المنتج</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['المميزات', 'الخطط والأسعار', 'كيف يعمل', 'التحديثات الجديدة', 'دراسات حالة'].map((t, i) => (
                  <li key={i}>
                    <button style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseOver={e => (e.currentTarget.style.color = C.text)}
                      onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                    >{t}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Support */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 18 }}>الدعم</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['مركز المساعدة', 'تواصل معنا', 'بوابة الدعم الفني', 'التوثيق التقني', 'حالة الخدمة'].map((t, i) => (
                  <li key={i}>
                    <button style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseOver={e => (e.currentTarget.style.color = C.text)}
                      onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                    >{t}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 18 }}>قانوني</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'سياسة الخصوصية', path: '/privacy' },
                  { label: 'شروط الاستخدام',  path: '/terms'   },
                  { label: 'قصة سديم',         path: '/story'   },
                  { label: 'إشعار قانوني',     path: '/terms'   },
                  { label: 'خريطة الموقع',     path: '/'        },
                ].map((l, i) => (
                  <li key={i}>
                    <button
                      onClick={() => navigate(l.path)}
                      style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseOver={e => (e.currentTarget.style.color = C.text)}
                      onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                    >{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 20px', marginBottom: 12 }}>
              {[
                { label: 'سياسة الخصوصية', path: '/privacy' },
                { label: 'شروط الاستخدام',  path: '/terms'   },
                { label: 'قصة سديم',         path: '/story'   },
                { label: 'إشعار قانوني',     path: '/terms'   },
                { label: 'الرئيسية',          path: '/'        },
              ].map((l, i) => (
                <button key={i}
                  onClick={() => navigate(l.path)}
                  style={{ color: C.muted, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseOver={e => (e.currentTarget.style.color = C.brand)}
                  onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                >{l.label}</button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: 'center' }}>
              © 2026 سديم. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
