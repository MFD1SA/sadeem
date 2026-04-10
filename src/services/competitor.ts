import { supabase } from '@/lib/supabase';

export interface CompetitorData {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  placeId: string;
  distance?: number;   // meters from search center
  score?: number;       // internal relevance + quality score (0–1)
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
   * Fetch nearby competitors via the fetch-competitors Edge Function.
   * The Edge Function proxies Google Places API (keeps API key server-side).
   * Returns empty array gracefully if GOOGLE_MAPS_API_KEY is not configured.
   */
  async fetchCompetitors(params: {
    industry: string;
    city: string;
    latitude?: number;
    longitude?: number;
    businessName?: string;
    accessToken?: string;
  }): Promise<CompetitorData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-competitors', {
        body: {
          industry: params.industry,
          city: params.city,
          latitude: params.latitude,
          longitude: params.longitude,
          businessName: params.businessName,
        },
      });

      if (error) {
        console.warn('[Senda] Competitor fetch failed:', error.message);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[Senda] Competitor fetch error:', err);
      return [];
    }
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
    if (myRating > avgCompRating + 0.2) {
      insights.push({
        type: 'strength',
        textAr: `تقييمك (${myRating.toFixed(1)}) أعلى من متوسط المنافسين (${avgCompRating.toFixed(1)})`,
        textEn: `Your rating (${myRating.toFixed(1)}) is above competitor average (${avgCompRating.toFixed(1)})`,
      });
    } else if (myRating < avgCompRating - 0.2) {
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
    } else if (myReviewCount > avgCompReviews * 1.5) {
      insights.push({
        type: 'strength',
        textAr: `عدد تقييماتك (${myReviewCount}) أعلى بكثير من متوسط المنافسين (${Math.round(avgCompReviews)})`,
        textEn: `Your review count (${myReviewCount}) is significantly above competitor average (${Math.round(avgCompReviews)})`,
      });
    }

    // Top competitor (by score if available, else rating)
    const topComp = competitors.reduce((best, c) => {
      const cScore = c.score ?? c.rating;
      const bScore = best.score ?? best.rating;
      return cScore > bScore ? c : best;
    }, competitors[0]);

    if (topComp && topComp.rating > myRating) {
      const distText = topComp.distance
        ? ` (${topComp.distance < 1000 ? `${topComp.distance}م` : `${(topComp.distance / 1000).toFixed(1)}كم`})`
        : '';
      const distTextEn = topComp.distance
        ? ` (${topComp.distance < 1000 ? `${topComp.distance}m` : `${(topComp.distance / 1000).toFixed(1)}km`} away)`
        : '';
      insights.push({
        type: 'weakness',
        textAr: `المنافس الأقوى "${topComp.name}"${distText} بتقييم ${topComp.rating} و ${topComp.reviewCount} تقييم`,
        textEn: `Strongest competitor "${topComp.name}"${distTextEn} with ${topComp.rating} rating and ${topComp.reviewCount} reviews`,
      });
    }

    // Nearest strong competitor insight
    const nearestStrong = competitors
      .filter(c => c.distance && c.distance > 0 && c.rating >= 4.0)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))[0];
    if (nearestStrong && nearestStrong.distance && nearestStrong.distance < 1000) {
      insights.push({
        type: 'weakness',
        textAr: `منافس قوي "${nearestStrong.name}" على بعد ${nearestStrong.distance}م فقط بتقييم ${nearestStrong.rating}`,
        textEn: `Strong competitor "${nearestStrong.name}" only ${nearestStrong.distance}m away with ${nearestStrong.rating} rating`,
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
