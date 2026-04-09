// ============================================================================
// SENDA — Google Business Profile Service (v2)
//
// All Google API calls go through google-business-proxy Edge Function.
// Tokens are stored in google_tokens table (server-side only).
// Frontend never touches Google tokens directly.
// ============================================================================

import { supabase } from '@/lib/supabase';

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

interface BranchRow {
  id: string;
  google_location_id: string | null;
}

interface ReviewLookup {
  id: string;
  google_review_id: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function starRatingToNumber(star: string): number {
  const map: Record<string, number> = {
    ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
  };
  return map[star] || 3;
}

// ── Error classification ────────────────────────────────────────────────────

export type GbpErrorType =
  | 'quota'
  | 'api_disabled'
  | 'auth_cancelled'
  | 'no_locations'
  | 'token_expired'
  | 'not_connected'
  | 'unknown';

export function classifyGbpError(
  err: unknown,
  lang: 'ar' | 'en' = 'ar',
): { type: GbpErrorType; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();

  if (msg.includes('quota') || msg.includes('rate limit') ||
      msg.includes('too many requests') || msg.includes('429') ||
      msg.includes('resource exhausted')) {
    return {
      type: 'quota',
      message: lang === 'ar'
        ? 'طلبات Google Business كثيرة مؤقتاً. انتظر دقيقة ثم حاول مرة أخرى.'
        : 'Google Business requests are temporarily rate-limited. Please wait a minute and try again.',
    };
  }

  if (msg.includes('not enabled') || msg.includes('has not been used') ||
      msg.includes('api_not_enabled') || msg.includes('403')) {
    return {
      type: 'api_disabled',
      message: lang === 'ar'
        ? 'Google Business Profile API غير مفعلة في مشروع Google Cloud. فعّل:\n• My Business Account Management API\n• My Business Business Information API'
        : 'Google Business Profile API is not enabled in your Google Cloud project.',
    };
  }

  if (msg.includes('cancelled') || msg.includes('canceled') ||
      msg.includes('popup_closed') || msg.includes('access_denied')) {
    return {
      type: 'auth_cancelled',
      message: lang === 'ar' ? 'تم إلغاء عملية الربط' : 'Connection was cancelled',
    };
  }

  if (msg.includes('no_token') || msg.includes('لم يتم ربط')) {
    return {
      type: 'not_connected',
      message: lang === 'ar'
        ? 'لم يتم ربط حساب Google Business بعد. اضغط "ربط Google Business" أولاً.'
        : 'Google Business is not connected. Click "Connect Google Business" first.',
    };
  }

  if (msg.includes('refresh_failed') || msg.includes('no_refresh_token') ||
      msg.includes('أعد ربط') || msg.includes('invalid_grant') ||
      msg.includes('token') && msg.includes('expir')) {
    return {
      type: 'token_expired',
      message: lang === 'ar'
        ? 'انتهت صلاحية الربط. أعد ربط حساب Google Business.'
        : 'Connection expired. Please reconnect Google Business.',
    };
  }

  if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return {
      type: 'unknown',
      message: lang === 'ar'
        ? 'تعذر الاتصال. تأكد من اتصال الإنترنت وأعد المحاولة.'
        : 'Connection failed. Check your internet and try again.',
    };
  }

  return { type: 'unknown', message: raw };
}

// ── Proxy helper ────────────────────────────────────────────────────────────
// Calls google-business-proxy Edge Function. Tokens are handled server-side.

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('quota') || lower.includes('rate limit') ||
         lower.includes('429') || lower.includes('too many requests');
}

async function callProxy<T>(
  organizationId: string,
  body: Record<string, unknown>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('google-business-proxy', {
        body: { ...body, organizationId },
      });

      if (error) {
        const message = error.message || String(error);
        if (isRateLimitError(message) && attempt < retries) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        throw new Error(message);
      }

      if (data?.error) {
        const message = data.error as string;
        if (isRateLimitError(message) && attempt < retries) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        throw new Error(message);
      }

      return data as T;
    } catch (err: unknown) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < retries && isRateLimitError(message)) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// ── Public service ──────────────────────────────────────────────────────────

export const googleBusinessService = {
  /**
   * Initiate Google OAuth for Business Profile linking.
   * Redirects to Google with business.manage scope.
   * After consent, callback saves tokens to google_tokens table.
   */
  async connectGoogleBusiness(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?from=integrations`,
        scopes: 'https://www.googleapis.com/auth/business.manage',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  },

  /**
   * Check if Google Business is connected for this organization (from DB).
   */
  async getConnectionStatus(organizationId: string): Promise<{
    connected: boolean;
    googleEmail?: string;
    updatedAt?: string;
  }> {
    const { data, error } = await supabase.rpc('get_google_connection_status', {
      p_organization_id: organizationId,
    });

    if (error || !data || data.length === 0) {
      return { connected: false };
    }

    return {
      connected: true,
      googleEmail: data[0].google_email,
      updatedAt: data[0].updated_at,
    };
  },

  /**
   * Disconnect Google Business (delete tokens from DB).
   */
  async disconnect(organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('google_tokens')
      .delete()
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  isConfigured(): boolean {
    return !!import.meta.env.VITE_SUPABASE_URL;
  },

  async listAccounts(organizationId: string): Promise<{ name: string; accountName: string }[]> {
    const data = await callProxy<{ accounts?: { name: string; accountName: string }[] }>(
      organizationId,
      { action: 'listAccounts' },
    );
    return (data.accounts || []).map((a) => ({ name: a.name, accountName: a.accountName }));
  },

  async listLocations(organizationId: string, accountName: string): Promise<GoogleLocation[]> {
    const data = await callProxy<{ locations?: GoogleLocation[] }>(
      organizationId,
      { action: 'listLocations', accountName },
    );
    return (data.locations || []).map((loc) => ({ ...loc, accountName }));
  },

  async listReviews(
    organizationId: string,
    locationName: string,
    pageSize = 50,
    pageToken?: string,
  ): Promise<{
    reviews: GoogleReview[];
    nextPageToken?: string;
    totalReviewCount: number;
  }> {
    const data = await callProxy<{
      reviews?: GoogleReview[];
      nextPageToken?: string;
      totalReviewCount?: number;
    }>(organizationId, { action: 'listReviews', locationName, pageSize, pageToken });

    return {
      reviews: data.reviews || [],
      nextPageToken: data.nextPageToken,
      totalReviewCount: data.totalReviewCount || 0,
    };
  },

  async postReply(organizationId: string, reviewName: string, replyText: string): Promise<void> {
    await callProxy(organizationId, { action: 'postReply', reviewName, comment: replyText });
  },

  async deleteReply(organizationId: string, reviewName: string): Promise<void> {
    await callProxy(organizationId, { action: 'deleteReply', reviewName });
  },

  async syncAllReviews(organizationId: string): Promise<{ synced: number; total: number }> {
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
          const result = await this.listReviews(organizationId, branch.google_location_id, 50, pageToken);
          totalFetched += result.reviews.length;

          for (const gReview of result.reviews) {
            const googleReviewId = gReview.reviewId || gReview.name;
            const reviewerGoogleId = gReview.reviewer?.displayName || null;

            const { data: existing } = await supabase
              .from('reviews')
              .select('id')
              .eq('google_review_id', googleReviewId)
              .single();

            if (existing) continue;

            let isFollowup = false;
            let status: 'new' | 'manual_review_required' = 'new';

            if (reviewerGoogleId) {
              const { data: prev } = await supabase
                .from('reviews')
                .select('id')
                .eq('branch_id', branch.id)
                .eq('reviewer_google_id', reviewerGoogleId)
                .in('status', ['replied', 'auto_replied'])
                .limit(1);

              if (prev && prev.length > 0) {
                isFollowup = true;
                status = 'manual_review_required';
              }
            }

            const text = (gReview.comment || '').toLowerCase();
            if (['spam', 'fake', 'مزيف', 'كذب'].some((w) => text.includes(w)) && !isFollowup) {
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
          if (pageToken) await sleep(500);
        } while (pageToken);
      } catch (err) {
        console.error(`Failed to sync reviews for branch ${branch.id}:`, err);
      }

      await sleep(700);
    }

    return { synced: totalSynced, total: totalFetched };
  },

  async sendReplyToGoogle(organizationId: string, reviewId: string, replyText: string): Promise<void> {
    const { data: reviewData, error } = await supabase
      .from('reviews')
      .select('google_review_id')
      .eq('id', reviewId)
      .single();

    const review = reviewData as ReviewLookup | null;
    if (error || !review?.google_review_id) {
      throw new Error('Review not found or missing Google reference');
    }

    await this.postReply(organizationId, review.google_review_id, replyText);
  },
};
