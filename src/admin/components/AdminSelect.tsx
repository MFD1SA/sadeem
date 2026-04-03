// ============================================================================
// SADEEM Admin — AdminSelect
// Custom white-first select: hides native arrow, injects chevron icon.
// Drop-in replacement for all native <select> elements in admin pages.
// ============================================================================

import { type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Width/sizing Tailwind classes applied to the wrapper div (default: w-full) */
  wrapperClassName?: string;
}

export function AdminSelect({
  wrapperClassName = 'w-full',
  className = '',
  children,
  ...props
}: AdminSelectProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...props}
        className={`admin-form-input w-full appearance-none pl-8 cursor-pointer [&>option]:bg-white [&>option]:text-gray-900 [&>option]:py-1 ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none flex-shrink-0"
      />
    </div>
  );
}
