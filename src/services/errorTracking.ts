// ============================================================================
// SENDA — Lightweight Error Tracking Service
// Captures unhandled errors + promise rejections and logs to audit_logs.
// No external dependency (Sentry-like behavior without the SDK).
// ============================================================================

import { supabase } from '@/lib/supabase';

interface ErrorEvent {
  type: 'error' | 'unhandledrejection' | 'component' | 'api';
  message: string;
  stack?: string;
  componentName?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

const ERROR_BUFFER: ErrorEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_BUFFER = 10;
const FLUSH_INTERVAL_MS = 5000;
let initialized = false;

/**
 * Initialize global error tracking. Call once at app startup.
 */
export function initErrorTracking(): void {
  if (initialized) return;
  initialized = true;

  // Global error handler
  window.addEventListener('error', (event) => {
    captureError({
      type: 'error',
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    captureError({
      type: 'unhandledrejection',
      message: reason?.message || String(reason) || 'Unhandled promise rejection',
      stack: reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Manually capture a component error (from ErrorBoundary).
 */
export function captureComponentError(error: Error, componentName?: string): void {
  captureError({
    type: 'component',
    message: error.message,
    stack: error.stack,
    componentName,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Manually capture an API error.
 */
export function captureApiError(endpoint: string, status: number, message: string): void {
  captureError({
    type: 'api',
    message: `API ${status}: ${endpoint} — ${message}`,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });
}

function captureError(event: ErrorEvent): void {
  // Sanitize: strip tokens/keys from stack traces
  if (event.stack) {
    event.stack = event.stack.replace(/token=[^&\s]+/gi, 'token=***')
      .replace(/key=[^&\s]+/gi, 'key=***')
      .replace(/Bearer\s+[^\s]+/gi, 'Bearer ***');
  }

  // Don't double-log chunk errors (handled by ErrorBoundary reload)
  if (event.message.includes('dynamically imported module') || event.message.includes('Loading chunk')) {
    return;
  }

  ERROR_BUFFER.push(event);

  if (ERROR_BUFFER.length >= MAX_BUFFER) {
    flushErrors();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushErrors, FLUSH_INTERVAL_MS);
  }
}

async function flushErrors(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (ERROR_BUFFER.length === 0) return;

  const batch = ERROR_BUFFER.splice(0);

  // Log to console for development
  for (const e of batch) {
    console.error(`[Senda ErrorTracker] ${e.type}: ${e.message}`);
  }

  // Best-effort: write to audit_logs table
  try {
    const rows = batch.map(e => ({
      action: `client_${e.type}`,
      details: {
        message: e.message.slice(0, 500),
        stack: e.stack?.slice(0, 1000),
        componentName: e.componentName,
        url: e.url,
        timestamp: e.timestamp,
      },
    }));

    await supabase.from('audit_logs').insert(rows);
  } catch {
    // Silent fail — don't create error loops
  }
}
