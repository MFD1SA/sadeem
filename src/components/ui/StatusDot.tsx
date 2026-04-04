import { cn } from '@/utils/helpers';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
};

const labelMap: Record<string, string> = {
  green: 'Active',
  red: 'Inactive',
  yellow: 'Pending',
  blue: 'Info',
  gray: 'Unknown',
};

export function StatusDot({ color = 'gray', className, label }: { color?: string; className?: string; label?: string }) {
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full', colorMap[color] || colorMap.gray, className)}
      role="img"
      aria-label={label || labelMap[color] || 'Status'}
    />
  );
}

export function BoolDot({ value, labelTrue, labelFalse }: { value: boolean; labelTrue?: string; labelFalse?: string }) {
  return (
    <StatusDot
      color={value ? 'green' : 'red'}
      label={value ? (labelTrue || 'Active') : (labelFalse || 'Inactive')}
    />
  );
}
