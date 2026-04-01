import { type ReactNode } from 'react';
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
  icon?: ReactNode;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, sub, valueColor, icon, iconColor, trend }: StatCardProps) {
  return (
    <div className="card group hover:shadow-md transition-shadow duration-200">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">{label}</span>
          {icon && (
            <span className={iconColor || 'text-content-tertiary'}>
              {icon}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold leading-none tracking-tight ${valueColor || 'text-content-primary'}`}>
            {value}
          </span>
          {trend && (
            <span className={`text-2xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        {sub && <div className="text-2xs text-content-tertiary mt-1.5">{sub}</div>}
      </div>
    </div>
  );
}
