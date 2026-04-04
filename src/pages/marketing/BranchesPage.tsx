import { useNavigate } from 'react-router-dom';
import {
  Building2, QrCode, BarChart3, Users, ChevronLeft,
  MapPin, Settings, Eye, Shield, CheckCircle2,
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

export default function BranchesPage() {
  const nav = useNavigate();

  const sections = [
    {
      icon: Eye,
      title: 'لوحة تحكم متعددة الفروع',
      desc: 'تابع أداء جميع فروعك من لوحة تحكم مركزية واحدة. شاهد ملخصاً شاملاً لعدد التقييمات ومتوسط التقييم ونسبة الرضا لكل فرع في نظرة واحدة.',
      points: ['عرض موحد لجميع الفروع', 'مؤشرات أداء فورية لكل فرع', 'فلترة وترتيب حسب الأداء', 'تنبيهات عند انخفاض تقييم أي فرع'],
    },
    {
      icon: QrCode,
      title: 'رموز QR مخصصة لكل فرع',
      desc: 'أنشئ رمز QR فريداً لكل فرع يوجّه العملاء مباشرة لصفحة التقييم. ضع الرمز في المحل أو على الطاولات أو عند الكاشير لجمع تقييمات أكثر.',
      points: ['رمز QR فريد لكل فرع', 'تصميم قابل للتخصيص بشعارك', 'صفحة تقييم مخصصة وسريعة', 'تتبع عدد المسح لكل رمز'],
    },
    {
      icon: BarChart3,
      title: 'تحليلات مقارنة بين الفروع',
      desc: 'قارن أداء فروعك جنباً إلى جنب لتحديد نقاط القوة والضعف. اكتشف أي فرع يتفوق وأيها يحتاج إلى دعم ومتابعة.',
      points: ['مقارنة متوسط التقييم بين الفروع', 'ترتيب الفروع حسب الأداء', 'تتبع تحسن كل فرع بمرور الوقت', 'تحديد أنماط المشاكل المتكررة'],
    },
    {
      icon: Users,
      title: 'فريق عمل لكل فرع',
      desc: 'عيّن أعضاء فريق مخصصين لكل فرع مع صلاحيات محددة. كل عضو يرى فقط بيانات الفرع المسؤول عنه مع تتبع كامل لنشاطاته.',
      points: ['تعيين أعضاء لفروع محددة', 'صلاحيات مخصصة لكل دور', 'سجل كامل لنشاط كل عضو', 'إدارة مرنة للأدوار والمسؤوليات'],
    },
  ];

  const stats = [
    { icon: Building2, value: '+500', label: 'فرع مُدار' },
    { icon: MapPin, value: '+20', label: 'مدينة' },
    { icon: Users, value: '+1,200', label: 'مستخدم نشط' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
          <span onClick={() => nav('/features')} style={{ cursor: 'pointer', color: C.gold }}>المميزات</span>
          <ChevronLeft size={12} />
          <span>إدارة الفروع</span>
        </div>
      </div>

      {/* Hero */}
      <section style={{ padding: '48px 24px 64px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(184,150,90,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Building2 size={28} color={C.gold} />
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          إدارة جميع فروعك من مكان واحد
        </h1>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.8, maxWidth: 620, margin: '0 auto' }}>
          سواء كنت تدير فرعين أو مئة فرع، يمنحك سيندا تحكماً كاملاً في كل فرع مع رؤية شاملة لأداء شبكة فروعك بالكامل.
        </p>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 24px 48px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: '24px 16px', boxShadow: SHADOW, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <Icon size={22} color={C.gold} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 28, fontWeight: 700, color: C.gold, marginBottom: 2 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: C.muted }}>{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Sections */}
      <section style={{ padding: '32px 24px 64px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: C.card, borderRadius: 14, padding: 32, boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(184,150,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={C.gold} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: C.text }}>{s.title}</h3>
                </div>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 20 }}>{s.desc}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {s.points.map((p, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={15} color={C.gold} />
                      <span style={{ fontSize: 13, color: C.text }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '48px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: C.card, borderRadius: 16, padding: '44px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>ابدأ بإدارة فروعك الآن</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>
            سجّل مجاناً وأضف فروعك لتحصل على تحكم كامل ورؤية شاملة لأداء كل فرع.
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
