import { useNavigate } from 'react-router-dom';
import {
  Brain, Sparkles, Languages, Eye, Sliders, MessageSquare,
  ChevronLeft, CheckCircle2, Zap, ShieldCheck,
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
        <img src="/senda-logo.png" alt="SENDA" style={{ height: 36, cursor: 'pointer' }} onClick={() => nav('/')} />
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

export default function AiRepliesPage() {
  const nav = useNavigate();

  const howItWorks = [
    { icon: Brain, title: 'تحليل ذكي للتقييم', desc: 'يقرأ الذكاء الاصطناعي محتوى التقييم ويفهم السياق والمشاعر والنقاط الرئيسية التي ذكرها العميل لصياغة رد دقيق ومناسب.' },
    { icon: Sliders, title: 'نبرة قابلة للتخصيص', desc: 'اختر النبرة التي تناسب علامتك التجارية: رسمية، ودية، مهنية، أو مختصرة. يتكيف الذكاء الاصطناعي مع أسلوبك الخاص.' },
    { icon: Languages, title: 'دعم العربية والإنجليزية', desc: 'يتعرف النظام تلقائياً على لغة التقييم ويصيغ الرد بنفس اللغة مع مراعاة الأساليب الثقافية واللغوية المناسبة.' },
    { icon: Eye, title: 'مراجعة قبل النشر', desc: 'كل رد مقترح يُعرض عليك للمراجعة والتعديل قبل نشره. أنت تحتفظ بالتحكم الكامل في كل رد يُرسل باسم علامتك التجارية.' },
  ];

  const advantages = [
    { icon: Zap, title: 'استجابة أسرع بعشر مرات', desc: 'بدلاً من قضاء دقائق في كتابة كل رد، احصل على رد مهني جاهز خلال ثوانٍ معدودة.' },
    { icon: ShieldCheck, title: 'جودة متسقة', desc: 'ردود متسقة في الجودة والاحترافية بغض النظر عن عدد التقييمات أو ضغط العمل.' },
    { icon: MessageSquare, title: 'ردود مخصصة وليست نمطية', desc: 'كل رد فريد ومصاغ خصيصاً لمحتوى التقييم، وليس مجرد قالب عام يُعاد استخدامه.' },
    { icon: Sparkles, title: 'تعلم مستمر', desc: 'يتحسن الذكاء الاصطناعي مع كل تعديل تجريه، ليقترب أكثر من أسلوبك المفضل بمرور الوقت.' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
          <span onClick={() => nav('/features')} style={{ cursor: 'pointer', color: C.gold }}>المميزات</span>
          <ChevronLeft size={12} />
          <span>ردود الذكاء الاصطناعي</span>
        </div>
      </div>

      {/* Hero */}
      <section style={{ padding: '48px 24px 64px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(184,150,90,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Brain size={28} color={C.gold} />
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          ردود ذكية بالذكاء الاصطناعي
        </h1>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.8, maxWidth: 620, margin: '0 auto' }}>
          دع الذكاء الاصطناعي يساعدك في صياغة ردود مهنية ومخصصة لكل تقييم. وفّر وقتك مع الحفاظ على جودة التواصل مع عملائك.
        </p>
      </section>

      {/* How AI Works */}
      <section style={{ padding: '0 24px 64px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 40 }}>كيف يعمل الذكاء الاصطناعي؟</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {howItWorks.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(184,150,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={22} color={C.gold} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Example */}
      <section style={{ padding: '0 24px 64px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: C.card, borderRadius: 16, padding: 32, boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 20 }}>مثال على الردود الذكية</h3>
          <div style={{ background: '#FEF3C7', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>تقييم العميل:</span>
              <span style={{ fontSize: 12, color: '#B45309' }}>3 نجوم</span>
            </div>
            <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.6 }}>
              "الأكل كان جيد لكن الخدمة بطيئة جداً وانتظرنا كثير"
            </p>
          </div>
          <div style={{ background: 'rgba(184,150,90,0.06)', borderRadius: 10, padding: 16, borderRight: `3px solid ${C.gold}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Brain size={14} color={C.gold} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>رد مقترح بالذكاء الاصطناعي:</span>
            </div>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>
              "شكراً لك على تقييمك وسعداء أن الأكل نال إعجابك! نعتذر عن تأخر الخدمة، ونعمل حالياً على تحسين سرعة التقديم. نتطلع لخدمتك بشكل أفضل في زيارتك القادمة."
            </p>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section style={{ padding: '48px 24px 64px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 40 }}>مميزات الردود الذكية</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {advantages.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: 24, boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(184,150,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={22} color={C.gold} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{a.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '48px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: C.card, borderRadius: 16, padding: '44px 32px', boxShadow: SHADOW, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>جرّب الردود الذكية الآن</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>
            سجّل مجاناً واكتشف كيف يمكن للذكاء الاصطناعي مساعدتك في الرد على تقييمات عملائك بسرعة واحترافية.
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
