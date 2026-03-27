// ============================================================================
// SADEEM — Public Marketing Homepage
// Colors: bg=#0F1117 · card=#151922 · border=#242A36
//         text=#F3F4F6 · muted=#A7AFBD · brand=#C9D8E6
// Typography: Semibold headings, Medium labels, Regular body — no excessive bold
// Routing: دخول المشتركين → /login  |  تسجيل جديد → /login
// Contact form submits to Edge Function (destination email never exposed)
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageSquare, QrCode, BarChart3, Building2, Users, Zap, Shield,
  Brain, FileText, CheckCircle2, X, ChevronDown, Send, Loader2, Menu,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#0F1117',
  card:    '#151922',
  card2:   '#1A2030',
  border:  '#242A36',
  text:    '#F3F4F6',
  muted:   '#A7AFBD',
  brand:   '#C9D8E6',
  cyan:    '#06B6D4',
  purple:  '#8B5CF6',
  green:   '#10B981',
  amber:   '#F59E0B',
  pink:    '#EC4899',
  orange:  '#F97316',
  red:     '#EF4444',
  indigo:  '#6366F1',
};
const GRAD = 'linear-gradient(135deg, #06B6D4, #8B5CF6)';

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV: { label: string; id?: string; href?: string }[] = [
  { label: 'الرئيسية',        id: 'hero'         },
  { label: 'المميزات',        id: 'features'     },
  { label: 'كيف تعمل',       id: 'how-it-works' },
  { label: 'الأسعار',         id: 'pricing'      },
  { label: 'الأسئلة الشائعة', id: 'faq'         },
  { label: 'قصة سديم',        href: '/story'     },
  { label: 'اتصل بنا',        id: 'contact'      },
];

// ─── Static QR pixel pattern (8×8 deterministic) ─────────────────────────────
const QR_GRID = [
  1,1,1,0,1,1,1,1,
  1,0,1,1,0,0,1,0,
  1,0,1,0,1,1,1,1,
  0,1,0,1,0,1,0,0,
  1,1,1,1,1,0,1,1,
  0,0,1,0,0,1,0,1,
  1,1,0,1,1,1,0,1,
  1,0,1,1,0,0,1,1,
];

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    nav: ['الرئيسية', 'المميزات', 'كيف تعمل', 'الأسعار', 'الأسئلة الشائعة', 'قصة سديم', 'اتصل بنا'],
    heroBadge: 'منصة إدارة تقييمات جوجل رقم 1 عربيًا',
    heroH1a: 'كل تقييم جوجل',
    heroH1b: 'فرصة حقيقية',
    heroH1c: 'لنمو عملك',
    heroDesc: 'ردود ذكية بالـ AI، جمع تقييمات بـ QR، وتحليلات السمعة لجميع فروعك — كل شيء في مكان واحد',
    heroCtaStart: 'ابدأ الآن',
    heroCtaLogin: 'دخول المشتركين',
    heroCtaWatch: 'شاهد كيف تعمل سديم',
    heroStats: [{ val: '+500', lbl: 'عمل نشط' }, { val: '98%', lbl: 'رضا العملاء' }, { val: '4.8★', lbl: 'تقييمنا' }, { val: '24/7', lbl: 'دعم مستمر' }],
    dashTitle: 'لوحة تحكم سديم',
    dashStats: [{ label: 'التقييمات', value: '2,847' }, { label: 'المتوسط', value: '4.8 ★' }, { label: 'نسبة الرد', value: '94%' }, { label: 'هذا الشهر', value: '+124' }],
    reviewDone: 'تم الرد',
    reviewAi: 'AI يرد…',
    aiCardTitle: 'رد ذكي جاهز',
    aiCardText: '"شكرًا على ملاحظتك القيّمة! نعمل باستمرار على تحسين..."',
    aiPublish: 'نشر',
    aiEdit: 'تعديل',
    googleNew: 'تقييم جوجل جديد',
    googleTime: 'منذ دقيقة',
    googleText: '"أحسنتم! السرعة والجودة في مكان واحد"',
    benefitLabels: ['ردود بالذكاء الاصطناعي', 'جمع تقييمات بـ QR', 'تحليلات متقدمة', 'إدارة الفروع', 'تعاون الفريق', 'تكاملات سلسة'],
    featuresLabel: 'لماذا سديم؟',
    featuresH2: 'كل ما تحتاجه لإدارة سمعتك الرقمية',
    featuresDesc: 'سديم يجمع في منصة واحدة جميع الأدوات التي تحتاجها لتحسين تقييماتك وبناء ثقة عملائك',
    featureCards: [
      { title: 'ردود بالذكاء الاصطناعي', desc: 'ردود مخصصة لكل تقييم تعكس هوية علامتك في ثوانٍ معدودة' },
      { title: 'سرعة رد غير مسبوقة',    desc: 'رد قبل المنافسين وأثبت لعملائك اهتمامك الحقيقي بآرائهم' },
      { title: 'جمع تقييمات بـ QR',      desc: 'حوّل كل لقاء مع عميل إلى تقييم جوجل بمجرد مسح رمز بسيط' },
      { title: 'تحليلات عميقة',           desc: 'بيانات حقيقية عن أداء سمعتك لاتخاذ قرارات أذكى وأسرع' },
      { title: 'إدارة متعددة الفروع',    desc: 'أدر جميع فروعك ومواقعك من لوحة تحكم مركزية واحدة' },
      { title: 'قوالب ردود احترافية',   desc: 'مكتبة من القوالب الجاهزة يمكنك تخصيصها لتناسب نبرة علامتك' },
      { title: 'إدارة الفريق',           desc: 'وزّع المهام وراقب أداء الفريق مع صلاحيات مخصصة لكل عضو' },
      { title: 'أمان وموثوقية',          desc: 'بياناتك محمية بمعايير تشفير عالمية مع نسخ احتياطية تلقائية' },
    ],
    sec1Label: 'الذكاء الاصطناعي',
    sec1H2: 'الذكاء الاصطناعي يرد بدلًا عنك — بأسلوبك أنت',
    sec1Desc: 'لا مزيد من قضاء ساعات في صياغة ردود على التقييمات. سديم يحلل كل تقييم ويولّد ردًا يناسب نبرة علامتك التجارية — سواء كان التقييم إيجابيًا أو سلبيًا. فقط راجع وانشر.',
    sec1Items: ['تحليل المشاعر وفهم سياق التقييم تلقائيًا', 'ردود باللغة العربية والإنجليزية', 'تعديل النبرة بما يناسب نوع عملك', 'مراجعة وتعديل الرد قبل نشره'],
    sec1ReviewText: 'خدمة ممتازة ومحترفة. سأعود بكل تأكيد!',
    sec1ReviewName: 'محمد أحمد',
    sec1AiLabel: 'سديم يولد ردًا مناسبًا...',
    sec1AiReply: 'شكرًا جزيلًا يا محمد على هذا التقييم الجميل! يسعدنا أنك أحببت تجربتك معنا، ننتظر زيارتك القادمة بكل سرور 😊',
    sec1PostReply: 'نشر الرد',
    sec1Edit: 'تعديل',
    sec2Label: 'QR Reviews',
    sec2H2: 'اجمع تقييمات جوجل بمسح بسيط',
    sec2Desc: 'بدلًا من طلب التقييم بشكل محرج، ضع QR Code على الطاولة أو المنصة أو الفاتورة. يمسحه العميل، يختار الموظف، ويصل مباشرة لصفحة جوجل.',
    sec2Items: ['QR Code مخصص لكل فرع أو موظف', 'تتبع مصدر كل تقييم تلقائيًا', 'تصميم بهوية علامتك التجارية', 'بيانات آنية عن حجم التقييمات'],
    sec2ScanText: 'امسح واكتب تقييمك على جوجل',
    sec2Branches: [{ name: 'فرع الرياض', count: 47 }, { name: 'فرع جدة', count: 32 }, { name: 'فرع الدمام', count: 28 }],
    sec3Label: 'التحليلات',
    sec3H2: 'تحليلات تخبرك بما لا تراه بالعين المجردة',
    sec3Desc: 'من أي فرع يأتي أكثر التقييمات؟ ما الكلمات التي تتكرر في التقييمات السلبية؟ متى يتراجع معدل الرد؟ سديم يجيب تلقائيًا حتى تعرف أين تركز جهودك.',
    sec3Items: ['مقارنة الأداء بين جميع الفروع', 'تحليل المشاعر والكلمات المتكررة', 'تقارير أسبوعية وشهرية تلقائية', 'تنبيهات فورية للتقييمات السلبية'],
    sec3ChartTitle: 'التقييمات هذا الشهر',
    sec3Branches: [{ label: 'فرع الرياض', pct: 78 }, { label: 'فرع جدة', pct: 65 }, { label: 'فرع الدمام', pct: 52 }],
    sec3StatLabels: ['متوسط التقييم', 'معدل الرد'],
    sec4Label: 'إدارة الفريق',
    sec4H2: 'فريقك الكامل في بيئة عمل واحدة',
    sec4Desc: 'أضف أعضاء الفريق، خصص صلاحياتهم، واجعل كل شخص يرى فقط ما يحتاجه. من مدير الفرع إلى صاحب العمل — الجميع في صفحة واحدة بمعلومات صحيحة.',
    sec4Items: ['أدوار وصلاحيات مرنة لكل عضو', 'مراقبة أداء الفريق في الوقت الفعلي', 'تعيين تقييمات محددة لأفراد', 'إشعارات فورية للمهام الجديدة'],
    sec4Team: [{ name: 'أحمد', role: 'مدير عام' }, { name: 'سارة', role: 'مديرة فرع الرياض' }, { name: 'خالد', role: 'مشرف فرع جدة' }, { name: 'نورة', role: 'موظفة دعم العملاء' }],
    sec4RepliesLabel: 'ردًا',
    baH2: 'قبل وبعد سديم',
    baDesc: 'الفرق واضح — والنتائج حقيقية',
    baBeforeTitle: 'قبل سديم',
    baAfterTitle: 'بعد سديم',
    baBefore: ['ردود متأخرة أو مفقودة على التقييمات', 'جمع التقييمات يعتمد على الحظ والمزاج', 'لا رؤية حقيقية للأداء عبر الفروع', 'الفريق يعمل دون تنسيق واضح', 'ساعات ضائعة في صياغة ردود يدوية', 'التقييمات السلبية تمر دون تدخل'],
    baAfter: ['رد في دقائق بمساعدة الذكاء الاصطناعي', 'QR Code يجمع التقييمات بشكل منتظم', 'تقارير شاملة لكل فرع في مكان واحد', 'فريق منظم بصلاحيات وأدوار واضحة', 'وقت أقل — نتائج وسمعة أفضل بكثير', 'تنبيهات فورية للتقييمات تحتاج اهتمامًا'],
    philLabel: 'من نحن',
    philH2: 'ما الذي يجعلنا مختلفين؟',
    philDesc: 'سديم ليس مجرد أداة — هو شريك تقني مبني للسوق العربي بكل تفاصيله واحتياجاته',
    philCards: [
      { emoji: '🎯', title: 'سهولة الاستخدام', desc: 'منتج بسيط بما يكفي أن تستخدمه بدون تدريب أو خبرة تقنية مسبقة' },
      { emoji: '🌍', title: 'عربي في جوهره',   desc: 'مبني للسوق العربي من البداية، وليس مجرد ترجمة لمنتج غربي' },
      { emoji: '🤝', title: 'شراكة حقيقية',   desc: 'نستمع لعملائنا باستمرار ونبني ما يحتاجونه فعلًا، لا ما نظن أنهم يريدونه' },
      { emoji: '🚀', title: 'نمو مستمر',       desc: 'نحدّث سديم باستمرار بناءً على ملاحظاتك ومتطلبات السوق المتغيرة' },
    ],
    pricingLabel: 'الخطط والأسعار',
    pricingH2: 'ابدأ بالخطة المناسبة لعملك',
    pricingDesc: 'جميع الخطط تشمل فترة تجريبية مجانية — لا بطاقة ائتمان مطلوبة',
    pricingMostPopular: 'الأكثر طلبًا',
    plans: [
      { name: 'Orbit', nameLocal: 'الأساسي', desc: 'للمشاريع الصغيرة التي تبدأ رحلتها في إدارة السمعة', features: ['فرع واحد', 'رد ذكي بالـ AI', 'QR Code مخصص', 'تقارير أساسية', 'دعم عبر البريد'] },
      { name: 'Nova',  nameLocal: 'المتقدم',  desc: 'للأعمال المتنامية التي تدير أكثر من فرع وفريق عمل', features: ['حتى 5 فروع', 'كل مميزات Orbit', 'إدارة الفريق', 'تحليلات متقدمة', 'قوالب مخصصة', 'دعم أولوية'] },
      { name: 'Galaxy',  nameLocal: 'المحترف',  desc: 'للمؤسسات الكبيرة التي تحتاج حلولًا متكاملة وغير محدودة', features: ['فروع غير محدودة', 'كل مميزات Nova', 'تكاملات API', 'تقارير مخصصة', 'مدير حساب مخصص', 'SLA مضمون'] },
      { name: 'Infinity', nameLocal: 'المؤسسي', desc: 'للمجموعات والامتيازات الكبيرة — حل مؤسسي شامل بلا قيود', features: ['فروع غير محدودة', 'كل مميزات Galaxy', 'API كامل', 'تقارير white-label', 'فريق دعم مخصص', 'SLA 99.9%', 'تدريب الفريق'] },
    ],
    pricingCtaHighlight: 'ابدأ مجانًا الآن',
    pricingCtaDefault: 'ابدأ مجانًا',
    compareTitle: 'مقارنة بين الخطط',
    compareFeatureCol: 'الميزة',
    compareRows: [
      { label: 'عدد الفروع',     vals: ['1', '5', 'غير محدود', 'غير محدود'] },
      { label: 'رد ذكي بالـ AI', vals: ['✓', '✓', '✓', '✓'] },
      { label: 'QR Code مخصص',   vals: ['✓', '✓', '✓', '✓'] },
      { label: 'إدارة الفريق',   vals: ['—', '✓', '✓', '✓'] },
      { label: 'تحليلات متقدمة', vals: ['—', '✓', '✓', '✓'] },
      { label: 'تكامل API',      vals: ['—', '—', '✓', '✓'] },
      { label: 'مدير حساب مخصص', vals: ['—', '—', '✓', '✓'] },
      { label: 'White-label',    vals: ['—', '—', '—', '✓'] },
      { label: 'SLA مضمون',      vals: ['—', '—', '✓', '99.9%'] },
      { label: 'دعم',            vals: ['بريد', 'أولوية', 'مخصص', 'فريق كامل'] },
    ],
    pricingCustomText: 'تحتاج خطة مخصصة لمؤسستك؟',
    pricingContactLink: 'تواصل معنا',
    faqLabel: 'الأسئلة الشائعة',
    faqH2: 'لديك أسئلة؟ لدينا إجابات',
    faqs: [
      { q: 'ما هو سديم وكيف يساعد عملي؟', a: 'سديم منصة متكاملة لإدارة تقييمات جوجل. تساعدك على الرد على التقييمات بالذكاء الاصطناعي، وجمع تقييمات جديدة عبر QR Code، ومراقبة أداء سمعتك عبر جميع فروعك في لوحة تحكم واحدة.' },
      { q: 'كيف يعمل الرد التلقائي بالذكاء الاصطناعي؟', a: 'عند وصول تقييم جديد، يقرأ نظام الذكاء الاصطناعي التقييم ويولّد ردًا يتطابق مع نبرة علامتك التجارية. يمكنك مراجعة الرد وتعديله قبل النشر، أو ضبط الرد التلقائي الفوري.' },
      { q: 'هل يمكنني إدارة أكثر من فرع؟', a: 'بالطبع! سديم مصمم أصلًا لإدارة متعددة الفروع. تستطيع ربط جميع مواقعك ورؤية التقارير والتقييمات لكل فرع بشكل منفصل أو مجمّع.' },
      { q: 'هل هناك تجربة مجانية؟', a: 'نعم! جميع الخطط تتضمن فترة تجريبية مجانية لا تحتاج فيها إلى بطاقة ائتمان. سجّل الآن وجرّب سديم بكل راحة.' },
      { q: 'ما الفرق بين خطط Orbit وNova وGalaxy؟', a: 'Orbit مثالية للمشاريع الصغيرة بفرع واحد. Nova مناسبة للأعمال المتنامية بعدة فروع وفريق عمل. Galaxy مصممة للمؤسسات الكبيرة بفروع غير محدودة وتكاملات API ومدير حساب مخصص.' },
      { q: 'كيف يعمل نظام QR Code بالتفصيل؟', a: 'تنشئ رمز QR خاصًا بكل فرع أو موظف عبر سديم، تطبعه أو تعرضه للعملاء. عند المسح، يصل العميل مباشرة لصفحة التقييم على جوجل مع تتبع تلقائي لمصدر التقييم والموظف المُخدِّم.' },
      { q: 'هل بياناتي ومعلومات عملائي آمنة؟', a: 'بالتأكيد. نستخدم معايير تشفير عالمية لحماية جميع البيانات مع نسخ احتياطية تلقائية يومية. لا نبيع أو نشارك أي بيانات مع أطراف خارجية بأي شكل.' },
      { q: 'كيف أتواصل مع فريق الدعم؟', a: 'نقدم دعمًا متخصصًا عبر البريد الإلكتروني وبوابة الدعم داخل لوحة التحكم. عملاء خطة Galaxy يحصلون على مدير حساب مخصص مع استجابة مضمونة خلال ساعة عمل.' },
    ],
    contactLabel: 'تواصل معنا',
    contactH2: 'نحب أن نسمع منك',
    contactDesc: 'سواء كان لديك سؤال، طلب تجربة، أو تريد معرفة المزيد — فريقنا هنا',
    contactFields: { name: 'الاسم الكامل *', email: 'البريد الإلكتروني *', phone: 'رقم الهاتف', company: 'اسم الشركة', message: 'رسالتك *' },
    contactPlaceholders: { name: 'محمد أحمد', email: 'email@example.com', phone: '+966 5X XXX XXXX', company: 'شركتك أو مطعمك...', message: 'أخبرنا عن عملك وما تحتاجه...' },
    contactSubmit: 'إرسال الرسالة',
    contactSending: 'جاري الإرسال...',
    contactSuccessTitle: 'تم إرسال رسالتك بنجاح!',
    contactSuccessDesc: 'سيتواصل معك فريقنا في أقرب وقت ممكن',
    contactSuccessRetry: 'إرسال رسالة أخرى',
    contactError: 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.',
    footerTagline: 'منصة متكاملة لإدارة تقييمات جوجل وتحسين السمعة الرقمية للأعمال العربية',
    footerCols: [
      { heading: 'المنتج',   items: ['المميزات', 'الخطط والأسعار', 'كيف يعمل', 'التحديثات الجديدة', 'دراسات حالة'] },
      { heading: 'الدعم',    items: ['مركز المساعدة', 'تواصل معنا', 'بوابة الدعم الفني', 'التوثيق التقني', 'حالة الخدمة'] },
    ],
    footerLegal: { heading: 'قانوني', links: [{ label: 'سياسة الخصوصية', path: '/privacy' }, { label: 'شروط الاستخدام', path: '/terms' }, { label: 'قصة سديم', path: '/story' }, { label: 'إشعار قانوني', path: '/terms' }, { label: 'خريطة الموقع', path: '/' }] },
    footerBottomLinks: [{ label: 'سياسة الخصوصية', path: '/privacy' }, { label: 'شروط الاستخدام', path: '/terms' }, { label: 'قصة سديم', path: '/story' }, { label: 'إشعار قانوني', path: '/terms' }, { label: 'الرئيسية', path: '/' }],
    copyright: '© 2026 سديم. جميع الحقوق محفوظة.',
    loginBtn: 'دخول المشتركين',
    registerBtn: 'تسجيل جديد',
  },
  en: {
    nav: ['Home', 'Features', 'How It Works', 'Pricing', 'FAQ', 'Our Story', 'Contact'],
    heroBadge: 'The #1 Google Reviews Platform in the Arab World',
    heroH1a: 'Every Google Review',
    heroH1b: 'a Real Opportunity',
    heroH1c: 'to Grow Your Business',
    heroDesc: 'Smart AI replies, QR review collection, and reputation analytics for all your branches — everything in one place',
    heroCtaStart: 'Get Started',
    heroCtaLogin: 'Subscriber Login',
    heroCtaWatch: 'See How SADEEM Works',
    heroStats: [{ val: '500+', lbl: 'Active Businesses' }, { val: '98%', lbl: 'Customer Satisfaction' }, { val: '4.8★', lbl: 'Our Rating' }, { val: '24/7', lbl: 'Ongoing Support' }],
    dashTitle: 'SADEEM Dashboard',
    dashStats: [{ label: 'Reviews', value: '2,847' }, { label: 'Average', value: '4.8 ★' }, { label: 'Reply Rate', value: '94%' }, { label: 'This Month', value: '+124' }],
    reviewDone: 'Replied',
    reviewAi: 'AI Replying…',
    aiCardTitle: 'Smart Reply Ready',
    aiCardText: '"Thank you for your valuable feedback! We continuously work to improve..."',
    aiPublish: 'Publish',
    aiEdit: 'Edit',
    googleNew: 'New Google Review',
    googleTime: '1 min ago',
    googleText: '"Excellent! Speed and quality in one place"',
    benefitLabels: ['AI-Powered Replies', 'QR Review Collection', 'Advanced Analytics', 'Branch Management', 'Team Collaboration', 'Seamless Integrations'],
    featuresLabel: 'WHY SADEEM?',
    featuresH2: 'Everything You Need to Manage Your Digital Reputation',
    featuresDesc: 'SADEEM brings together in one platform all the tools you need to improve your reviews and build customer trust',
    featureCards: [
      { title: 'AI-Powered Replies',          desc: 'Personalized replies for every review that reflect your brand identity in seconds' },
      { title: 'Unmatched Reply Speed',        desc: 'Reply before competitors and show customers you truly care about their feedback' },
      { title: 'QR Review Collection',         desc: 'Turn every customer encounter into a Google review with a simple scan' },
      { title: 'Deep Analytics',               desc: 'Real data about your reputation performance to make smarter, faster decisions' },
      { title: 'Multi-Branch Management',      desc: 'Manage all your branches and locations from one centralized dashboard' },
      { title: 'Professional Reply Templates', desc: 'A library of ready templates you can customize to match your brand tone' },
      { title: 'Team Management',              desc: 'Distribute tasks and monitor team performance with custom permissions' },
      { title: 'Security & Reliability',       desc: 'Your data is protected with global encryption standards and automatic backups' },
    ],
    sec1Label: 'ARTIFICIAL INTELLIGENCE',
    sec1H2: 'AI Replies for You — In Your Voice',
    sec1Desc: 'No more spending hours crafting review responses. SADEEM analyzes each review and generates a reply that matches your brand tone — whether the review is positive or negative. Just review and publish.',
    sec1Items: ['Automatic sentiment analysis and context understanding', 'Replies in both Arabic and English', 'Tone adjustment to match your business type', 'Review and edit the reply before publishing'],
    sec1ReviewText: 'Excellent and professional service. I will definitely return!',
    sec1ReviewName: 'Mohammed Ahmed',
    sec1AiLabel: 'SADEEM is generating a reply...',
    sec1AiReply: 'Thank you so much, Mohammed, for this wonderful review! We are delighted you enjoyed your experience with us. We look forward to your next visit! 😊',
    sec1PostReply: 'Post Reply',
    sec1Edit: 'Edit',
    sec2Label: 'QR REVIEWS',
    sec2H2: 'Collect Google Reviews with a Simple Scan',
    sec2Desc: 'Instead of awkwardly asking for reviews, place a QR Code on the table, counter, or receipt. The customer scans it, chooses a staff member, and lands directly on your Google page.',
    sec2Items: ['Custom QR Code for each branch or employee', 'Automatically track the source of every review', 'Designed with your brand identity', 'Real-time data on review volume'],
    sec2ScanText: 'Scan and leave your Google review',
    sec2Branches: [{ name: 'Riyadh Branch', count: 47 }, { name: 'Jeddah Branch', count: 32 }, { name: 'Dammam Branch', count: 28 }],
    sec3Label: 'ANALYTICS',
    sec3H2: 'Analytics That Reveal What You Cannot See',
    sec3Desc: 'Which branch gets the most reviews? What words repeat in negative reviews? When does reply rate drop? SADEEM answers automatically so you know where to focus.',
    sec3Items: ['Performance comparison across all branches', 'Sentiment analysis and recurring keywords', 'Automatic weekly and monthly reports', 'Instant alerts for negative reviews'],
    sec3ChartTitle: 'Reviews This Month',
    sec3Branches: [{ label: 'Riyadh Branch', pct: 78 }, { label: 'Jeddah Branch', pct: 65 }, { label: 'Dammam Branch', pct: 52 }],
    sec3StatLabels: ['Avg. Rating', 'Reply Rate'],
    sec4Label: 'TEAM MANAGEMENT',
    sec4H2: 'Your Entire Team in One Workspace',
    sec4Desc: 'Add team members, set their permissions, and let each person see only what they need. From branch manager to business owner — everyone on one page with the right information.',
    sec4Items: ['Flexible roles and permissions for each member', 'Monitor team performance in real time', 'Assign specific reviews to individuals', 'Instant notifications for new tasks'],
    sec4Team: [{ name: 'Ahmed', role: 'General Manager' }, { name: 'Sara', role: 'Riyadh Branch Manager' }, { name: 'Khalid', role: 'Jeddah Branch Supervisor' }, { name: 'Noura', role: 'Customer Support Staff' }],
    sec4RepliesLabel: 'replies',
    baH2: 'Before & After SADEEM',
    baDesc: 'The difference is clear — the results are real',
    baBeforeTitle: 'Before SADEEM',
    baAfterTitle: 'After SADEEM',
    baBefore: ['Delayed or missed responses to reviews', 'Collecting reviews relies on luck and mood', 'No real visibility across branches', 'Team works without clear coordination', 'Hours wasted writing manual replies', 'Negative reviews pass without action'],
    baAfter: ['Reply in minutes with AI assistance', 'QR Code collects reviews consistently', 'Comprehensive reports for each branch', 'Organized team with clear roles and permissions', 'Less time — far better results and reputation', 'Instant alerts for reviews needing attention'],
    philLabel: 'WHO WE ARE',
    philH2: 'What Makes Us Different?',
    philDesc: 'SADEEM is more than a tool — it\'s a technology partner built for the Arab market with all its details and needs',
    philCards: [
      { emoji: '🎯', title: 'Ease of Use',       desc: 'Simple enough to use without training or prior technical knowledge' },
      { emoji: '🌍', title: 'Arabic at Heart',    desc: 'Built for the Arab market from the ground up, not just a translation of a Western product' },
      { emoji: '🤝', title: 'True Partnership',   desc: 'We listen to our customers and build what they actually need, not what we think they want' },
      { emoji: '🚀', title: 'Continuous Growth',  desc: 'We continuously update SADEEM based on your feedback and evolving market requirements' },
    ],
    pricingLabel: 'PLANS & PRICING',
    pricingH2: 'Start with the Plan That Fits Your Business',
    pricingDesc: 'All plans include a free trial — no credit card required',
    pricingMostPopular: 'Most Popular',
    plans: [
      { name: 'Orbit',    nameLocal: 'Starter',    desc: 'For small businesses starting their reputation management journey', features: ['1 branch', 'AI smart replies', 'Custom QR Code', 'Basic reports', 'Email support'] },
      { name: 'Nova',     nameLocal: 'Advanced',   desc: 'For growing businesses managing multiple branches and teams', features: ['Up to 5 branches', 'Everything in Orbit', 'Team management', 'Advanced analytics', 'Custom templates', 'Priority support'] },
      { name: 'Galaxy',   nameLocal: 'Professional', desc: 'For large enterprises needing comprehensive unlimited solutions', features: ['Unlimited branches', 'Everything in Nova', 'API integrations', 'Custom reports', 'Dedicated account manager', 'Guaranteed SLA'] },
      { name: 'Infinity', nameLocal: 'Enterprise',  desc: 'For large groups and franchises — full enterprise solution with no limits', features: ['Unlimited branches', 'Everything in Galaxy', 'Full API access', 'White-label reports', 'Dedicated support team', '99.9% SLA', 'Team training'] },
    ],
    pricingCtaHighlight: 'Start Free Now',
    pricingCtaDefault: 'Start Free',
    compareTitle: 'Plan Comparison',
    compareFeatureCol: 'Feature',
    compareRows: [
      { label: 'Number of Branches',      vals: ['1', '5', 'Unlimited', 'Unlimited'] },
      { label: 'AI Smart Reply',           vals: ['✓', '✓', '✓', '✓'] },
      { label: 'Custom QR Code',           vals: ['✓', '✓', '✓', '✓'] },
      { label: 'Team Management',          vals: ['—', '✓', '✓', '✓'] },
      { label: 'Advanced Analytics',       vals: ['—', '✓', '✓', '✓'] },
      { label: 'API Integration',          vals: ['—', '—', '✓', '✓'] },
      { label: 'Dedicated Account Manager',vals: ['—', '—', '✓', '✓'] },
      { label: 'White-label',              vals: ['—', '—', '—', '✓'] },
      { label: 'Guaranteed SLA',           vals: ['—', '—', '✓', '99.9%'] },
      { label: 'Support',                  vals: ['Email', 'Priority', 'Dedicated', 'Full Team'] },
    ],
    pricingCustomText: 'Need a custom plan for your organization?',
    pricingContactLink: 'Contact Us',
    faqLabel: 'FAQ',
    faqH2: 'Have Questions? We Have Answers',
    faqs: [
      { q: 'What is SADEEM and how does it help my business?', a: 'SADEEM is a comprehensive platform for managing Google reviews. It helps you respond to reviews with AI, collect new reviews via QR Code, and monitor your reputation performance across all your branches in one dashboard.' },
      { q: 'How does the AI auto-reply work?', a: 'When a new review arrives, the AI reads it and generates a reply that matches your brand tone. You can review and edit it before publishing, or set it to auto-reply instantly.' },
      { q: 'Can I manage more than one branch?', a: 'Absolutely! SADEEM is designed for multi-branch management. You can connect all your locations and view reports and reviews for each branch separately or combined.' },
      { q: 'Is there a free trial?', a: 'Yes! All plans include a free trial with no credit card required. Sign up now and try SADEEM with complete peace of mind.' },
      { q: 'What is the difference between Orbit, Nova, and Galaxy plans?', a: 'Orbit is ideal for small businesses with one branch. Nova is suited for growing businesses with multiple branches and a team. Galaxy is designed for large enterprises with unlimited branches, API integrations, and a dedicated account manager.' },
      { q: 'How does the QR Code system work in detail?', a: 'You create a unique QR code for each branch or employee via SADEEM, then print or display it for customers. When scanned, the customer goes directly to your Google review page with automatic tracking of the review source and serving staff.' },
      { q: 'Is my data and customer information secure?', a: 'Absolutely. We use global encryption standards to protect all data with automatic daily backups. We never sell or share any data with third parties in any form.' },
      { q: 'How do I contact the support team?', a: 'We provide specialized support via email and the support portal inside the dashboard. Galaxy plan customers get a dedicated account manager with a guaranteed response within one business hour.' },
    ],
    contactLabel: 'CONTACT US',
    contactH2: "We'd Love to Hear from You",
    contactDesc: 'Whether you have a question, want a trial, or need more information — our team is here',
    contactFields: { name: 'Full Name *', email: 'Email Address *', phone: 'Phone Number', company: 'Company Name', message: 'Your Message *' },
    contactPlaceholders: { name: 'John Smith', email: 'email@example.com', phone: '+966 5X XXX XXXX', company: 'Your company or restaurant...', message: 'Tell us about your business and what you need...' },
    contactSubmit: 'Send Message',
    contactSending: 'Sending...',
    contactSuccessTitle: 'Message Sent Successfully!',
    contactSuccessDesc: 'Our team will get in touch with you as soon as possible',
    contactSuccessRetry: 'Send Another Message',
    contactError: 'An error occurred while sending. Please try again.',
    footerTagline: 'A comprehensive platform for managing Google reviews and improving digital reputation for Arab businesses',
    footerCols: [
      { heading: 'Product', items: ['Features', 'Plans & Pricing', 'How It Works', "What's New", 'Case Studies'] },
      { heading: 'Support', items: ['Help Center', 'Contact Us', 'Technical Support', 'Documentation', 'Service Status'] },
    ],
    footerLegal: { heading: 'Legal', links: [{ label: 'Privacy Policy', path: '/privacy' }, { label: 'Terms of Use', path: '/terms' }, { label: 'SADEEM Story', path: '/story' }, { label: 'Legal Notice', path: '/terms' }, { label: 'Sitemap', path: '/' }] },
    footerBottomLinks: [{ label: 'Privacy Policy', path: '/privacy' }, { label: 'Terms of Use', path: '/terms' }, { label: 'SADEEM Story', path: '/story' }, { label: 'Legal Notice', path: '/terms' }, { label: 'Home', path: '/' }],
    copyright: '© 2026 SADEEM. All rights reserved.',
    loginBtn: 'Subscriber Login',
    registerBtn: 'Register',
  },
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
function SectionLabel({ color = C.cyan, children }: { color?: string; children: string }) {
  return (
    <div style={{ fontSize: 12, color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {children}
    </div>
  );
}

function CheckItem({ children, color = C.cyan }: { children: string; color?: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{children}</span>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const [faqOpen,    setFaqOpen]      = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const toggleLang = () => setLang(l => l === 'ar' ? 'en' : 'ar');

  // Navbar background on scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setFormError('');
    try {
      const { error } = await supabase.functions.invoke('send-contact', { body: form });
      if (error) throw error;
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err) {
      console.error('[Contact]', err);
      setStatus('error');
      setFormError(T[lang].contactError);
    }
  };

  // ── Input style helper ──
  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = C.cyan);
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = C.border);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════
          MAIN NAVBAR (sticky)
      ══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(15,17,23,0.96)' : 'rgba(15,17,23,0.8)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        transition: 'all 0.25s ease',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo — PNG image */}
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 flex-shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img src="/sadeem-logo.png" alt="SADEEM" style={{ height: 34, width: 'auto', borderRadius: 6 }} />
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {NAV.map((n, ni) => (
              <button
                key={n.id ?? n.href}
                onClick={() => n.href ? navigate(n.href) : scrollTo(n.id!)}
                style={{ color: C.muted, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 400 }}
                onMouseOver={e => (e.currentTarget.style.color = C.text)}
                onMouseOut={e => (e.currentTarget.style.color = C.muted)}
              >{T[lang].nav[ni]}</button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              style={{ color: C.muted, fontSize: 12, padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}
              className="hidden md:block"
              onMouseOver={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = '#374151'; }}
              onMouseOut={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
            >{lang === 'ar' ? 'EN' : 'ع'}</button>
            <button
              onClick={() => navigate('/login')}
              style={{ color: C.muted, fontSize: 13, padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer' }}
              className="hidden sm:block"
              onMouseOver={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = C.text; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >{T[lang].loginBtn}</button>
            <button
              onClick={() => navigate('/register')}
              style={{ background: GRAD, color: 'white', fontSize: 13, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(6,182,212,0.25)', fontWeight: 500 }}
            >{T[lang].registerBtn}</button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              className="lg:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className="lg:hidden">
            <div style={{ padding: '12px 16px 16px' }}>
              {NAV.map((n, ni) => (
                <button
                  key={n.id ?? n.href}
                  onClick={() => n.href ? navigate(n.href) : scrollTo(n.id!)}
                  style={{ display: 'block', width: '100%', textAlign: 'right', padding: '12px 16px', color: C.muted, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10 }}
                  onMouseOver={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text; }}
                  onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = C.muted; }}
                >{T[lang].nav[ni]}</button>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate('/login')} style={{ flex: 1, color: C.muted, fontSize: 14, padding: '11px', border: `1px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer' }}>{T[lang].loginBtn}</button>
                <button onClick={() => navigate('/register')} style={{ flex: 1, background: GRAD, color: 'white', fontSize: 14, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>{T[lang].registerBtn}</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO — 2-column split: text (right) + AI visual (left)
      ══════════════════════════════════════════════════════════ */}
      <section id="hero" style={{ padding: '56px 0 72px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '0%', right: '15%', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── TEXT column (right in RTL) ── */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2" style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 30, padding: '5px 16px', marginBottom: 22 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.cyan }} className="animate-pulse" />
                <span style={{ color: C.cyan, fontSize: 12 }}>{T[lang].heroBadge}</span>
              </div>

              <h1 style={{ fontSize: 'clamp(26px, 3.8vw, 52px)', fontWeight: 600, lineHeight: 1.3, marginBottom: 18, color: C.text, letterSpacing: '-0.01em' }}>
                {T[lang].heroH1a}{' '}
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {T[lang].heroH1b}
                </span>
                {' '}{T[lang].heroH1c}
              </h1>

              <p style={{ fontSize: 'clamp(14px, 1.5vw, 17px)', color: C.muted, marginBottom: 32, lineHeight: 1.8, fontWeight: 400 }}>
                {T[lang].heroDesc}
              </p>

              {/* CTA — single primary action */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/register')}
                  style={{ background: GRAD, color: 'white', fontSize: 15, padding: '13px 32px', borderRadius: 11, border: 'none', cursor: 'pointer', boxShadow: '0 8px 28px rgba(6,182,212,0.28)', fontWeight: 500 }}
                >{T[lang].heroCtaStart}</button>
                <button
                  onClick={() => scrollTo('features')}
                  style={{ background: 'transparent', color: C.muted, fontSize: 14, padding: '13px 20px', borderRadius: 11, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = C.text; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >{lang === 'ar' ? 'اكتشف المميزات' : 'Explore Features'}</button>
              </div>
            </div>

            {/* ── VISUAL column — Google review → AI → reply flow ── */}
            <div style={{ position: 'relative' }}>
              {/* Ambient glow behind card */}
              <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(ellipse at 50% 40%, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.07) 50%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.55)' }}>

                {/* Card header */}
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/sadeem-logo.png" alt="SADEEM" style={{ height: 20, width: 'auto' }} />
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>{lang === 'ar' ? 'مساعد التقييمات' : 'Review Assistant'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} className="animate-pulse" />
                    <span style={{ fontSize: 10, color: C.green }}>{lang === 'ar' ? 'نشط' : 'Live'}</span>
                  </div>
                </div>

                {/* Incoming Google review */}
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{T[lang].sec1ReviewName}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>{T[lang].googleTime}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#F59E0B', lineHeight: 1, marginTop: 2 }}>★★★★☆</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0, padding: '10px 12px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    {lang === 'ar'
                      ? '«الخدمة ممتازة والفريق محترف جداً، لكن وقت الانتظار كان أطول من المعتاد»'
                      : '«Excellent service and very professional team, but the wait time was longer than usual»'}
                  </p>
                </div>

                {/* AI processing */}
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={13} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.cyan, fontWeight: 500, marginBottom: 4 }}>{lang === 'ar' ? 'سديم تحلل المشاعر وتصيغ الرد…' : 'SADEEM analyzing sentiment & drafting reply…'}</div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '72%', background: GRAD, borderRadius: 2 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: C.muted, flexShrink: 0 }}>72%</span>
                </div>

                {/* Generated reply */}
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lang === 'ar' ? 'الرد المقترح' : 'Suggested Reply'}</div>
                  <p style={{ fontSize: 12, color: C.text, lineHeight: 1.7, margin: '0 0 14px', padding: '12px 14px', background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.14)', borderRadius: 10 }}>
                    {T[lang].sec1AiReply}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, background: GRAD, color: 'white', border: 'none', borderRadius: 9, padding: '9px 0', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                      {lang === 'ar' ? '✓ نشر الرد' : '✓ Post Reply'}
                    </button>
                    <button style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 16px', fontSize: 12, cursor: 'pointer' }}>
                      {lang === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BENEFITS STRIP
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '22px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: <Brain size={17} />,     color: C.cyan   },
              { icon: <QrCode size={17} />,    color: C.purple },
              { icon: <BarChart3 size={17} />, color: C.amber  },
              { icon: <Building2 size={17} />, color: C.green  },
              { icon: <Users size={17} />,     color: C.pink   },
              { icon: <Zap size={17} />,       color: C.orange },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <span style={{ color: b.color }}>{b.icon}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{T[lang].benefitLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CORE VALUES (8 cards)
      ══════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 60 }}>
            <SectionLabel>{T[lang].featuresLabel}</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 600, color: C.text, marginBottom: 14, letterSpacing: '-0.01em' }}>
              {T[lang].featuresH2}
            </h2>
            <p style={{ fontSize: 17, color: C.muted, maxWidth: 520, margin: '0 auto', fontWeight: 400, lineHeight: 1.75 }}>
              {T[lang].featuresDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Brain size={22} />,     color: C.cyan   },
              { icon: <Zap size={22} />,       color: C.amber  },
              { icon: <QrCode size={22} />,    color: C.purple },
              { icon: <BarChart3 size={22} />, color: C.green  },
              { icon: <Building2 size={22} />, color: C.pink   },
              { icon: <FileText size={22} />,  color: C.orange },
              { icon: <Users size={22} />,     color: C.cyan   },
              { icon: <Shield size={22} />,    color: C.indigo },
            ].map((c, i) => {
              const card = T[lang].featureCards[i];
              const bgRgb = c.color.startsWith('#06') ? '6,182,212' : c.color.startsWith('#F5') ? '245,158,11' : c.color.startsWith('#8B') ? '139,92,246' : c.color.startsWith('#10') ? '16,185,129' : c.color.startsWith('#EC') ? '236,72,153' : c.color.startsWith('#F9') ? '249,115,22' : c.color.startsWith('#63') ? '99,102,241' : '6,182,212';
              return (
                <div
                  key={i}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, transition: 'all 0.2s ease', cursor: 'default' }}
                  onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = c.color + '50'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 12px 40px rgba(${bgRgb},0.12)`; }}
                  onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = C.border; el.style.transform = ''; el.style.boxShadow = ''; }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: `rgba(${bgRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 16 }}>
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, fontWeight: 400, margin: 0 }}>{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MARKETING SECTIONS (4 alternating)
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '20px 0 100px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>

          {/* ── 1: AI replies ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel color={C.cyan}>{T[lang].sec1Label}</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {T[lang].sec1H2}
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                {T[lang].sec1Desc}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {T[lang].sec1Items.map((t, i) => (
                  <CheckItem key={i} color={C.cyan}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.amber }}>★★★★★</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{T[lang].sec1ReviewName}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{T[lang].sec1ReviewText}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={12} style={{ color: 'white' }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.cyan }}>{T[lang].sec1AiLabel}</span>
                </div>
                <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: '0 0 12px' }}>
                    {T[lang].sec1AiReply}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, background: GRAD, color: 'white', fontSize: 12, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 500 }}>{T[lang].sec1PostReply}</button>
                    <button style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, padding: '8px 14px', borderRadius: 9, cursor: 'pointer' }}>{T[lang].sec1Edit}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2: QR Code ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <SectionLabel color={C.purple}>{T[lang].sec2Label}</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {T[lang].sec2H2}
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                {T[lang].sec2Desc}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {T[lang].sec2Items.map((t, i) => (
                  <CheckItem key={i} color={C.purple}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="lg:order-1">
              {/* QR visual */}
              <div style={{ width: 156, height: 156, background: 'white', borderRadius: 16, padding: 14, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
                {QR_GRID.map((v, i) => (
                  <div key={i} style={{ background: v ? '#1F2937' : 'transparent', borderRadius: 2 }} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, textAlign: 'center' }}>{T[lang].sec2ScanText}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
                {T[lang].sec2Branches.map((b, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 11, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: C.purple }}>{b.count}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{b.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3: Analytics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel color={C.green}>{T[lang].sec3Label}</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {T[lang].sec3H2}
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                {T[lang].sec3Desc}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {T[lang].sec3Items.map((t, i) => (
                  <CheckItem key={i} color={C.green}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{T[lang].sec3ChartTitle}</span>
                <span style={{ fontSize: 13, color: C.green }}>↑ 23%</span>
              </div>
              {T[lang].sec3Branches.map((b, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{b.label}</span>
                    <span style={{ fontSize: 12, color: C.text }}>{b.pct}%</span>
                  </div>
                  <div style={{ height: 7, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', background: `linear-gradient(90deg, ${C.green}, ${C.cyan})`, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                {[
                  { value: '4.7', color: C.amber },
                  { value: '91%', color: C.green },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{T[lang].sec3StatLabels[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 4: Team ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <SectionLabel color={C.pink}>{T[lang].sec4Label}</SectionLabel>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 600, color: C.text, marginBottom: 16, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {T[lang].sec4H2}
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                {T[lang].sec4Desc}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {T[lang].sec4Items.map((t, i) => (
                  <CheckItem key={i} color={C.pink}>{t}</CheckItem>
                ))}
              </ul>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24 }} className="lg:order-1">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {T[lang].sec4Team.map((m, i) => {
                  const colors = [C.cyan, C.purple, C.green, C.amber];
                  const replies = [24, 31, 18, 12];
                  const color = colors[i];
                  return (
                    <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, fontSize: 15, fontWeight: 600, flexShrink: 0 }}>
                        {m.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{m.role}</div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: color }}>{replies[i]}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{T[lang].sec4RepliesLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BEFORE / AFTER
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 600, color: C.text, marginBottom: 8 }}>{T[lang].baH2}</h2>
            <p style={{ fontSize: 16, color: C.muted, fontWeight: 400 }}>{T[lang].baDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} style={{ color: C.red }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.red, margin: 0 }}>{T[lang].baBeforeTitle}</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {T[lang].baBefore.map((t, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <X size={10} style={{ color: C.red }} />
                    </div>
                    <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} style={{ color: C.green }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.green, margin: 0 }}>{T[lang].baAfterTitle}</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {T[lang].baAfter.map((t, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle2 size={10} style={{ color: C.green }} />
                    </div>
                    <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PHILOSOPHY (4 cards)
      ══════════════════════════════════════════════════════════ */}
      <section id="philosophy" style={{ padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <SectionLabel>{T[lang].philLabel}</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 14, letterSpacing: '-0.01em' }}>
              {T[lang].philH2}
            </h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 480, margin: '0 auto', fontWeight: 400, lineHeight: 1.7 }}>
              {T[lang].philDesc}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {T[lang].philCards.map((c, i) => {
              const colors = [C.cyan, C.purple, C.green, C.amber];
              const color = colors[i];
              return (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, textAlign: 'center', transition: 'border-color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = color + '40')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <div style={{ fontSize: 44, marginBottom: 16 }}>{c.emoji}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 10 }}>{c.title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 0 100px' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <SectionLabel>{T[lang].pricingLabel}</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 10, letterSpacing: '-0.01em' }}>
              {T[lang].pricingH2}
            </h2>
            <p style={{ fontSize: 15, color: C.muted, fontWeight: 400 }}>{T[lang].pricingDesc}</p>
          </div>

          {/* Plan cards — 4 plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {T[lang].plans.map((plan, i) => {
              const highlight = i === 1;
              const badge = highlight ? T[lang].pricingMostPopular : null;
              const colors = [C.cyan, C.cyan, C.purple, C.amber];
              const color = colors[i];
              return (
                <div
                  key={i}
                  style={{
                    background: highlight ? C.card2 : C.bg,
                    border: highlight ? `1px solid rgba(6,182,212,0.35)` : `1px solid ${C.border}`,
                    borderRadius: 20, padding: '26px 22px', position: 'relative',
                    boxShadow: highlight ? '0 24px 64px rgba(6,182,212,0.1)' : 'none',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {badge && (
                    <div style={{ position: 'absolute', top: -13, right: 20, background: GRAD, color: 'white', fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 500 }}>
                      {badge}
                    </div>
                  )}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: highlight ? C.cyan : color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>{plan.nameLocal}</div>
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, margin: 0 }}>{plan.desc}</p>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                    {plan.features.map((f, fi) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <CheckCircle2 size={14} style={{ color: highlight ? C.cyan : color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: C.muted }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      width: '100%', padding: '11px 0',
                      background: highlight ? GRAD : 'transparent',
                      color: highlight ? 'white' : C.text,
                      border: highlight ? 'none' : `1px solid ${C.border}`,
                      borderRadius: 11, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                      boxShadow: highlight ? '0 8px 24px rgba(6,182,212,0.22)' : 'none',
                    }}
                    onMouseOver={e => { if (!highlight) e.currentTarget.style.borderColor = '#374151'; }}
                    onMouseOut={e => { if (!highlight) e.currentTarget.style.borderColor = C.border; }}
                  >
                    {highlight ? T[lang].pricingCtaHighlight : T[lang].pricingCtaDefault}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div style={{ marginTop: 56 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, textAlign: 'center', marginBottom: 28 }}>{T[lang].compareTitle}</h3>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: 13, color: C.muted, fontWeight: 500, width: '35%' }}>{T[lang].compareFeatureCol}</th>
                    {['Orbit', 'Nova', 'Galaxy', 'Infinity'].map((p, i) => (
                      <th key={i} style={{ padding: '14px 12px', textAlign: 'center', fontSize: 12, color: i === 1 ? C.cyan : C.muted, fontWeight: i === 1 ? 600 : 500 }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {T[lang].compareRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: ri < T[lang].compareRows.length - 1 ? `1px solid ${C.border}` : 'none', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: C.muted }}>{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} style={{ padding: '12px 12px', textAlign: 'center', fontSize: 13, color: v === '✓' ? C.green : v === '—' ? '#3A4150' : vi === 1 ? C.cyan : C.muted, fontWeight: v === '✓' ? 600 : 400 }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: C.muted }}>
            {T[lang].pricingCustomText}{' '}
            <button onClick={() => scrollTo('contact')} style={{ color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              {T[lang].pricingContactLink}
            </button>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '96px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <SectionLabel>{T[lang].faqLabel}</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>
              {T[lang].faqH2}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {T[lang].faqs.map((item, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', color: C.text, textAlign: 'right', gap: 12 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{item.q}</span>
                  <ChevronDown size={18} style={{ color: C.muted, flexShrink: 0, transform: faqOpen === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: '16px 0 0', fontWeight: 400 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CONTACT FORM
      ══════════════════════════════════════════════════════════ */}
      <section id="contact" style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '80px 0 100px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <SectionLabel>{T[lang].contactLabel}</SectionLabel>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 10, letterSpacing: '-0.01em' }}>
              {T[lang].contactH2}
            </h2>
            <p style={{ fontSize: 15, color: C.muted, fontWeight: 400 }}>{T[lang].contactDesc}</p>
          </div>

          {status === 'success' ? (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 22, padding: 56, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 8 }}>{T[lang].contactSuccessTitle}</h3>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 20 }}>{T[lang].contactSuccessDesc}</p>
              <button onClick={() => setStatus('idle')} style={{ color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                {T[lang].contactSuccessRetry}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 22, padding: 32 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>{T[lang].contactFields.name}</label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={T[lang].contactPlaceholders.name}
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>{T[lang].contactFields.email}</label>
                  <input
                    type="email" required dir="ltr"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder={T[lang].contactPlaceholders.email}
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>{T[lang].contactFields.phone}</label>
                  <input
                    type="tel" dir="ltr"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder={T[lang].contactPlaceholders.phone}
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
                {/* Company */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>{T[lang].contactFields.company}</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder={T[lang].contactPlaceholders.company}
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 6 }}>{T[lang].contactFields.message}</label>
                <textarea
                  required rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={T[lang].contactPlaceholders.message}
                  style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Error */}
              {status === 'error' && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.red }}>
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 12,
                  background: status === 'loading' ? C.card : GRAD,
                  color: 'white', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  boxShadow: status === 'loading' ? 'none' : '0 6px 24px rgba(6,182,212,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {status === 'loading'
                  ? <><Loader2 size={17} className="animate-spin" /> {T[lang].contactSending}</>
                  : <><Send size={16} /> {T[lang].contactSubmit}</>
                }
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A0D14', borderTop: `1px solid ${C.border}`, paddingTop: 64 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10" style={{ marginBottom: 56 }}>

            {/* Col 1: About + social */}
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <img src="/sadeem-logo.png" alt="SADEEM" style={{ height: 30, width: 'auto', borderRadius: 5 }} />
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20, fontWeight: 400 }}>
                {T[lang].footerTagline}
              </p>
              {/* Social icons — 5 key platforms */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { name: 'X',         sym: '𝕏',  hov: '#E7E9EA' },
                  { name: 'Instagram', sym: '◈',  hov: '#E1306C' },
                  { name: 'TikTok',    sym: '▲',  hov: '#FF0050' },
                  { name: 'Snapchat',  sym: '◎',  hov: '#FFFC00' },
                  { name: 'LinkedIn',  sym: 'in', hov: '#0A66C2' },
                ].map((s, i) => (
                  <a
                    key={i}
                    href="#"
                    title={s.name}
                    aria-label={s.name}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A94A6', fontSize: s.sym === 'in' ? 12 : 14, fontWeight: s.sym === 'in' ? 700 : 400, textDecoration: 'none', transition: 'all 0.18s', letterSpacing: s.sym === 'in' ? '-0.02em' : 0 }}
                    onMouseOver={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = s.hov; el.style.borderColor = s.hov + '55'; el.style.background = s.hov + '12'; }}
                    onMouseOut={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#8A94A6'; el.style.borderColor = C.border; el.style.background = 'rgba(255,255,255,0.04)'; }}
                  >{s.sym}</a>
                ))}
              </div>
            </div>

            {/* Col 2 & 3: Product + Support */}
            {T[lang].footerCols.map((col, ci) => (
              <div key={ci}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 18 }}>{col.heading}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.items.map((t, i) => (
                    <li key={i}>
                      <button style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseOver={e => (e.currentTarget.style.color = C.text)}
                        onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                      >{t}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Col 4: Legal */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 18 }}>{T[lang].footerLegal.heading}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {T[lang].footerLegal.links.map((l, i) => (
                  <li key={i}>
                    <button
                      onClick={() => navigate(l.path)}
                      style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseOver={e => (e.currentTarget.style.color = C.text)}
                      onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                    >{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 20px', marginBottom: 12 }}>
              {T[lang].footerBottomLinks.map((l, i) => (
                <button key={i}
                  onClick={() => navigate(l.path)}
                  style={{ color: C.muted, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseOver={e => (e.currentTarget.style.color = C.brand)}
                  onMouseOut={e => (e.currentTarget.style.color = C.muted)}
                >{l.label}</button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: 'center' }}>
              {T[lang].copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
