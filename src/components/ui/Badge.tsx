import { type ReactNode } from 'react';
import { cn, getStatusColor } from '@/utils/helpers';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  danger: 'bg-red-50 text-red-700 border border-red-200/60',
  info: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  neutral: 'bg-gray-50 text-gray-600 border border-gray-200/60',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge variant={getStatusColor(status) as BadgeProps['variant']}>{label}</Badge>;
}
