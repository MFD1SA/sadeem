import { useLanguage } from '@/i18n';

interface BranchStat {
  branchId: string;
  branchName: string;
  count: number;
  avgRating: number;
  responseRate: number;
}

export function BranchComparison({ branches }: { branches: BranchStat[] }) {
  const { t } = useLanguage();

  if (branches.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header"><h3>{t.analyticsPage.branchComparison}</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-right rtl:text-right ltr:text-left px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">{t.analyticsPage.branch}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border text-center">{t.analyticsPage.rating}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border text-center">{t.analyticsPage.reviews}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border text-center">{t.analyticsPage.responseRateShort}</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.branchId} className="border-b border-border last:border-b-0 hover:bg-surface-secondary/60">
                <td className="px-4 py-3 font-medium">{b.branchName}</td>
                <td className="px-4 py-3 text-center"><span className="text-amber-500">★</span> {b.avgRating}</td>
                <td className="px-4 py-3 text-center">{b.count}</td>
                <td className="px-4 py-3 text-center">
                  <span className={b.responseRate >= 85 ? 'text-emerald-600 font-medium' : b.responseRate >= 70 ? 'text-amber-600' : 'text-red-600'}>
                    {b.responseRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
