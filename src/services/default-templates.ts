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
  // ─── Positive (4-5 stars) ───
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
  // ─── Restaurants ───
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
  // ─── Neutral (3 stars) ───
  {
    nameAr: 'رد محايد',
    nameEn: 'Neutral Response',
    bodyAr: 'شكراً لملاحظاتك. نعمل دائماً على تحسين خدماتنا ونأخذ رأيك بعين الاعتبار.',
    bodyEn: 'Thank you for your feedback. We continuously work to improve our services and value your input.',
    category: 'neutral',
    ratingMin: 3,
    ratingMax: 3,
  },
  // ─── Negative (1-2 stars) ───
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
  // ─── Cafes ───
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
  // ─── Healthcare ───
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
  // ─── General ───
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
