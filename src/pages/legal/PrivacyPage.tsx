// SENDA — سياسة الخصوصية
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

export default function PrivacyPage() {
  return (
    <LegalLayout title="سياسة الخصوصية" subtitle="آخر تحديث: مارس 2026">
      <Section title="المقدمة">
        <p style={{ margin: 0 }}>تلتزم سيندا بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع المعلومات واستخدامها وحمايتها عند استخدامك لمنصتنا.</p>
      </Section>

      <Section title="المعلومات التي نجمعها">
        <p style={{ margin: '0 0 12px' }}>نجمع المعلومات التالية عند استخدامك للمنصة:</p>
        <ul style={{ margin: 0, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>معلومات الحساب: الاسم، البريد الإلكتروني، اسم الشركة</li>
          <li>بيانات الاستخدام: التقييمات، الردود، إحصاءات الأداء</li>
          <li>معلومات الفواتير: بيانات الاشتراك (دون تخزين بيانات البطاقة مباشرة)</li>
          <li>بيانات تقنية: عنوان IP، نوع المتصفح، سجلات الاستخدام</li>
        </ul>
      </Section>

      <Section title="كيف نستخدم بياناتك">
        <ul style={{ margin: 0, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>تقديم خدمات المنصة وتحسينها باستمرار</li>
          <li>إرسال إشعارات متعلقة بحسابك وتقييماتك</li>
          <li>تحسين تجربة المستخدم بناءً على أنماط الاستخدام</li>
          <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
        </ul>
      </Section>

      <Section title="حماية بياناتك">
        <p style={{ margin: 0 }}>نستخدم معايير تشفير SSL/TLS لحماية البيانات أثناء النقل. يتم تخزين البيانات على خوادم آمنة مع نسخ احتياطية تلقائية يومية. لا نبيع بياناتك أو نشاركها مع أطراف ثالثة لأغراض تجارية.</p>
      </Section>

      <Section title="ملفات تعريف الارتباط (Cookies)">
        <p style={{ margin: 0 }}>نستخدم ملفات تعريف الارتباط الأساسية للحفاظ على جلسة تسجيل الدخول وتحسين أداء المنصة. يمكنك إدارة إعدادات ملفات تعريف الارتباط من إعدادات متصفحك.</p>
      </Section>

      <Section title="حقوقك">
        <ul style={{ margin: 0, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>الحق في الاطلاع على بياناتك الشخصية المخزنة</li>
          <li>الحق في تصحيح أي معلومات غير دقيقة</li>
          <li>الحق في طلب حذف حسابك وبياناتك</li>
          <li>الحق في نقل بياناتك لمنصة أخرى</li>
        </ul>
      </Section>

      <Section title="التواصل معنا">
        <p style={{ margin: 0 }}>لأي استفسار يتعلق بخصوصيتك أو بياناتك، يمكنك التواصل معنا عبر نموذج التواصل في الصفحة الرئيسية. سنرد على استفساراتك خلال 48 ساعة عمل.</p>
      </Section>
    </LegalLayout>
  );
}
