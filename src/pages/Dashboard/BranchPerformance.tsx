import { useLanguage } from '@/i18n';
import { StatusDot } from '@/components/ui/StatusDot';
import type { DbBranch } from '@/types/database';

export function BranchPerformance({ branches }: { branches: DbBranch[] }) {
  const { t } = useLanguage();

  if (branches.length === 0) {
    return <div className="p-5 text-center text-sm text-content-secondary">{t.common.noData}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-right rtl:text-right ltr:text-left px-4 py-2.5 text-2xs font-medium text-content-tertiary uppercase tracking-wider bg-surface-secondary/50 border-b border-border/60">{t.branchesPage.internalName}</th>
            <th className="px-4 py-2.5 text-2xs font-medium text-content-tertiary uppercase tracking-wider bg-surface-secondary/50 border-b border-border/60">{t.branchesPage.city}</th>
            <th className="px-4 py-2.5 text-2xs font-medium text-content-tertiary uppercase tracking-wider bg-surface-secondary/50 border-b border-border/60 text-center">{t.branchesPage.status}</th>
          </tr>
        </thead>
        <tbody>
          {branches.map(b => (
            <tr key={b.id} className="border-b border-border last:border-b-0 hover:bg-surface-secondary/60 transition-colors">
              <td className="px-4 py-3 font-medium">{b.internal_name}</td>
              <td className="px-4 py-3 text-xs text-content-secondary">{b.city || '—'}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <StatusDot color={b.status === 'active' ? 'green' : b.status === 'pending' ? 'yellow' : 'gray'} />
                  <span className="text-xs">{(t.status as Record<string, string>)[b.status] || b.status}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
