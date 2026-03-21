import { supabase } from '@/lib/supabase';

interface TrialEmailPayload {
  to: string;
  organizationName: string;
  ownerName: string;
}

/**
 * Trial expiration email content.
 * In production, this would be sent via Supabase Edge Function or an email service.
 * For now, it inserts into a notifications queue table or calls an Edge Function.
 */
export const trialEmailService = {
  getEmailContent(payload: TrialEmailPayload) {
    return {
      to: payload.to,
      subject: 'انتهت تجربتك المجانية في سديم',
      html: `
        <div dir="rtl" style="font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #1a1d2e; margin: 0;">سديم</h1>
          </div>
          
          <h2 style="font-size: 18px; font-weight: 600; color: #1a1d2e; margin-bottom: 12px;">
            مرحباً ${payload.ownerName}،
          </h2>
          
          <p style="font-size: 14px; color: #5f6580; line-height: 1.8; margin-bottom: 20px;">
            انتهت فترتك التجريبية المجانية في سديم لنشاطك <strong>${payload.organizationName}</strong>.
          </p>
          
          <p style="font-size: 14px; color: #5f6580; line-height: 1.8; margin-bottom: 8px;">
            سديم يساعد نشاطك على:
          </p>
          
          <ul style="font-size: 14px; color: #5f6580; line-height: 2; padding-right: 20px; margin-bottom: 20px;">
            <li>الرد التلقائي على تقييمات Google</li>
            <li>زيادة التقييمات عبر QR</li>
            <li>تحليل سمعة نشاطك</li>
          </ul>
          
          <p style="font-size: 14px; color: #5f6580; line-height: 1.8; margin-bottom: 24px;">
            فعّل اشتراكك الآن للاستمرار في إدارة تقييماتك باستخدام الذكاء الاصطناعي.
          </p>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${window.location.origin}/dashboard/billing" 
               style="display: inline-block; padding: 12px 32px; background: #3b5bdb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
              ترقية الاشتراك
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7ed; margin: 24px 0;" />
          
          <p style="font-size: 11px; color: #8b90a8; text-align: center;">
            سديم — إدارة التقييمات بالذكاء الاصطناعي
          </p>
        </div>
      `,
    };
  },

  /**
   * Send trial expiration email.
   * Tries Supabase Edge Function first, falls back to logging.
   */
  async sendTrialExpirationEmail(organizationId: string): Promise<void> {
    try {
      // Get org + owner info
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, owner_user_id')
        .eq('id', organizationId)
        .single();

      if (!orgData) return;

      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', (orgData as { owner_user_id: string }).owner_user_id)
        .single();

      if (!userData) return;
      const user = userData as { email: string; full_name: string };
      const org = orgData as { name: string };

      const emailContent = this.getEmailContent({
        to: user.email,
        organizationName: org.name,
        ownerName: user.full_name || user.email,
      });

      // Try Supabase Edge Function
      try {
        await supabase.functions.invoke('send-email', {
          body: emailContent,
        });
        console.info('[Sadeem] Trial expiration email sent to', user.email);
      } catch {
        // Edge Function not deployed — log the email for manual sending
        console.warn('[Sadeem] Edge Function unavailable. Trial expiration email prepared for:', user.email);
        console.info('[Sadeem] Email subject:', emailContent.subject);
      }
    } catch (err) {
      console.error('[Sadeem] Failed to prepare trial expiration email:', err);
    }
  },
};
