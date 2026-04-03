import { supabase } from '@/lib/supabase';

// ── Audit Event Types ──
// Grouped by domain for clarity. Each event name is unique and self-descriptive.

export type AuditEvent =
  // Sync
  | 'sync_completed'
  | 'sync_failed'
  // AI
  | 'ai_reply_generated'
  | 'ai_reply_failed'
  | 'ai_limit_reached'
  // Template
  | 'template_matched'
  | 'template_quota_exhausted'
  // Draft lifecycle
  | 'draft_created'
  | 'draft_edited'
  | 'draft_approved'
  | 'draft_rejected'
  | 'draft_deferred'
  // Reply publishing
  | 'reply_sent_google'
  | 'reply_auto_sent'
  | 'reply_send_failed'
  // Review
  | 'review_flagged_manual'
  // Other
  | 'trial_expired'
  | 'branch_created'
  | 'qr_generated'
  // Legacy (kept for backward compat with existing data)
  | 'review_fetched'
  | 'review_synced'
  | 'reply_approved'
  | 'reply_rejected'
  | 'reply_sent_google'
  | 'template_applied'
  | 'manual_review_flagged'
  | 'reply_send_failed';

export type ActorType = 'user' | 'system' | 'auto';

export interface AuditDetails {
  // Common
  message?: string;
  // Draft/Reply context
  draft_id?: string;
  review_id?: string;
  source?: string;          // 'ai' | 'template' | 'manual'
  // Failure context
  error?: string;
  error_code?: string;
  // Edit tracking
  previous_text?: string;
  new_text?: string;
  // Sync context
  reviews_count?: number;
  branch_id?: string;
  branch_name?: string;
  // Misc
  [key: string]: unknown;
}

interface AuditEntry {
  event: AuditEvent;
  organization_id: string;
  entity_id?: string;
  entity_type?: 'review' | 'draft' | 'branch' | 'template' | 'subscription';
  details?: AuditDetails;
  user_id?: string;
  actor_type?: ActorType;
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
        details: entry.details ? entry.details : null,
        user_id: entry.user_id || null,
        actor_type: entry.actor_type || 'system',
        created_at: new Date().toISOString(),
      }))
    );
  } catch {
    // Silently fail — audit logs should never break the main flow
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

  /**
   * Log an event and flush immediately. Use for critical events
   * (reply sent, reply failed) that must not be lost.
   */
  async trackNow(entry: AuditEntry): Promise<void> {
    buffer.push(entry);
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    await flush();
  },

  /** Force flush all pending events (call on page unload or sync complete) */
  async flush(): Promise<void> {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    await flush();
  },
};
