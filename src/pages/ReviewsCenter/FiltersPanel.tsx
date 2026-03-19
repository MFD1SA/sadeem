import { type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import type { DbBranch } from '@/types/database';

interface ReviewFilters {
  search: string;
  branchId: string;
  rating: number | null;
  sentiment: string | null;
  status: string | null;
}

interface FiltersPanelProps {
  filters: ReviewFilters;
  onChange: (filters: ReviewFilters) => void;
  branches: DbBranch[];
}

export function FiltersPanel({ filters, onChange, branches }: FiltersPanelProps) {
  const { t } = useLanguage();
  const update = (key: keyof ReviewFilters, value: unknown) => onChange({ ...filters, [key]: value });

  return (
    <div className="p-3 space-y-3">
      <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">{t.reviewsCenter.filters}</h4>

      <input
        type="text"
        placeholder={t.common.search}
        value={filters.search}
        onChange={(e: ChangeEvent<HTMLInputElement>) => update('search', e.target.value)}
        className="form-input text-xs"
      />

      <select className="form-select" onChange={(e: ChangeEvent<HTMLSelectElement>) => update('branchId', e.target.value)}>
        <option value="">{t.reviewsCenter.allBranches}</option>
        {branches.filter((b: DbBranch) => b.status === 'active').map((b: DbBranch) => (
          <option key={b.id} value={b.id}>{b.internal_name}</option>
        ))}
      </select>

      <select className="form-select" onChange={(e: ChangeEvent<HTMLSelectElement>) => update('rating', e.target.value ? Number(e.target.value) : null)}>
        <option value="">{t.reviewsCenter.allRatings}</option>
        {[5, 4, 3, 2, 1].map((r: number) => (
          <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>
        ))}
      </select>

      <select className="form-select" onChange={(e: ChangeEvent<HTMLSelectElement>) => update('sentiment', e.target.value || null)}>
        <option value="">{t.reviewsCenter.allSentiments}</option>
        <option value="positive">{t.sentiment.positive}</option>
        <option value="neutral">{t.sentiment.neutral}</option>
        <option value="negative">{t.sentiment.negative}</option>
      </select>

      <select className="form-select" onChange={(e: ChangeEvent<HTMLSelectElement>) => update('status', e.target.value || null)}>
        <option value="">{t.reviewsCenter.allStatuses}</option>
        <option value="new">{t.status.new}</option>
        <option value="replied">{t.status.replied}</option>
        <option value="pending_reply">{t.status.pending_reply}</option>
        <option value="auto_replied">{t.status.auto_replied}</option>
        <option value="flagged">{t.status.flagged}</option>
        <option value="manual_review_required">{t.status.manual_review_required || 'مراجعة يدوية'}</option>
      </select>

      <button
        className="btn btn-secondary btn-sm w-full"
        onClick={() => onChange({ search: '', branchId: '', rating: null, sentiment: null, status: null })}
      >
        {t.reviewsCenter.clearFilters}
      </button>
    </div>
  );
}
