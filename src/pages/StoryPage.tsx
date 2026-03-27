// ============================================================================
// SADEEM — Story Page (قصة سديم)
// Premium dark public page — matches homepage design tokens
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target, Globe, Heart, Zap, Star, Users, Lightbulb, TrendingUp } from 'lucide-react';

const C = {
  bg:     '#0F1117',
  card:   '#151922',
  card2:  '#1A2030',
  border: '#242A36',
  text:   '#F3F4F6',
  muted:  '#A7AFBD',
  brand:  '#C9D8E6',
  cyan:   '#06B6D4',
  purple: '#8B5CF6',
  green:  '#10B981',
  amber:  '#F59E0B',
};
const GRAD = 'linear-gradient(135deg, #06B6D4, #8B5CF6)';

export default function StoryPage() {
  const navigate = useNavigate();

  return (
    <div dir="rtl" style={{ background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* ── Topbar ── */}
      <div style={{ background: 'rgba(15,17,23,0.96)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14 }}
            onMouseOver={e => (e.currentTarget.style.color = C.text)}
            onMouseOut={e => (e.currentTarget.style.color = C.muted)}
          >
            <ArrowRight size={16} />
            العودة للرئيسية
          </button>
          <div className="flex items-center gap-2.5">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={14} style={{ color: 'white' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: C.text }}>SADEEM</span>
            <span style={{ color: C.muted, fontSize: 14 }}>|</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: C.brand }}>سديم</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{ background: GRAD, color: 'white', fontSize: 13, padding: '7px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >ابدأ مجانًا</button>
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 0 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.09) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)' }} />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center" style={{ position: 'relative' }}>
          <div className="inline-flex items-center gap-2 mb-6" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 30, padding: '5px 16px' }}>
            <span style={{ color: C.purple, fontSize: 12, letterSpacing: '0.08em' }}>القصة</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 600, lineHeight: 1.3, marginBottom: 20, color: C.text }}>
            لماذا بنينا{' '}
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              سديم؟
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.muted, lineHeight: 1.8, fontWeight: 400, maxWidth: 560, margin: '0 auto' }}>
            كل فكرة تبدأ بمشكلة حقيقية. سديم بدأ بملاحظة بسيطة: الأعمال العربية تفقد عملاء كل يوم بسبب تقييمات لا يرد عليها أحد.
          </p>
        </div>
      </section>

      {/* ── Origin Story ── */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: '40px 36px', marginBottom: 24 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={20} style={{ color: C.cyan }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>من أين جاءت الفكرة؟</h2>
            </div>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.85, margin: 0, fontWeight: 400 }}>
              رصدنا مئات الأعمال السعودية والخليجية التي تملك منتجات وخدمات ممتازة، لكن سمعتها الرقمية لا تعكس ذلك. تقييمات سلبية بلا رد، وتقييمات إيجابية تمر دون شكر. الأعمال الصغيرة والمتوسطة كانت تفتقر لأدوات احترافية تناسبها — بلغتها، بطريقة تفكيرها، وبميزانيتها.
            </p>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.85, marginTop: 16, marginBottom: 0, fontWeight: 400 }}>
              كان الحل الوحيد المتاح إما أدوات غربية لا تفهم السياق العربي، أو العمل اليدوي الذي يستنزف وقت الفريق. قررنا بناء الحل الذي كنا نريده — منصة عربية، ذكية، وعملية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
            {[
              {
                icon: Target, color: C.cyan,
                title: 'المشكلة التي حللناها',
                body: 'إدارة التقييمات كانت تتطلب ساعات يومية من الجهد اليدوي. الذكاء الاصطناعي غيّر المعادلة — ردود في دقائق بدلًا من ساعات، مع الحفاظ على صوت العلامة التجارية.',
              },
              {
                icon: Globe, color: C.purple,
                title: 'السوق الذي نخدمه',
                body: 'السوق العربي يضم ملايين الأعمال التي تستحق أدوات مبنية لها خصيصًا. ليس مجرد ترجمة — بل منتج يفهم احتياجات المستخدم العربي من الجذور.',
              },
            ].map((item, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vision & Values ── */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 600, color: C.text, marginBottom: 12 }}>رؤيتنا وقيمنا</h2>
            <p style={{ fontSize: 15, color: C.muted, fontWeight: 400, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              ما يدفعنا كل يوم هو إيماننا بأن السمعة الرقمية حق لكل عمل — صغيرًا كان أم كبيرًا
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Heart,      color: C.cyan,   title: 'العميل أولًا',       desc: 'كل قرار نتخذه يبدأ بسؤال واحد: هل هذا يجعل تجربة عميلنا أفضل؟' },
              { icon: Globe,      color: C.purple, title: 'عربي في جوهره',      desc: 'مبني للسوق العربي من أول سطر كود — بلغته وثقافته واحتياجاته.' },
              { icon: Zap,        color: C.amber,  title: 'بساطة حقيقية',       desc: 'القوة الحقيقية في البساطة. لا تدريب مطوّل — كل شيء واضح من اليوم الأول.' },
              { icon: TrendingUp, color: C.green,  title: 'نمو مستمر',          desc: 'نحدّث سديم باستمرار بناءً على ملاحظات عملائنا ومتطلبات السوق المتغيرة.' },
            ].map((v, i) => (
              <div
                key={i}
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18, padding: 26, textAlign: 'center', transition: 'border-color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = v.color + '40')}
                onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <div style={{ width: 48, height: 48, borderRadius: 13, background: v.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <v.icon size={20} style={{ color: v.color }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 12 }}>الفريق</h2>
            <p style={{ fontSize: 15, color: C.muted, fontWeight: 400, maxWidth: 420, margin: '0 auto' }}>
              فريق متخصص يؤمن بقوة السمعة الرقمية ويبني الأدوات التي كان يريدها
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'محمد',  role: 'المؤسس والرئيس التنفيذي',    color: C.cyan,   bg: 'rgba(6,182,212,0.1)'   },
              { name: 'سارة',  role: 'رئيسة تطوير المنتج',         color: C.purple, bg: 'rgba(139,92,246,0.1)' },
              { name: 'أحمد',  role: 'رئيس الهندسة والتقنية',      color: C.green,  bg: 'rgba(16,185,129,0.1)' },
              { name: 'نورة',  role: 'مديرة نجاح العملاء',         color: C.amber,  bg: 'rgba(245,158,11,0.1)' },
            ].map((m, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '28px 16px', textAlign: 'center', transition: 'border-color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = m.color + '35')}
                onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, fontWeight: 600, color: m.color }}>
                  {m.name[0]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '64px 0 80px' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 14 }}>
            انضم إلى مجتمع سديم
          </h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 36, fontWeight: 400, maxWidth: 400, margin: '0 auto 36px' }}>
            أكثر من 500 عمل يثق بسديم لإدارة سمعته الرقمية. ابدأ تجربتك المجانية اليوم.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/login')}
              style={{ background: GRAD, color: 'white', fontSize: 15, padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 8px 28px rgba(6,182,212,0.25)', fontWeight: 500 }}
            >ابدأ تجربتك المجانية</button>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'transparent', color: C.muted, fontSize: 14, padding: '13px 24px', borderRadius: 12, border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 400 }}
              onMouseOver={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = '#374151'; }}
              onMouseOut={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
            >عودة للرئيسية</button>
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ background: '#0A0D14', borderTop: `1px solid ${C.border}`, padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>© 2026 سديم. جميع الحقوق محفوظة.</p>
      </div>

    </div>
  );
}
