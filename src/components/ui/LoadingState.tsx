interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4" role="status" aria-live="polite">
      <div className="relative">
        <div className="w-9 h-9 rounded-full border-[2.5px] border-gray-100 border-t-brand-500 animate-spin" aria-hidden="true" />
      </div>
      <p className="text-sm text-content-tertiary mt-4 font-medium">{message || 'جاري التحميل...'}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center" role="alert" aria-live="assertive">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4" aria-hidden="true">
        <span className="text-red-500 text-lg font-bold">!</span>
      </div>
      <p className="text-sm font-medium text-content-primary mb-1">حدث خطأ</p>
      <p className="text-xs text-content-tertiary mb-5 max-w-xs">{message || 'حدث خطأ أثناء تحميل البيانات'}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" onClick={onRetry}>
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
