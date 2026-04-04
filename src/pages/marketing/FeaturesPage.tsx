import { useNavigate } from 'react-router-dom';
import {
  Star, MessageSquare, Brain, BarChart3, Building2, QrCode, Users, Shield,
  ArrowLeft, ChevronLeft, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const C = {
  bg: '#F8F9FB', card: '#FFFFFF', text: '#1A1A2E', muted: '#6B7280',
  gold: '#B8965A', border: '#E8E8EC',
};
const GOLD = 'linear-gradient(135deg, #B8965A, #D4AF6A)';
const SHADOW = '0 1px 3px rgba(0,0,0,0.06)';

const NAV = [
  { label: 'الرئيسية', href: '/' },
  { label: 'المميزات', href: '/features' },
  { label: 'قصة سيندا', href: '/story' },
];

const FEATURES = [
  { icon: Star, title: 'إدارة التقييمات', desc: 'اجمع كل تقييمات عملائك من Google وغيرها في لوحة واحدة سهلة الإدارة، وتابع كل جديد لحظة بلحظة.', href: '/reviews-management' },
  { icon: Brain, title: 'ردود الذكاء الاصطناعي', desc: 'دع الذكاء الاصطناعي يصيغ ردوداً مهنية ومخصصة لكل تقييم بالعربية والإنجليزية خلال ثوانٍ.', href: '/ai-replies' },
  { icon: BarChart3, title: 'تحليلات متقدمة', desc: 'تقارير مفصلة عن المشاعر والتقييمات واتجاهات رضا العملاء مع مقارنات أسبوعية وشهرية.', href: '/analytics-page' },
  { icon: Building2, title: 'إدارة الفروع', desc: 'أدر جميع فروعك من مكان واحد مع لوحة تحكم خاصة بكل فرع ومقارنات أداء فورية.', href: '/branches-page' },
  { icon: QrCode, title: 'رموز QR ذكية', desc: 'أنشئ رموز QR مخصصة لكل فرع لتسهيل جمع التقييمات من العملاء في الموقع.', href: '/reviews-management' },
  { icon: MessageSquare, title: 'صندوق الردود', desc: 'رد على جميع التقييمات من مكان واحد مع قوالب جاهزة وردود مقترحة بالذكاء الاصطناعي.', href: '/ai-replies' },
  { icon: Users, title: 'إدارة الفريق', desc: 'أضف أعضاء فريقك وحدد الصلاحيات لكل عضو مع تتبع كامل لسجل النشاطات.', href: '/branches-page' },
  { icon: Shield, title: 'أمان وخصوصية', desc: 'بياناتك محمية بأعلى معايير الأمان مع تشفير كامل وصلاحيات وصول دقيقة.', href: '/features' },
];

function Header() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.card, borderBottom: `1px solid ${C.border}`, direction: 'rtl' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <img src="/senda-logo.png" alt="SENDA" style={{ height: 36, cursor: 'pointer' }} onClick={() => nav('/')} />
        <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="desktop-nav">
          {NAV.map(n => (
            <span key={n.href} onClick={() => nav(n.href)} style={{ cursor: 'pointer', color: C.muted, fontSize: 14, fontWeight: 500 }}>{n.label}</span>
          ))}
          <button onClick={() => nav('/login')} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ابدأ مجاناً
          </button>
        </nav>
        <button onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: 'none', color: C.text, cursor: 'pointer' }} className="mobile-menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '32px 24px', textAlign: 'center', direction: 'rtl' }}>
      <p style={{ color: C.muted, fontSize: 14 }}>© {new Date().getFullYear()} SENDA — جميع الحقوق محفوظة</p>
    </footer>
  );
}

export default function FeaturesPage() {
  const nav = useNavigate();
  return (
    <div style={{ background: C.bg, minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      {/* Hero */}
      <section style={{ padding: '80px 24px 48px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          كل ما تحتاجه لإدارة سمعتك الرقمية
        </h1>
        <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
          منصة متكاملة تجمع أدوات إدارة التقييمات والردود الذكية والتحليلات المتقدمة في مكان واحد لتعزيز حضورك الرقمي.
        </p>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '24px 24px 64px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} onClick={() => nav(f.href)} style={{
                background: C.card, borderRadius: 12, padding: 28, boxShadow: SHADOW,
                border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = SHADOW; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(184,150,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={24} color={C.gold} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{f.desc}</p>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 4, color: C.gold, fontSize: 13, fontWeight: 500 }}>
                  <span>اكتشف المزيد</span>
                  <ChevronLeft size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why SENDA */}
      <section style={{ padding: '64px 24px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 16 }}>لماذا تختار سيندا؟</h2>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, maxWidth: 650, margin: '0 auto 40px' }}>
          سيندا ليست مجرد أداة لإدارة التقييمات، بل شريك رقمي يساعدك على فهم عملائك وتحسين تجربتهم وبناء سمعة قوية ومستدامة لعلامتك التجارية.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24, textAlign: 'right' }}>
          {[
            { title: 'توفير الوقت', desc: 'وفّر ساعات من العمل اليدوي بأتمتة الردود وتجميع التقييمات تلقائياً.' },
            { title: 'رضا العملاء', desc: 'استجب بسرعة واحترافية لكل تقييم مما يعزز ثقة العملاء وولاءهم.' },
            { title: 'قرارات مبنية على بيانات', desc: 'تحليلات دقيقة تساعدك على اتخاذ قرارات مدروسة لتطوير خدماتك.' },
          ].map((item, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: C.card, borderRadius: 16, padding: '48px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 12 }}>ابدأ رحلتك مع سيندا اليوم</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>
            سجّل الآن واستمتع بتجربة مجانية لاكتشاف كيف يمكن لسيندا تحويل إدارة سمعتك الرقمية.
          </p>
          <button onClick={() => nav('/login')} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            سجّل مجاناً
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
