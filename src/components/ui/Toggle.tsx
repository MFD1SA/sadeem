import { cn } from '@/utils/helpers';

interface ToggleProps {
  value: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange?.(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
        value ? 'bg-emerald-500' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'ltr:translate-x-1 rtl:-translate-x-1'
        )}
      />
    </button>
  );
}
