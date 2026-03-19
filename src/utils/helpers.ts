export function formatDate(dateStr: string, locale: string = 'ar-SA'): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string, locale: string = 'ar-SA'): string {
  try {
    return new Date(dateStr).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDate(dateStr);
}

export function renderStars(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'success', connected: 'success', replied: 'success', auto_replied: 'success', done: 'success', resolved: 'success', paid: 'success', sent: 'success',
    new: 'info', open: 'info', trial: 'info', in_progress: 'info',
    pending: 'warning', pending_reply: 'warning', pending_approval: 'warning', deferred: 'warning', past_due: 'warning',
    inactive: 'neutral', disconnected: 'neutral', ignored: 'neutral', cancelled: 'neutral', closed: 'neutral', rejected: 'neutral',
    negative: 'danger', flagged: 'danger', error: 'danger', failed: 'danger', critical: 'danger', suspended: 'danger', expired: 'danger',
  };
  return map[status] || 'neutral';
}

export function getSentimentColor(sentiment: string): string {
  const map: Record<string, string> = { positive: 'success', neutral: 'warning', negative: 'danger' };
  return map[sentiment] || 'neutral';
}
