import { cn } from '@/utils/helpers';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
};

export function StatusDot({ color = 'gray', className }: { color?: string; className?: string }) {
  return <span className={cn('inline-block w-2 h-2 rounded-full', colorMap[color] || colorMap.gray, className)} />;
}

export function BoolDot({ value }: { value: boolean }) {
  return <StatusDot color={value ? 'green' : 'red'} />;
}
