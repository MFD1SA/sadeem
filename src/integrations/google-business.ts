import { supabase } from '@/lib/supabase';

const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GBP_REVIEWS_BASE = 'https://mybusiness.googleapis.com/v4';

export interface GoogleLocation {
  name: string;
  title: string;
  accountName?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  metadata?: { placeId?: string };
}

export interface GoogleReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

interface BranchRow { id: string; google_location_id: string | null; }
interface ReviewLookup { id: string; google_review_id: string | null; }

async function getGoogleAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('No authenticated session');
  const providerToken = session.provider_token;
  if (!providerToken) throw new Error('No Google access token available. Please reconnect Google Business.');
  return providerToken;
}

function starRatingToNumber(star: string): number {
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[star] || 3;
}

export type GbpErrorType = 'quota' | 'api_disabled' | 'auth_cancelled' | 'no_locations' | 'token_expired' | 'unknown';

export function classifyGbpError(err: unknown, lang: 'ar' | 'en' = 'ar'): { type: GbpErrorType; message: string } {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (msg.includes('quota') || msg.includes('rate limit')) {
    return {
      type: 'quota',
      message: lang === 'ar'
        ? 'تم تجاوز حد طلبات Google مؤقتاً، يرجى المحاولة لاحقاً'
        : 'Google API quota temporarily exceeded, please try again later',
    };
  }
  if (msg.includes('not enabled') || msg.includes('has not been used') || msg.includes('api_not_enabled') || msg.includes('403')) {
    return {
      type: 'api_disabled',
      message: lang === 'ar'
        ? 'Google Business Profile API غير مفعلة في مشروع Google Cloud'
        : 'Google Business Profile API is not enabled in your Google Cloud project',
    };
  }
  if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('popup_closed') || msg.includes('access_denied')) {
    return {
      type: 'auth_cancelled',
      message: lang === 'ar' ? 'تم إلغاء عملية الربط' : 'Connection was cancelled',
    };
  }
  if (msg.includes('no google access token') || msg.includes('invalid_grant') || msg.includes('token') && msg.includes('expir')) {
    return {
      type: 'token_expired',
      message: lang === 'ar'
        ? 'انتهت صلاحية رمز الوصول. أعد ربط حساب Google Business.'
        : 'Access token expired. Please reconnect Google Business.',
    };
  }
  return {
    type: 'unknown',
    message: (err instanceof Error ? err.message : String(err)),
  };
}

export const googleBusinessService = {
  /**
   * Initiate Google OAuth specifically for Google Business Profile.
   * This allows connecting a DIFFERENT Google account than the login account.
   */
  async connectGoogleBusiness(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/business.manage',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  },

  isConfigured(): boolean {
    return !!import.meta.env.VITE_SUPABASE_URL;
  },

  async hasAccessToken(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.provider_token;
    } catch { return false; }
  },

  async listAccounts(accessToken: string): Promise<{ name: string; accountName: string }[]> {
    const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message || `Failed to fetch accounts: ${res.status}`);
    }
    const data = await res.json();
    return (data.accounts || []).map((a: { name: string; accountName: string }) => ({ name: a.name, accountName: a.accountName }));
  },

  async listLocations(accessToken: string, accountName: string): Promise<GoogleLocation[]> {
    const res = await fetch(`${GBP_API_BASE}/${accountName}/locations?readMask=name,title,storefrontAddress,metadata`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message || `Failed to fetch locations: ${res.status}`);
    }
    const data = await res.json();
    return (data.locations || []).map((loc: GoogleLocation) => ({ ...loc, accountName }));
  },

  async listReviews(accessToken: string, locationName: string, pageSize = 50, pageToken?: string): Promise<{
    reviews: GoogleReview[]; nextPageToken?: string; totalReviewCount: number;
  }> {
    let url = `${GBP_REVIEWS_BASE}/${locationName}/reviews?pageSize=${pageSize}`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message || `Failed to fetch reviews: ${res.status}`);
    }
    const data = await res.json();
    return { reviews: data.reviews || [], nextPageToken: data.nextPageToken, totalReviewCount: data.totalReviewCount || 0 };
  },

  async postReply(accessToken: string, reviewName: string, replyText: string): Promise<void> {
    const res = await fetch(`${GBP_REVIEWS_BASE}/${reviewName}/reply`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: replyText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message || `Failed to post reply: ${res.status}`);
    }
  },

  async deleteReply(accessToken: string, reviewName: string): Promise<void> {
    const res = await fetch(`${GBP_REVIEWS_BASE}/${reviewName}/reply`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message || `Failed to delete reply: ${res.status}`);
    }
  },

  async syncAllReviews(organizationId: string): Promise<{ synced: number; total: number }> {
    const accessToken = await getGoogleAccessToken();

    const { data: branchesData, error: brErr } = await supabase
      .from('branches')
      .select('id, google_location_id')
      .eq('organization_id', organizationId)
      .not('google_location_id', 'is', null);

    if (brErr) throw brErr;
    const branches = (branchesData || []) as BranchRow[];
    if (branches.length === 0) return { synced: 0, total: 0 };

    let totalSynced = 0;
    let totalFetched = 0;

    for (const branch of branches) {
      if (!branch.google_location_id) continue;

      try {
        let pageToken: string | undefined;
        do {
          const result = await this.listReviews(accessToken, branch.google_location_id, 50, pageToken);
          totalFetched += result.reviews.length;

          for (const gReview of result.reviews) {
            const googleReviewId = gReview.reviewId || gReview.name;
            const reviewerGoogleId = gReview.reviewer?.displayName || null;

            const { data: existing } = await supabase
              .from('reviews').select('id').eq('google_review_id', googleReviewId).single();
            if (existing) continue;

            let isFollowup = false;
            let status: 'new' | 'manual_review_required' = 'new';

            if (reviewerGoogleId) {
              const { data: prev } = await supabase
                .from('reviews').select('id').eq('branch_id', branch.id)
                .eq('reviewer_google_id', reviewerGoogleId).in('status', ['replied', 'auto_replied']).limit(1);
              if (prev && prev.length > 0) { isFollowup = true; status = 'manual_review_required'; }
            }

            const text = (gReview.comment || '').toLowerCase();
            if (['spam', 'fake', 'مزيف', 'كذب'].some(w => text.includes(w)) && !isFollowup) {
              status = 'manual_review_required';
            }

            const { error: insErr } = await supabase.from('reviews').insert({
              branch_id: branch.id,
              organization_id: organizationId,
              reviewer_name: gReview.reviewer?.displayName || 'مجهول',
              rating: starRatingToNumber(gReview.starRating),
              review_text: gReview.comment || null,
              source: 'google',
              status,
              google_review_id: googleReviewId,
              is_followup: isFollowup,
              reviewer_google_id: reviewerGoogleId,
              published_at: gReview.createTime,
            });

            if (!insErr) totalSynced++;
          }

          pageToken = result.nextPageToken;
        } while (pageToken);
      } catch (err) {
        console.error(`Failed to sync reviews for branch ${branch.id}:`, err);
      }
    }

    return { synced: totalSynced, total: totalFetched };
  },

  async sendReplyToGoogle(reviewId: string, replyText: string): Promise<void> {
    const accessToken = await getGoogleAccessToken();

    const { data: reviewData, error } = await supabase
      .from('reviews').select('google_review_id').eq('id', reviewId).single();

    const review = reviewData as ReviewLookup | null;
    if (error || !review?.google_review_id) {
      throw new Error('Review not found or missing Google reference');
    }

    await this.postReply(accessToken, review.google_review_id, replyText);
  },
};
