export interface SeoScore {
  total: number;
  breakdown: SeoItem[];
  suggestions: SeoSuggestion[];
}

export interface SeoItem {
  category: string;
  score: number;
  maxScore: number;
  labelAr: string;
  labelEn: string;
}

export interface SeoSuggestion {
  priority: 'high' | 'medium' | 'low';
  textAr: string;
  textEn: string;
  actionType: string;
}

interface SeoInput {
  businessName: string;
  description: string;
  industry: string;
  city: string;
  photoCount: number;
  reviewCount: number;
  avgRating: number;
  responseRate: number;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasHours: boolean;
  hasAddress: boolean;
}

export const seoService = {
  /**
   * Calculate Google Maps SEO score (0-100).
   */
  calculateScore(input: SeoInput): SeoScore {
    const breakdown: SeoItem[] = [];
    const suggestions: SeoSuggestion[] = [];

    // 1. Business info completeness (20 points)
    let infoScore = 0;
    if (input.businessName) infoScore += 4;
    if (input.description && input.description.length > 50) infoScore += 4;
    if (input.hasWebsite) infoScore += 4;
    if (input.hasPhone) infoScore += 4;
    if (input.hasHours) infoScore += 2;
    if (input.hasAddress) infoScore += 2;
    breakdown.push({ category: 'info', score: infoScore, maxScore: 20, labelAr: 'اكتمال المعلومات', labelEn: 'Business Info' });

    if (!input.description || input.description.length < 50) {
      suggestions.push({ priority: 'high', textAr: 'أضف وصفاً تفصيلياً لنشاطك (أكثر من 50 حرف)', textEn: 'Add a detailed business description (50+ chars)', actionType: 'add_description' });
    }
    if (!input.hasWebsite) {
      suggestions.push({ priority: 'medium', textAr: 'أضف رابط موقعك الإلكتروني', textEn: 'Add your website URL', actionType: 'add_website' });
    }

    // 2. Photos (15 points)
    const photoScore = Math.min(15, Math.floor(input.photoCount / 2));
    breakdown.push({ category: 'photos', score: photoScore, maxScore: 15, labelAr: 'الصور', labelEn: 'Photos' });
    if (input.photoCount < 10) {
      suggestions.push({ priority: 'high', textAr: `أضف المزيد من الصور (لديك ${input.photoCount}، المطلوب 10+)`, textEn: `Add more photos (you have ${input.photoCount}, need 10+)`, actionType: 'add_photos' });
    }

    // 3. Reviews quantity (20 points)
    const reviewScore = Math.min(20, Math.floor(input.reviewCount / 5));
    breakdown.push({ category: 'reviews', score: reviewScore, maxScore: 20, labelAr: 'عدد التقييمات', labelEn: 'Review Count' });
    if (input.reviewCount < 50) {
      suggestions.push({ priority: 'high', textAr: 'زِد عدد التقييمات باستخدام نظام QR', textEn: 'Increase reviews using QR system', actionType: 'increase_reviews' });
    }

    // 4. Average rating (20 points)
    const ratingScore = Math.min(20, Math.round(input.avgRating * 4));
    breakdown.push({ category: 'rating', score: ratingScore, maxScore: 20, labelAr: 'متوسط التقييم', labelEn: 'Average Rating' });
    if (input.avgRating < 4.0) {
      suggestions.push({ priority: 'high', textAr: 'حسّن تقييمك بالرد السريع على التقييمات السلبية', textEn: 'Improve rating by responding quickly to negative reviews', actionType: 'improve_rating' });
    }

    // 5. Response rate (15 points)
    const responseScore = Math.min(15, Math.round(input.responseRate * 0.15));
    breakdown.push({ category: 'responses', score: responseScore, maxScore: 15, labelAr: 'نسبة الرد', labelEn: 'Response Rate' });
    if (input.responseRate < 80) {
      suggestions.push({ priority: 'medium', textAr: 'رد على جميع التقييمات — نسبة الرد الحالية أقل من 80%', textEn: 'Reply to all reviews — current response rate below 80%', actionType: 'reply_reviews' });
    }

    // 6. Keywords in description (10 points)
    let keywordScore = 0;
    const desc = (input.description || '').toLowerCase();
    const industryKeywords = [input.industry.toLowerCase(), input.city.toLowerCase()];
    for (const kw of industryKeywords) {
      if (kw && desc.includes(kw)) keywordScore += 5;
    }
    breakdown.push({ category: 'keywords', score: keywordScore, maxScore: 10, labelAr: 'الكلمات المفتاحية', labelEn: 'Keywords' });
    if (keywordScore < 10) {
      suggestions.push({ priority: 'medium', textAr: `أضف "${input.industry}" و "${input.city}" في وصف نشاطك`, textEn: `Include "${input.industry}" and "${input.city}" in your description`, actionType: 'add_keywords' });
    }

    const total = breakdown.reduce((sum, item) => sum + item.score, 0);

    return { total, breakdown, suggestions };
  },

  /**
   * Generate optimized business description.
   */
  generateDescription(params: { businessName: string; industry: string; city: string; lang: 'ar' | 'en' }): string {
    if (params.lang === 'ar') {
      return `${params.businessName} — أفضل ${params.industry} في ${params.city}. نقدم خدمات احترافية بجودة عالية ونسعى لتحقيق أفضل تجربة لعملائنا. زورونا واستمتعوا بخدماتنا المتميزة.`;
    }
    return `${params.businessName} — Premier ${params.industry} in ${params.city}. We deliver professional quality services and strive for the best customer experience. Visit us and enjoy our outstanding services.`;
  },
};
