// ============================================================================
// SENDA — Story Page (قصة سيندا) — Professional Edition
// Header matches homepage exactly: Logo RIGHT · Nav CENTER · CTAs LEFT (RTL)
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Lightbulb, Globe, BookOpen, Zap, MapPin, Rocket, Heart, ArrowUpRight, Sparkles } from 'lucide-react';

const C = {
  bg:     '#0F1117',
  card:   '#151922',
  card2:  '#1A2030',
  border: '#242A36',
  text:   '#F3F4F6',
  muted:  '#A7AFBD',
  cyan:   '#06B6D4',
  purple: '#8B5CF6',
};
const GRAD = 'linear-gradient(135deg, #06B6D4, #8B5CF6)';

const NAV = [
  { label: 'الرئيسية',  path: '/'          },
  { label: 'المميزات',  path: '/#features'  },
  { label: 'الأسعار',   path: '/#pricing'   },
  { label: 'اتصل بنا', path: '/#contact'   },
];

// ── AI Girl SVG — digital feminine portrait ────────────────────────────────
function AiGirl() {
  return (
    <svg viewBox="0 0 480 580" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block' }}>
      <defs>
        <radialGradient id="aura" cx="50%" cy="44%" r="52%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.17"/>
          <stop offset="52%" stopColor="#8B5CF6" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#0F1117" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
        <filter id="gb"><feGaussianBlur stdDeviation="8"/></filter>
        <filter id="gb2"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>

      {/* Ambient aura */}
      <ellipse cx="240" cy="270" rx="222" ry="252" fill="url(#aura)"/>

      {/* Glow rings */}
      <circle cx="240" cy="238" r="208" stroke="#06B6D4" strokeWidth="0.5" opacity="0.1"/>
      <circle cx="240" cy="238" r="180" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.14"/>
      <circle cx="240" cy="238" r="154" stroke="#06B6D4" strokeWidth="0.4" opacity="0.19"/>

      {/* Head soft glow */}
      <ellipse cx="240" cy="190" rx="75" ry="85" fill="#06B6D4" opacity="0.05" filter="url(#gb)"/>

      {/* Head outline */}
      <ellipse cx="240" cy="192" rx="70" ry="82" stroke="url(#lg)" strokeWidth="1.6" opacity="0.78"/>

      {/* Crown / hair top arc */}
      <path d="M 170 166 Q 152 104 176 62 Q 202 25 240 20 Q 278 25 304 62 Q 328 104 310 166"
        stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55"/>
      {/* Inner hair flow */}
      <path d="M 176 176 Q 160 120 182 76 Q 208 44 240 38" stroke="#06B6D4" strokeWidth="0.9" fill="none" opacity="0.3"/>
      <path d="M 304 176 Q 320 120 298 76 Q 272 44 240 38" stroke="#8B5CF6" strokeWidth="0.9" fill="none" opacity="0.3"/>
      {/* Side strands */}
      <path d="M 171 176 Q 144 204 130 246" stroke="url(#lg)" strokeWidth="1.2" fill="none" opacity="0.28"/>
      <path d="M 309 176 Q 336 204 350 246" stroke="url(#lg)" strokeWidth="1.2" fill="none" opacity="0.28"/>

      {/* Eye area glow */}
      <ellipse cx="212" cy="182" r="19" fill="#06B6D4" opacity="0.07" filter="url(#gb)"/>
      <ellipse cx="268" cy="182" r="19" fill="#06B6D4" opacity="0.07" filter="url(#gb)"/>

      {/* Eyebrows */}
      <path d="M 195 170 Q 212 162 230 170" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.78"/>
      <path d="M 250 170 Q 268 162 285 170" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.78"/>

      {/* Eyes — almond shape */}
      <path d="M 196 182 Q 212 171 228 182 Q 212 191 196 182Z" fill="#06B6D4" opacity="0.12"/>
      <path d="M 252 182 Q 268 171 284 182 Q 268 191 252 182Z" fill="#06B6D4" opacity="0.12"/>
      <path d="M 196 182 Q 212 171 228 182 Q 212 191 196 182Z" stroke="#06B6D4" strokeWidth="1.4" fill="none" opacity="0.88"/>
      <path d="M 252 182 Q 268 171 284 182 Q 268 191 252 182Z" stroke="#06B6D4" strokeWidth="1.4" fill="none" opacity="0.88"/>
      {/* Iris */}
      <circle cx="212" cy="182" r="5.5" fill="#06B6D4" opacity="0.88"/>
      <circle cx="268" cy="182" r="5.5" fill="#06B6D4" opacity="0.88"/>
      {/* Pupils */}
      <circle cx="212" cy="182" r="3" fill="#080C14"/>
      <circle cx="268" cy="182" r="3" fill="#080C14"/>
      {/* Eye shine */}
      <circle cx="214" cy="180" r="1.5" fill="white" opacity="0.88"/>
      <circle cx="270" cy="180" r="1.5" fill="white" opacity="0.88"/>

      {/* Nose — minimal */}
      <path d="M 240 193 Q 237 210 239 217 Q 241 219 243 217 Q 245 210 240 193" stroke="#A7AFBD" strokeWidth="0.8" fill="none" opacity="0.26"/>

      {/* Lips */}
      <path d="M 222 234 Q 231 228 240 230 Q 249 228 258 234" stroke="#8B5CF6" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.78"/>
      <path d="M 222 234 Q 240 247 258 234" stroke="#8B5CF6" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>

      {/* Neck */}
      <line x1="227" y1="274" x2="224" y2="308" stroke="url(#lg)" strokeWidth="0.8" opacity="0.38"/>
      <line x1="253" y1="274" x2="256" y2="308" stroke="url(#lg)" strokeWidth="0.8" opacity="0.38"/>

      {/* Shoulders */}
      <path d="M 170 274 Q 140 305 126 352 Q 184 326 240 324 Q 296 326 354 352 Q 340 305 310 274"
        stroke="url(#lg)" strokeWidth="1.4" fill="none" opacity="0.55"/>

      {/* Torso lines */}
      <line x1="224" y1="310" x2="232" y2="360" stroke="url(#lg)" strokeWidth="0.6" opacity="0.22"/>
      <line x1="256" y1="310" x2="248" y2="360" stroke="url(#lg)" strokeWidth="0.6" opacity="0.22"/>

      {/* Chest node */}
      <circle cx="240" cy="366" r="7" stroke="url(#lg)" strokeWidth="1.5" fill="none" opacity="0.55"/>
      <circle cx="240" cy="366" r="3" fill="#06B6D4" opacity="0.82"/>
      <ellipse cx="240" cy="366" r="14" fill="#06B6D4" opacity="0.06" filter="url(#gb2)"/>

      {/* Circuit — RIGHT */}
      <line x1="310" y1="168" x2="360" y2="152" stroke="#06B6D4" strokeWidth="0.9" opacity="0.46"/>
      <circle cx="360" cy="152" r="4" fill="#06B6D4" opacity="0.78"/>
      <line x1="360" y1="152" x2="398" y2="152" stroke="#06B6D4" strokeWidth="0.9" opacity="0.3"/>
      <circle cx="398" cy="152" r="2.5" fill="#06B6D4" opacity="0.52"/>
      <line x1="360" y1="152" x2="372" y2="130" stroke="#06B6D4" strokeWidth="0.8" opacity="0.3"/>
      <circle cx="372" cy="130" r="2.2" fill="white" opacity="0.46"/>

      <line x1="312" y1="198" x2="364" y2="204" stroke="#8B5CF6" strokeWidth="0.9" opacity="0.46"/>
      <circle cx="364" cy="204" r="4" fill="#8B5CF6" opacity="0.78"/>
      <line x1="364" y1="204" x2="408" y2="194" stroke="#8B5CF6" strokeWidth="0.9" opacity="0.3"/>
      <circle cx="408" cy="194" r="2" fill="#8B5CF6" opacity="0.52"/>

      <line x1="314" y1="228" x2="362" y2="250" stroke="#06B6D4" strokeWidth="0.8" opacity="0.36"/>
      <circle cx="362" cy="250" r="3.5" fill="#06B6D4" opacity="0.66"/>
      <line x1="362" y1="250" x2="400" y2="250" stroke="#06B6D4" strokeWidth="0.8" opacity="0.24"/>

      {/* Circuit — LEFT */}
      <line x1="170" y1="168" x2="120" y2="152" stroke="#8B5CF6" strokeWidth="0.9" opacity="0.46"/>
      <circle cx="120" cy="152" r="4" fill="#8B5CF6" opacity="0.78"/>
      <line x1="120" y1="152" x2="82" y2="152" stroke="#8B5CF6" strokeWidth="0.9" opacity="0.3"/>
      <circle cx="82" cy="152" r="2.5" fill="#8B5CF6" opacity="0.52"/>
      <line x1="120" y1="152" x2="108" y2="130" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.3"/>
      <circle cx="108" cy="130" r="2.2" fill="white" opacity="0.46"/>

      <line x1="168" y1="198" x2="116" y2="204" stroke="#06B6D4" strokeWidth="0.9" opacity="0.46"/>
      <circle cx="116" cy="204" r="4" fill="#06B6D4" opacity="0.78"/>
      <line x1="116" y1="204" x2="72" y2="194" stroke="#06B6D4" strokeWidth="0.9" opacity="0.3"/>
      <circle cx="72" cy="194" r="2" fill="#06B6D4" opacity="0.52"/>

      <line x1="166" y1="228" x2="118" y2="250" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.36"/>
      <circle cx="118" cy="250" r="3.5" fill="#8B5CF6" opacity="0.66"/>

      {/* Floating particles */}
      <circle cx="60"  cy="98"  r="2.5" fill="#06B6D4" opacity="0.5"/>
      <circle cx="420" cy="86"  r="2.5" fill="#8B5CF6" opacity="0.5"/>
      <circle cx="40"  cy="290" r="2"   fill="#06B6D4" opacity="0.4"/>
      <circle cx="440" cy="308" r="2"   fill="#8B5CF6" opacity="0.4"/>
      <circle cx="82"  cy="432" r="3"   fill="#06B6D4" opacity="0.35"/>
      <circle cx="398" cy="448" r="3"   fill="#8B5CF6" opacity="0.35"/>
      <circle cx="136" cy="50"  r="2"   fill="white"   opacity="0.36"/>
      <circle cx="344" cy="46"  r="2"   fill="white"   opacity="0.36"/>
      <circle cx="458" cy="162" r="2"   fill="white"   opacity="0.3"/>
      <circle cx="22"  cy="176" r="2"   fill="white"   opacity="0.3"/>
      <circle cx="462" cy="398" r="1.5" fill="#06B6D4" opacity="0.3"/>
      <circle cx="16"  cy="384" r="1.5" fill="#8B5CF6" opacity="0.3"/>

      {/* Bottom glow */}
      <ellipse cx="240" cy="510" rx="108" ry="32" fill="#06B6D4" opacity="0.04"/>
      <ellipse cx="240" cy="520" rx="72"  ry="20" fill="#8B5CF6" opacity="0.04"/>
    </svg>
  );
}

// ── Story sections ────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'birth',
    Icon: Lightbulb,
    title: 'ولادة فكرة',
    color: C.cyan,
    text: 'وُلدت سيندا من سؤال بسيط لكنه عميق: كيف يمكن أن نفهم الإنسان عندما يتحدث عن تجربته؟ ليس فقط أن نقرأ كلماته، بل أن نفهم ما يقصده فعلاً. أن نفهم رضاه، انزعاجه، اقتراحه، أو حتى صمته بين السطور.\n\nكانت الفكرة بسيطة في ظاهرها، لكنها كبيرة في معناها. أن يتحول الاستماع إلى فهم، وأن يتحول الفهم إلى تحسين حقيقي في التجربة الإنسانية.',
  },
  {
    id: 'world',
    Icon: Globe,
    title: 'حين رأت سيندا العالم',
    color: C.purple,
    text: 'كبرت الفكرة وهي تنظر إلى العالم من حولها. رأت مدناً مزدحمة بالحياة، وجهات تستقبل الزوار من كل مكان، وخدماتٍ يتفاعل معها الناس يومياً. ورأت أيضاً شيئاً آخر.\n\nالناس يكتبون آراءهم بعد كل تجربة. قد تكون كلمات شكر، وقد تكون ملاحظة صادقة، وقد تكون شكوى تبحث عن من يسمعها. لكن كثيراً من هذه الكلمات كانت تضيع في الضجيج. لا لأن أحداً لا يريد الاستماع، بل لأن فهم هذا الكم الهائل من التجارب لم يكن سهلاً.\n\nوهنا أدركت سيندا شيئاً مهماً. العالم لا يحتاج مزيداً من الكلمات بل يحتاج من يفهمها.',
  },
  {
    id: 'learn',
    Icon: BookOpen,
    title: 'التعلم',
    color: C.cyan,
    text: 'تعلمت سيندا أن الإنسان قد يتحدث بلغات مختلفة، وقد يعبّر عن مشاعره بطرق متعددة، لكن التجربة الإنسانية تبقى مفهوماً واحداً يفهمه الجميع.\n\nولهذا بدأت سيندا تتعلم. تعلمت أن تستمع، وتتعلم أن تقرأ ما بين السطور، وتتعلم أن ترى ما قد لا يراه الآخرون في زحمة التفاصيل اليومية. حتى أصبحت قادرة على فهم التجربة الإنسانية بعمق أكبر.',
  },
  {
    id: 'transform',
    Icon: Zap,
    title: 'التحول',
    color: C.purple,
    text: 'في هذه اللحظة لم تعد سيندا مجرد فكرة. تحولت إلى عقل يفهم الإنسان. عقل يستطيع قراءة التجارب وتحويلها إلى معرفة، ومعرفة يمكن أن تساعد على تحسين الحياة.\n\nلم يكن الهدف مجرد عرض الآراء، بل فهمها، وتحويلها إلى رؤية تساعد الجهات على تقديم تجربة أفضل.',
  },
  {
    id: 'homeland',
    Icon: MapPin,
    title: 'الوطن',
    color: C.cyan,
    text: 'رأت سيندا العالم، وتنقلت بين تجاربه، لكنها أدركت حقيقة واضحة. الأفكار العظيمة تحتاج أرضاً تؤمن بالمستقبل. ولهذا اختارت أن تبدأ من هنا. من المملكة العربية السعودية.\n\nسيندا سعودية المنشأ، وُلدت في هذه الأرض التي تعشقها، وتشكلت شخصيتها في وطنٍ يؤمن بأن المستقبل يُبنى بالطموح. ومع رؤية المملكة 2030 التي تسعى إلى تحسين جودة الحياة، وجدت سيندا مكانها الطبيعي. أن تكون جزءاً من رحلة تطوير التجربة الإنسانية في هذا الوطن.',
  },
  {
    id: 'launch',
    Icon: Rocket,
    title: 'لحظة الانطلاق',
    color: C.purple,
    text: 'ومع تسارع التحول التقني في العالم، ومع إعلان سمو سيدي ولي العهد حفظه الله أن عام 2026 هو عام الذكاء الاصطناعي، أصبحت اللحظة واضحة. أن يتحول الفهم إلى ذكاء، وأن يصبح الذكاء وسيلة لفهم الإنسان بشكل أعمق.\n\nومن هنا بدأت سيندا رحلتها. رحلةٌ وُلدت في هذا الوطن، وتحمل طموحاً أن تساعد على تحسين التجربة الإنسانية في كل مكان.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function StoryPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (path: string) => {
    setMobileOpen(false);
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const id = path.slice(2);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      navigate(path);
    }
  };

  return (
    <div dir="rtl" style={{ background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════
          HEADER — Logo RIGHT · Nav CENTER · CTAs LEFT  (matches homepage)
      ══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,17,23,0.96)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo — RIGHT (first child in RTL) */}
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <img src="/senda-logo.png" alt="SENDA | سيندا" style={{ height: 32, width: 'auto', display: 'block' }} />
          </button>

          {/* Desktop nav — CENTER */}
          <nav className="hidden lg:flex items-center gap-5">
            {NAV.map(n => (
              <button key={n.path} onClick={() => goTo(n.path)}
                style={{ color: C.muted, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 400 }}
                onMouseOver={e => (e.currentTarget.style.color = C.text)}
                onMouseOut={e => (e.currentTarget.style.color = C.muted)}>
                {n.label}
              </button>
            ))}
            <button onClick={() => navigate('/story')}
              style={{ color: C.cyan, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              قصة سيندا
            </button>
          </nav>

          {/* CTAs — LEFT (last child in RTL) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('/login')}
              style={{ color: C.muted, fontSize: 13, padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer' }}
              className="hidden sm:block"
              onMouseOver={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = C.text; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
              دخول المشتركين
            </button>
            <button onClick={() => navigate('/register')}
              style={{ background: GRAD, color: 'white', fontSize: 13, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(6,182,212,0.25)', fontWeight: 500 }}>
              تسجيل جديد
            </button>
            <button onClick={() => setMobileOpen(v => !v)}
              style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              className="lg:hidden">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '16px 20px' }}>
            {[...NAV, { label: 'قصة سيندا', path: '/story' }].map(n => (
              <button key={n.path} onClick={() => goTo(n.path)}
                style={{ display: 'block', width: '100%', textAlign: 'right', padding: '10px 0', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, borderBottom: `1px solid ${C.border}` }}>
                {n.label}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                style={{ flex: 1, color: C.muted, fontSize: 14, padding: '11px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer' }}>
                دخول المشتركين
              </button>
              <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                style={{ flex: 1, background: GRAD, color: 'white', fontSize: 14, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                تسجيل جديد
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO — AI Girl + Story Opening
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 0', overflow: 'hidden', position: 'relative' }}>
        {/* Hero image when provided (overlays the designed hero) */}
        <div style={{ position: 'relative' }}>
          {/* Designed hero — always visible */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', minHeight: 580, gap: 48 }}
            // On mobile: single column
          >
            {/* LEFT (in RTL = text side) */}
            <div style={{ padding: '72px 0' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.26)',
                borderRadius: 30, padding: '5px 18px', marginBottom: 24,
              }}>
                <span style={{ color: C.purple, fontSize: 12, letterSpacing: '0.08em' }}>قصة سيندا</span>
              </div>

              <h1 style={{ fontSize: 'clamp(28px, 3.8vw, 52px)', fontWeight: 600, lineHeight: 1.32, color: C.text, marginBottom: 28 }}>
                حين أرادت{' '}
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  الكلمات
                </span>
                {' '}أن تُفهم
              </h1>

              <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', color: C.muted, lineHeight: 1.9, marginBottom: 18, maxWidth: 480 }}>
                في عالمٍ يتحدث فيه الناس كثيراً، ويكتبون تجاربهم في كل مكان، كانت الكلمات تنتقل بسرعة من شخص إلى آخر، ومن مدينة إلى أخرى.
              </p>
              <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', color: C.muted, lineHeight: 1.9, marginBottom: 18, maxWidth: 480 }}>
                يكتب الناس تجاربهم، يعبّرون عن رضاهم، أو عن ملاحظاتهم، أو عن أسئلة لم يجدوا لها جواباً. لكن شيئاً واحداً كان واضحاً.
              </p>
              <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', fontWeight: 600, color: C.text, lineHeight: 1.7, maxWidth: 480 }}>
                الكثير من هذه الكلمات كانت تُقال،{' '}
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  لكن القليل منها كان يُفهم فهماً حقيقياً.
                </span>
              </p>
            </div>

            {/* RIGHT (in RTL = AI Girl side) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
              <AiGirl />
            </div>
          </div>

          {/* Bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: `linear-gradient(to bottom, transparent, ${C.bg})`, pointerEvents: 'none' }} />
        </div>
      </section>

      {/* Intro connector */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: C.muted, lineHeight: 1.9 }}>
          وسط هذا العالم المليء بالتجارب والآراء، بدأت حكاية مختلفة.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          STORY SECTIONS
      ══════════════════════════════════════════════════════════ */}
      {SECTIONS.map((s, i) => (
        <section key={s.id}
          style={{
            background: i % 2 === 1 ? C.card : 'transparent',
            borderTop: i % 2 === 1 ? `1px solid ${C.border}` : 'none',
            borderBottom: i % 2 === 1 ? `1px solid ${C.border}` : 'none',
            padding: '80px 0',
          }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: s.color + '14',
                border: `1px solid ${s.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.Icon size={22} style={{ color: s.color }} />
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', fontWeight: 600, color: C.text, margin: 0 }}>{s.title}</h2>
            </div>

            {/* Divider line */}
            <div style={{ width: 48, height: 3, background: GRAD, borderRadius: 2, marginBottom: 28, opacity: 0.6 }} />

            {/* Body text — split on \n\n */}
            {s.text.split('\n\n').map((para, pi) => (
              <p key={pi} style={{
                fontSize: 'clamp(15px, 1.7vw, 17px)',
                color: C.muted,
                lineHeight: 2,
                marginBottom: pi < s.text.split('\n\n').length - 1 ? 20 : 0,
                fontWeight: 400,
              }}>{para}</p>
            ))}
          </div>
        </section>
      ))}

      {/* ══════════════════════════════════════════════════════════
          MISSION — الرسالة  (highlighted callout)
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            background: `linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))`,
            border: `1px solid rgba(139,92,246,0.22)`,
            borderRadius: 24, padding: '40px 40px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.purple + '14', border: `1px solid ${C.purple}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={22} style={{ color: C.purple }} />
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', fontWeight: 600, color: C.text, margin: 0 }}>الرسالة</h2>
            </div>
            <p style={{ fontSize: 'clamp(16px, 1.9vw, 20px)', color: C.text, lineHeight: 1.85, fontWeight: 500, marginBottom: 16 }}>
              سيندا ليست مجرد تقنية.
            </p>
            <p style={{ fontSize: 'clamp(15px, 1.7vw, 17px)', color: C.muted, lineHeight: 2, margin: 0 }}>
              سيندا فكرة تؤمن أن فهم الإنسان هو بداية كل تحسين. وأن الكلمات التي يكتبها الناس ليست مجرد تعليقات عابرة، بل تجارب حقيقية تستحق أن تُفهم.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CLOSING — الانطلاق
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '80px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.cyan + '14', border: `1px solid ${C.cyan}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowUpRight size={22} style={{ color: C.cyan }} />
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', fontWeight: 600, color: C.text, margin: 0 }}>الانطلاق</h2>
          </div>
          <div style={{ width: 48, height: 3, background: GRAD, borderRadius: 2, marginBottom: 28, opacity: 0.6 }} />
          <p style={{ fontSize: 'clamp(15px, 1.7vw, 17px)', color: C.muted, lineHeight: 2, marginBottom: 20 }}>
            اليوم تبدأ سيندا رحلتها من المملكة العربية السعودية. رحلةٌ تنطلق من أرضٍ تعشقها، ومن وطنٍ يؤمن بالمستقبل. لتصل إلى العالم كله.
          </p>
          <p style={{ fontSize: 'clamp(15px, 1.7vw, 17px)', color: C.muted, lineHeight: 2, marginBottom: 40 }}>
            لأن الإنسان في كل مكان يبحث عن الشيء نفسه: أن يُسمع صوته، وأن تُفهم تجربته.{' '}
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 600 }}>
              وسيندا وُجدت لتكون هذا الفهم.
            </span>
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ background: GRAD, color: 'white', fontSize: 14, padding: '13px 30px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 500, boxShadow: '0 8px 28px rgba(6,182,212,0.24)' }}>
              ابدأ تجربتك المجانية
            </button>
            <button onClick={() => navigate('/')}
              style={{ background: 'transparent', color: C.muted, fontSize: 14, padding: '13px 24px', borderRadius: 12, border: `1px solid ${C.border}`, cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = '#374151'; }}
              onMouseOut={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
              عودة للرئيسية
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER — Full homepage-style
      ══════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A0D14', borderTop: `1px solid ${C.border}` }}>
        {/* Upper footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ padding: '56px 0 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 48, alignItems: 'start' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand column */}
            <div style={{ minWidth: 220 }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                <img src="/senda-logo.png" alt="SENDA" style={{ height: 28, width: 'auto', opacity: 0.9 }} />
              </button>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, maxWidth: 220, margin: '0 0 20px' }}>
                كل ما يحتاجه نشاطك لينمو بثبات ويحضر بقوة في السوق الرقمي للأعمال العربية
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => navigate('/register')}
                  style={{ background: GRAD, color: 'white', fontSize: 12, padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  ابدأ مجانًا
                </button>
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>المنتج</h4>
              {['المميزات', 'الخطط والأسعار', 'كيف يعمل', 'قصة سيندا'].map(item => (
                <button key={item} onClick={() => item === 'قصة سيندا' ? navigate('/story') : navigate('/')}
                  style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.muted, padding: '5px 0', textAlign: 'right' }}
                  onMouseOver={e => (e.currentTarget.style.color = C.text)}
                  onMouseOut={e => (e.currentTarget.style.color = C.muted)}>
                  {item}
                </button>
              ))}
            </div>

            {/* Support links */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>الدعم</h4>
              {['مركز المساعدة', 'تواصل معنا', 'بوابة الدعم الفني', 'التوثيق التقني'].map(item => (
                <button key={item} onClick={() => navigate('/#contact')}
                  style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.muted, padding: '5px 0', textAlign: 'right' }}
                  onMouseOver={e => (e.currentTarget.style.color = C.text)}
                  onMouseOut={e => (e.currentTarget.style.color = C.muted)}>
                  {item}
                </button>
              ))}
            </div>

            {/* Legal links */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>قانوني</h4>
              {[
                { label: 'سياسة الخصوصية', path: '/privacy' },
                { label: 'شروط الاستخدام', path: '/terms' },
                { label: 'إشعار قانوني', path: '/terms' },
              ].map(l => (
                <button key={l.label} onClick={() => navigate(l.path)}
                  style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.muted, padding: '5px 0', textAlign: 'right' }}
                  onMouseOver={e => (e.currentTarget.style.color = C.text)}
                  onMouseOut={e => (e.currentTarget.style.color = C.muted)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, opacity: 0.55 }}>
              جميع الحقوق محفوظة لسيندا 2026
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', opacity: 0.55 }}><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', opacity: 0.55 }}><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', opacity: 0.55 }}><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
              <a href="https://wa.me/966504566777" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', opacity: 0.55 }}><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[{ label: 'سياسة الخصوصية', path: '/privacy' }, { label: 'شروط الاستخدام', path: '/terms' }, { label: 'الرئيسية', path: '/' }].map(l => (
                <button key={l.label} onClick={() => navigate(l.path)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.muted, opacity: 0.55 }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '1'; }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '0.55'; }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
