import { supabase } from '@/lib/supabase';

export interface CompetitorData {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  placeId: string;
}

export interface CompetitorReport {
  competitors: CompetitorData[];
  myRating: number;
  myReviewCount: number;
  insights: CompetitorInsight[];
}

export interface CompetitorInsight {
  type: 'strength' | 'weakness' | 'opportunity';
  textAr: string;
  textEn: string;
}

export const competitorService = {
  /**
   * Fetch nearby competitors using Google Places API.
   * Requires a Google Maps API key (uses Places Nearby Search).
   */
  async fetchCompetitors(params: {
    industry: string;
    city: string;
    latitude?: number;
    longitude?: number;
    accessToken?: string;
  }): Promise<CompetitorData[]> {
    // For MVP: return structured placeholder that the UI can display.
    // In production, this would call Google Places API:
    // GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
    //   ?location={lat},{lng}&radius=5000&type={industry}&key={API_KEY}
    
    // Store search intent for future backend implementation
    console.info('[Senda] Competitor search:', params.industry, params.city);
    return [];
  },

  /**
   * Generate competitor comparison report.
   */
  generateReport(myRating: number, myReviewCount: number, competitors: CompetitorData[]): CompetitorReport {
    const insights: CompetitorInsight[] = [];

    if (competitors.length === 0) {
      return { competitors, myRating, myReviewCount, insights };
    }

    const avgCompRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    const avgCompReviews = competitors.reduce((sum, c) => sum + c.reviewCount, 0) / competitors.length;

    // Rating comparison
    if (myRating > avgCompRating) {
      insights.push({
        type: 'strength',
        textAr: `تقييمك (${myRating.toFixed(1)}) أعلى من متوسط المنافسين (${avgCompRating.toFixed(1)})`,
        textEn: `Your rating (${myRating.toFixed(1)}) is above competitor average (${avgCompRating.toFixed(1)})`,
      });
    } else if (myRating < avgCompRating) {
      insights.push({
        type: 'weakness',
        textAr: `تقييمك (${myRating.toFixed(1)}) أقل من متوسط المنافسين (${avgCompRating.toFixed(1)})`,
        textEn: `Your rating (${myRating.toFixed(1)}) is below competitor average (${avgCompRating.toFixed(1)})`,
      });
    }

    // Review count comparison
    if (myReviewCount < avgCompReviews * 0.5) {
      insights.push({
        type: 'opportunity',
        textAr: 'عدد تقييماتك أقل بكثير من المنافسين — استخدم نظام QR لزيادة التقييمات',
        textEn: 'Your review count is significantly lower — use QR system to increase reviews',
      });
    }

    // Top competitor
    const topComp = competitors.length > 0
      ? competitors.reduce((best, c) => c.rating > best.rating ? c : best, competitors[0])
      : null;
    if (topComp && topComp.rating > myRating) {
      insights.push({
        type: 'weakness',
        textAr: `المنافس الأقوى "${topComp.name}" بتقييم ${topComp.rating} و ${topComp.reviewCount} تقييم`,
        textEn: `Strongest competitor "${topComp.name}" with ${topComp.rating} rating and ${topComp.reviewCount} reviews`,
      });
    }

    return { competitors, myRating, myReviewCount, insights };
  },

  /**
   * Analyze keywords from competitor reviews (future: NLP).
   */
  extractKeywords(reviews: string[]): { word: string; count: number }[] {
    const stopWords = new Set(['و', 'في', 'من', 'على', 'إلى', 'أن', 'هذا', 'the', 'a', 'is', 'and', 'to', 'of']);
    const wordCount: Record<string, number> = {};
    
    for (const text of reviews) {
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
      for (const w of words) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }

    return Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  },
};
