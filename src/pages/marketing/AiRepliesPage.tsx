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
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
        <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
        <a href="https://wa.me/966504566777" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
      </div>
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
