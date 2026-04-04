// SENDA — شروط الاستخدام
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

const C = { bg: '#0F1117', card: '#151922', border: '#242A36', text: '#F3F4F6', muted: '#A7AFBD', brand: '#C9D8E6', cyan: '#06B6D4' };
const GRAD = 'linear-gradient(135deg, #06B6D4, #8B5CF6)';

function LegalLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div dir="rtl" style={{ background: C.bg, color: C.text, minHeight: '100vh' }}>
      <div style={{ background: 'rgba(15,17,23,0.96)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')} className="flex items-center gap-2" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14 }}
            onMouseOver={e => (e.currentTarget.style.color = C.text)} onMouseOut={e => (e.currentTarget.style.color = C.muted)}>
            <ArrowRight size={16} />الرئيسية
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={13} style={{ color: 'white' }} /></div>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>SENDA | سيندا</span>
          </div>
          <div style={{ width: 80 }} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ padding: '64px 16px 96px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: C.cyan, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>قانوني</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 10 }}>{title}</h1>
          <p style={{ fontSize: 14, color: C.muted }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>{children}</div>
      </div>
      <div style={{ background: '#0A0D14', borderTop: `1px solid ${C.border}`, padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>© 2026 سيندا. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '28px 28px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 14, marginTop: 0 }}>{title}</h2>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.85, fontWeight: 400 }}>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout title="شروط الاستخدام" subtitle="آخر تحديث: مارس 2026 — تسري على جميع مستخدمي منصة سيندا">
      <Section title="قبول الشروط">
        <p style={{ margin: 0 }}>باستخدامك لمنصة سيندا، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام المنصة.</p>
      </Section>

      <Section title="وصف الخدمة">
        <p style={{ margin: 0 }}>سيندا منصة SaaS متخصصة في إدارة تقييمات جوجل، وتشمل الخدمات: الرد التلقائي بالذكاء الاصطناعي، إنشاء رموز QR لجمع التقييمات، تقارير الأداء، وإدارة الفريق والفروع.</p>
      </Section>

      <Section title="التزامات المستخدم">
        <ul style={{ margin: 0, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
          <li>عدم استخدام المنصة لأي نشاط مخالف للقانون أو السياسات</li>
          <li>عدم محاولة اختراق أو التدخل في أنظمة المنصة</li>
          <li>المسؤولية الكاملة عن محتوى الردود التي تنشرها عبر المنصة</li>
          <li>الحفاظ على سرية بيانات تسجيل الدخول</li>
        </ul>
      </Section>

      <Section title="الاشتراكات والدفع">
        <p style={{ margin: '0 0 12px' }}>تُدار الاشتراكات على أساس شهري أو سنوي. يحق للمستخدم إلغاء اشتراكه في أي وقت. تُحتسب الرسوم مقدمًا ولا تُرد في حال الإلغاء خلال الفترة الحالية إلا وفق سياسة الاسترداد المعمول بها.</p>
      </Section>

      <Section title="الملكية الفكرية">
        <p style={{ margin: 0 }}>جميع حقوق الملكية الفكرية لمنصة سيندا — بما يشمل الكود والتصاميم والمحتوى — محفوظة لسيندا. يُمنح المستخدم رخصة استخدام محدودة وغير قابلة للتحويل.</p>
      </Section>

      <Section title="حدود المسؤولية">
        <p style={{ margin: 0 }}>لا تتحمل سيندا مسؤولية أي أضرار غير مباشرة تنجم عن استخدام أو عدم إمكانية استخدام الخدمة. نسعى للحفاظ على مستوى خدمة بنسبة 99.9% لعملاء خطة Galaxy وInfinity.</p>
      </Section>

      <Section title="تعديل الشروط">
        <p style={{ margin: 0 }}>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو داخل المنصة قبل 30 يومًا من سريانها.</p>
      </Section>

      <Section title="القانون الحاكم">
        <p style={{ margin: 0 }}>تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاع يُحكم وفق الأنظمة السعودية المعمول بها.</p>
      </Section>
    </LegalLayout>
  );
}
