import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-gray-300 opacity-60 mb-4">
        {icon || <Inbox size={44} strokeWidth={1} />}
      </div>
      <p className="text-sm text-content-tertiary max-w-xs">{message || 'لا توجد بيانات'}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
