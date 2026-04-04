import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, PieChart, Calendar, Building2,
  ChevronLeft, FileText, Activity, Target,
} from 'lucide-react';

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

export default function AnalyticsPage() {
  const nav = useNavigate();

  const features = [
    {
      icon: Activity,
      title: 'تحليل المشاعر',
      desc: 'يحلل النظام مشاعر كل تقييم تلقائياً ويصنّفه إلى إيجابي أو سلبي أو محايد. تابع نسبة المشاعر الإيجابية بمرور الوقت واكتشف الأسباب الرئيسية وراء التقييمات السلبية لمعالجتها.',
    },
    {
      icon: Building2,
      title: 'مقارنة الفروع',
      desc: 'قارن أداء فروعك جنباً إلى جنب من حيث متوسط التقييم وعدد التقييمات ونسبة الرضا. حدد الفروع المتميزة والفروع التي تحتاج إلى تحسين لتوجيه مواردك بشكل أفضل.',
    },
    {
      icon: Calendar,
      title: 'تقارير أسبوعية وشهرية',
      desc: 'احصل على تقارير دورية مفصلة تُرسل إلى بريدك الإلكتروني تلقائياً. تتضمن ملخصاً شاملاً لأداء تقييماتك واتجاهات رضا العملاء وأهم النقاط التي تحتاج اهتماماً.',
    },
    {
      icon: PieChart,
      title: 'توزيع التقييمات',
      desc: 'اعرض التوزيع التفصيلي لتقييماتك من نجمة واحدة إلى خمس نجوم. تتبع كيف يتغير هذا التوزيع مع مرور الوقت وقِس أثر التحسينات التي تجريها على رضا العملاء.',
    },
  ];

  const metrics = [
    { label: 'متوسط التقييم', value: '4.6', sub: 'من 5 نجوم' },
    { label: 'نسبة الرضا', value: '92%', sub: 'تقييمات إيجابية' },
    { label: 'معدل الاستجابة', value: '98%', sub: 'تم الرد عليها' },
    { label: 'وقت الاستجابة', value: '2 س', sub: 'متوسط الرد' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
          <span onClick={() => nav('/features')} style={{ cursor: 'pointer', color: C.gold }}>المميزات</span>
          <ChevronLeft size={12} />
          <span>التحليلات المتقدمة</span>
        </div>
      </div>

      {/* Hero */}
      <section style={{ padding: '48px 24px 64px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(184,150,90,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <BarChart3 size={28} color={C.gold} />
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          تحليلات متقدمة لسمعتك الرقمية
        </h1>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.8, maxWidth: 620, margin: '0 auto' }}>
          حوّل بيانات التقييمات إلى رؤى قابلة للتنفيذ. تحليلات شاملة تساعدك على فهم عملائك واتخاذ قرارات مبنية على بيانات حقيقية.
        </p>
      </section>

      {/* Sample Metrics */}
      <section style={{ padding: '0 24px 48px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 12, padding: '24px 20px', boxShadow: SHADOW, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: C.gold, marginBottom: 2 }}>{m.value}</p>
              <p style={{ fontSize: 12, color: C.muted }}>{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics Features */}
      <section style={{ padding: '48px 24px 64px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 40 }}>أدوات التحليل المتاحة</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            const isEven = i % 2 === 0;
            return (
              <div key={i} style={{
                background: C.card, borderRadius: 14, padding: 32, boxShadow: SHADOW,
                border: `1px solid ${C.border}`, display: 'flex', gap: 24, alignItems: 'flex-start',
                flexDirection: isEven ? 'row' : 'row-reverse',
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(184,150,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={26} color={C.gold} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Insights section */}
      <section style={{ padding: '48px 24px 64px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: C.card, borderRadius: 16, padding: '36px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Target size={22} color={C.gold} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>رؤى قابلة للتنفيذ</h2>
          </div>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>
            لا تكتفِ بالأرقام فقط. يقدم لك سيندا توصيات واضحة مبنية على تحليل بياناتك لمساعدتك في تحسين تجربة عملائك بشكل مستمر.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              'تحديد أكثر المواضيع تكراراً في التقييمات',
              'تتبع أثر التحسينات على رضا العملاء',
              'مقارنة أداء الفترات الزمنية المختلفة',
              'تقارير جاهزة للمشاركة مع الفريق',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: C.text }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '48px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: C.card, borderRadius: 16, padding: '44px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>اكتشف قوة البيانات</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>
            سجّل مجاناً وابدأ بتحليل تقييماتك للحصول على رؤى تساعدك في تحسين خدماتك.
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
