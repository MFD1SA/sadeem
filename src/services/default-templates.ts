export interface BuiltInTemplate {
  nameAr: string;
  nameEn: string;
  bodyAr: string;
  bodyEn: string;
  category: 'positive' | 'negative' | 'neutral' | 'general';
  ratingMin: number;
  ratingMax: number;
  industry?: string;
}

export const DEFAULT_TEMPLATES: BuiltInTemplate[] = [
  // ═══════════════════════════════════════════════
  // ─── 5-Star Positive Templates ───
  // ═══════════════════════════════════════════════
  {
    nameAr: 'شكر عام — 5 نجوم',
    nameEn: 'General Thanks — 5 Stars',
    bodyAr: 'شكراً جزيلاً لك على تقييمك الرائع! نسعد بخدمتك دائماً ونتطلع لزيارتك القادمة.',
    bodyEn: 'Thank you so much for your wonderful review! We always enjoy serving you and look forward to your next visit.',
    category: 'positive',
    ratingMin: 5,
    ratingMax: 5,
  },
  {
    nameAr: 'تقدير العميل — 5 نجوم',
    nameEn: 'Customer Appreciation — 5 Stars',
    bodyAr: 'نقدّر كلماتك الطيبة! رضاك هو أولويتنا وسنواصل تقديم أفضل ما لدينا.',
    bodyEn: 'We appreciate your kind words! Your satisfaction is our priority and we will continue delivering our best.',
    category: 'positive',
    ratingMin: 5,
    ratingMax: 5,
  },
  {
    nameAr: 'شكر مع ترحيب — 5 نجوم',
    nameEn: 'Thanks + Welcome Back — 5 Stars',
    bodyAr: 'شكراً لثقتك! يسعدنا أن تجربتك كانت مميزة ونتشرف بزيارتك مجدداً في أي وقت.',
    bodyEn: 'Thank you for your trust! We are glad your experience was exceptional and we would be honored to welcome you back anytime.',
    category: 'positive',
    ratingMin: 5,
    ratingMax: 5,
  },

  // ─── 4-Star Positive Templates ───
  {
    nameAr: 'شكر — 4 نجوم',
    nameEn: 'Thanks — 4 Stars',
    bodyAr: 'شكراً لتقييمك! نسعد برأيك الإيجابي ونعمل دائماً على تحسين تجربتك لتكون مثالية.',
    bodyEn: 'Thank you for your review! We appreciate your positive feedback and always work to make your experience even better.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 4,
  },
  {
    nameAr: 'شكر مع تحسين — 4 نجوم',
    nameEn: 'Thanks + Improvement — 4 Stars',
    bodyAr: 'نشكرك على ملاحظاتك القيّمة! نأخذها بعين الاعتبار ونسعى لنكون عند حسن ظنك دائماً.',
    bodyEn: 'Thank you for your valuable feedback! We take it into consideration and strive to always meet your expectations.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 4,
  },
  {
    nameAr: 'تقدير مع دعوة — 4 نجوم',
    nameEn: 'Appreciation + Invite — 4 Stars',
    bodyAr: 'نقدّر تقييمك ونأمل أن نقدم لك تجربة أفضل في زيارتك القادمة. نرحب بك دائماً.',
    bodyEn: 'We value your review and hope to provide an even better experience on your next visit. You are always welcome.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 4,
  },

  // ─── 4-5 Star General Positive ───
  {
    nameAr: 'شكر عام',
    nameEn: 'General Thanks',
    bodyAr: 'شكراً لك على تقييمك الرائع! نسعد بخدمتك دائماً ونتطلع لزيارتك القادمة.',
    bodyEn: 'Thank you for your wonderful review! We always enjoy serving you and look forward to your next visit.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 5,
  },
  {
    nameAr: 'شكر مع دعوة',
    nameEn: 'Thanks + Invite',
    bodyAr: 'نشكرك على ثقتك بنا! رأيك يعني لنا الكثير. نتشرف بزيارتك مجدداً.',
    bodyEn: 'Thank you for trusting us! Your opinion means a lot. We are honored to serve you again.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 5,
  },

  // ═══════════════════════════════════════════════
  // ─── 3-Star Neutral Templates ───
  // ═══════════════════════════════════════════════
  {
    nameAr: 'رد محايد — تحسين',
    nameEn: 'Neutral — Improvement',
    bodyAr: 'شكراً لملاحظاتك. نعمل دائماً على تحسين خدماتنا ونأخذ رأيك بعين الاعتبار.',
    bodyEn: 'Thank you for your feedback. We continuously work to improve our services and value your input.',
    category: 'neutral',
    ratingMin: 3,
    ratingMax: 3,
  },
  {
    nameAr: 'رد محايد — استماع',
    nameEn: 'Neutral — Listening',
    bodyAr: 'نقدّر مشاركتك لرأيك. ملاحظاتك تساعدنا على التطوير ونتطلع لتقديم تجربة أفضل لك.',
    bodyEn: 'We appreciate you sharing your thoughts. Your feedback helps us grow and we look forward to providing a better experience.',
    category: 'neutral',
    ratingMin: 3,
    ratingMax: 3,
  },
  {
    nameAr: 'رد محايد — وعد بالتحسين',
    nameEn: 'Neutral — Promise to Improve',
    bodyAr: 'شكراً لتقييمك. نأخذ ملاحظاتك على محمل الجد ونعمل على معالجتها لتحسين تجربتك القادمة.',
    bodyEn: 'Thank you for your review. We take your feedback seriously and are working to address it for your next experience.',
    category: 'neutral',
    ratingMin: 3,
    ratingMax: 3,
  },

  // ═══════════════════════════════════════════════
  // ─── 2-Star Negative Templates ───
  // ═══════════════════════════════════════════════
  {
    nameAr: 'اعتذار — 2 نجوم',
    nameEn: 'Apology — 2 Stars',
    bodyAr: 'نأسف أن تجربتك لم تكن بالمستوى المطلوب. نأخذ ملاحظاتك بجدية وسنعمل على التحسين الفوري.',
    bodyEn: 'We are sorry your experience did not meet expectations. We take your feedback seriously and will work on immediate improvements.',
    category: 'negative',
    ratingMin: 2,
    ratingMax: 2,
  },
  {
    nameAr: 'اعتذار مع تواصل — 2 نجوم',
    nameEn: 'Apology + Contact — 2 Stars',
    bodyAr: 'نعتذر عن التجربة. نرجو التواصل معنا مباشرة حتى نتمكن من حل المشكلة وتعويضك.',
    bodyEn: 'We apologize for the experience. Please contact us directly so we can resolve the issue and make it right.',
    category: 'negative',
    ratingMin: 2,
    ratingMax: 2,
  },

  // ─── 1-Star Negative Templates ───
  {
    nameAr: 'اعتذار عميق — 1 نجمة',
    nameEn: 'Deep Apology — 1 Star',
    bodyAr: 'نأسف بشدة لتجربتك السيئة. هذا لا يمثل مستوى خدمتنا. نرجو التواصل معنا لحل المشكلة مباشرة.',
    bodyEn: 'We deeply apologize for your poor experience. This does not represent our service standards. Please contact us to resolve this directly.',
    category: 'negative',
    ratingMin: 1,
    ratingMax: 1,
  },
  {
    nameAr: 'اعتذار مع مسؤولية — 1 نجمة',
    nameEn: 'Apology + Accountability — 1 Star',
    bodyAr: 'نتحمل المسؤولية الكاملة عن تجربتك ونعتذر بصدق. نرغب في فرصة لتصحيح الأمور — يرجى التواصل معنا.',
    bodyEn: 'We take full responsibility for your experience and sincerely apologize. We would like the chance to make things right — please reach out to us.',
    category: 'negative',
    ratingMin: 1,
    ratingMax: 1,
  },

  // ─── 1-2 Star General Negative ───
  {
    nameAr: 'اعتذار',
    nameEn: 'Apology',
    bodyAr: 'نأسف لتجربتك. نأخذ ملاحظاتك على محمل الجد وسنعمل على تحسين الأمور. يسعدنا التواصل معك مباشرة.',
    bodyEn: 'We apologize for your experience. We take your feedback seriously and will work to improve. We would be happy to connect directly.',
    category: 'negative',
    ratingMin: 1,
    ratingMax: 2,
  },
  {
    nameAr: 'اعتذار مع متابعة',
    nameEn: 'Apology + Follow-up',
    bodyAr: 'نعتذر عن عدم رضاك. تجربة عملائنا أولوية قصوى. نرجو التواصل معنا لحل المشكلة مباشرة.',
    bodyEn: 'We apologize for your dissatisfaction. Customer experience is our top priority. Please contact us so we can resolve this directly.',
    category: 'negative',
    ratingMin: 1,
    ratingMax: 2,
  },

  // ═══════════════════════════════════════════════
  // ─── Industry-Specific Templates ───
  // ═══════════════════════════════════════════════

  // ── Restaurants ──
  {
    nameAr: 'شكر — مطعم',
    nameEn: 'Thanks — Restaurant',
    bodyAr: 'شكراً لتقييمك! نسعد أن الطعام والخدمة نالا إعجابك. ننتظرك على مائدتنا قريباً.',
    bodyEn: 'Thank you for your review! Glad you enjoyed the food and service. See you at our table soon.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 5,
    industry: 'مطاعم',
  },
  {
    nameAr: 'اعتذار — مطعم',
    nameEn: 'Apology — Restaurant',
    bodyAr: 'نأسف أن تجربة الطعام لم تكن بالمستوى المتوقع. نعمل على تحسين جودة أطباقنا ونتمنى إعطاءنا فرصة أخرى.',
    bodyEn: 'We are sorry the dining experience did not meet your expectations. We are improving our dishes and hope for another chance.',
    category: 'negative',
    ratingMin: 1,
    ratingMax: 2,
    industry: 'مطاعم',
  },

  // ── Cafes ──
  {
    nameAr: 'شكر — مقهى',
    nameEn: 'Thanks — Cafe',
    bodyAr: 'شكراً لزيارتك! نسعد أن القهوة والأجواء أعجبتك. ننتظرك دائماً.',
    bodyEn: 'Thanks for visiting! Glad you enjoyed the coffee and atmosphere. Always welcome.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 5,
    industry: 'مقاهي',
  },

  // ── Healthcare ──
  {
    nameAr: 'شكر — صحي',
    nameEn: 'Thanks — Healthcare',
    bodyAr: 'شكراً لثقتك بنا. صحتك أولويتنا ونسعى لتقديم أفضل رعاية طبية.',
    bodyEn: 'Thank you for trusting us. Your health is our priority and we strive to provide the best care.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 5,
    industry: 'صحي',
  },

  // ── Retail / Shopping ──
  {
    nameAr: 'شكر — تجزئة',
    nameEn: 'Thanks — Retail',
    bodyAr: 'شكراً لتسوقك معنا! نسعد أن المنتجات والخدمة نالت رضاك. ننتظرك دائماً.',
    bodyEn: 'Thank you for shopping with us! Glad you were satisfied with our products and service. Always welcome.',
    category: 'positive',
    ratingMin: 4,
    ratingMax: 5,
    industry: 'تجزئة',
  },

  // ═══════════════════════════════════════════════
  // ─── General All-Rating Template ───
  // ═══════════════════════════════════════════════
  {
    nameAr: 'رد عام',
    nameEn: 'General Reply',
    bodyAr: 'شكراً لتقييمك. نقدّر وقتك ونتطلع لخدمتك بشكل أفضل.',
    bodyEn: 'Thank you for your review. We appreciate your time and look forward to serving you better.',
    category: 'general',
    ratingMin: 1,
    ratingMax: 5,
  },
];

/**
 * Get templates filtered by rating and optionally industry.
 */
export function getMatchingTemplates(rating: number, industry?: string, lang: 'ar' | 'en' = 'ar'): { name: string; body: string }[] {
  return DEFAULT_TEMPLATES
    .filter(t => rating >= t.ratingMin && rating <= t.ratingMax)
    .filter(t => !t.industry || t.industry === industry)
    .map(t => ({
      name: lang === 'ar' ? t.nameAr : t.nameEn,
      body: lang === 'ar' ? t.bodyAr : t.bodyEn,
    }));
}
