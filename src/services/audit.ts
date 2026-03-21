import { supabase } from '@/lib/supabase';

export type AuditEvent =
  | 'review_fetched'
  | 'review_synced'
  | 'ai_reply_generated'
  | 'ai_reply_failed'
  | 'reply_approved'
  | 'reply_rejected'
  | 'reply_sent_google'
  | 'reply_send_failed'
  | 'template_applied'
  | 'manual_review_flagged'
  | 'trial_expired'
  | 'branch_created'
  | 'qr_generated';

interface AuditEntry {
  event: AuditEvent;
  organization_id: string;
  entity_id?: string;
  entity_type?: string;
  details?: string;
  user_id?: string;
}

// In-memory buffer for batch writes
const buffer: AuditEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);

  try {
    await supabase.from('audit_logs').insert(
      batch.map(entry => ({
        event: entry.event,
        organization_id: entry.organization_id,
        entity_id: entry.entity_id || null,
        entity_type: entry.entity_type || null,
        details: entry.details || null,
        user_id: entry.user_id || null,
        created_at: new Date().toISOString(),
      }))
    );
  } catch {
    // Silently fail — audit logs should never break the main flow
    // If the audit_logs table doesn't exist yet, this is expected
    console.warn('[Sadeem] Audit log write failed (table may not exist yet)');
  }
}

export const auditLog = {
  /**
   * Log an event. Batched — writes happen every 5 seconds or on 10+ events.
   */
  track(entry: AuditEntry): void {
    buffer.push(entry);

    if (buffer.length >= 10) {
      flush();
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flush();
      }, 5000);
    }
  },

  /** Force flush all pending events (call on page unload or sync complete) */
  async flush(): Promise<void> {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    await flush();
  },
};
