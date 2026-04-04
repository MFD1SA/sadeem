import { useNavigate } from 'react-router-dom';
import {
  Star, MessageSquare, Bell, Globe, CheckCircle2, ArrowLeft,
  ChevronLeft, Menu, X, Inbox, Filter, TrendingUp,
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

function Header() {
  const nav = useNavigate();
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.card, borderBottom: `1px solid ${C.border}`, direction: 'rtl' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <img src="/senda-logo.png" alt="SENDA" style={{ height: 32, cursor: 'pointer' }} onClick={() => nav('/')} />
        <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {NAV.map(n => (
            <span key={n.href} onClick={() => nav(n.href)} style={{ cursor: 'pointer', color: C.muted, fontSize: 14, fontWeight: 500 }}>{n.label}</span>
          ))}
          <button onClick={() => nav('/login')} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ابدأ مجاناً
          </button>
        </nav>
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

export default function ReviewsManagementPage() {
  const nav = useNavigate();

  const steps = [
    { icon: Globe, title: 'ربط حساب Google Business', desc: 'اربط ملفك التجاري على Google ببضع نقرات لتتدفق التقييمات تلقائياً إلى لوحة التحكم.' },
    { icon: Inbox, title: 'تجميع تلقائي للتقييمات', desc: 'تُجمع جميع التقييمات الجديدة فور ورودها مع إشعارات فورية حتى لا يفوتك أي تقييم.' },
    { icon: Filter, title: 'تصفية وتصنيف', desc: 'صنّف التقييمات حسب التقييم والتاريخ والفرع والحالة لتحديد الأولويات بسرعة.' },
    { icon: MessageSquare, title: 'الرد والمتابعة', desc: 'رد على التقييمات مباشرة من اللوحة أو استخدم الردود الذكية المقترحة بالذكاء الاصطناعي.' },
  ];

  const benefits = [
    { icon: Bell, title: 'إشعارات فورية', desc: 'احصل على تنبيهات لحظية عند ورود أي تقييم جديد سواء إيجابي أو سلبي لتتمكن من الاستجابة السريعة.' },
    { icon: Star, title: 'تتبع التقييمات السلبية', desc: 'حدد التقييمات السلبية فوراً وتابعها بعناية لتحويل تجربة العميل السلبية إلى إيجابية.' },
    { icon: TrendingUp, title: 'تحسين التقييم العام', desc: 'راقب تطور متوسط تقييمك بمرور الوقت واكتشف الأنماط التي تؤثر على رضا عملائك.' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
          <span onClick={() => nav('/features')} style={{ cursor: 'pointer', color: C.gold }}>المميزات</span>
          <ChevronLeft size={12} />
          <span>إدارة التقييمات</span>
        </div>
      </div>

      {/* Hero */}
      <section style={{ padding: '48px 24px 64px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(184,150,90,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Star size={28} color={C.gold} />
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          إدارة التقييمات باحترافية
        </h1>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
          اجمع جميع تقييمات عملائك من Google Business Profile في لوحة تحكم مركزية واحدة. تابع، صنّف، ورد على كل تقييم بكفاءة عالية.
        </p>
      </section>

      {/* How it works */}
      <section style={{ padding: '0 24px 64px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 40 }}>كيف تعمل إدارة التقييمات؟</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: SHADOW, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  {i + 1}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(184,150,90,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon size={22} color={C.gold} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '48px 24px 64px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 12 }}>فوائد الإدارة المركزية للتقييمات</h2>
        <p style={{ fontSize: 15, color: C.muted, textAlign: 'center', marginBottom: 40, maxWidth: 550, margin: '0 auto 40px' }}>
          لا تدع أي تقييم يمر دون انتباه. نظام مركزي يضمن لك متابعة شاملة واستجابة سريعة.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: 28, boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(184,150,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={22} color={C.gold} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Google Integration */}
      <section style={{ padding: '48px 24px 64px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: C.card, borderRadius: 16, padding: '40px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Globe size={24} color={C.gold} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>تكامل مع Google Business Profile</h2>
          </div>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
            يتصل سيندا مباشرة بحسابك على Google Business Profile لسحب التقييمات تلقائياً والرد عليها من داخل المنصة. لا حاجة للتنقل بين عدة منصات — كل شيء في مكان واحد.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['سحب تلقائي لجميع التقييمات الجديدة', 'الرد المباشر من داخل سيندا', 'مزامنة فورية مع Google', 'دعم حسابات متعددة'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color={C.gold} />
                <span style={{ fontSize: 14, color: C.text }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '48px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: C.card, borderRadius: 16, padding: '44px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>ابدأ بإدارة تقييماتك الآن</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>
            سجّل مجاناً واربط حسابك على Google لتبدأ بإدارة تقييماتك باحترافية.
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
