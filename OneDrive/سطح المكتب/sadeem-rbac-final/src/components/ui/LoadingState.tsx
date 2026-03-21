interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-content-tertiary">{message || 'جاري التحميل...'}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <span className="text-red-400 text-base font-semibold">!</span>
      </div>
      <p className="text-sm text-content-tertiary mb-4 max-w-xs">{message || 'حدث خطأ أثناء تحميل البيانات'}</p>
      {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>إعادة المحاولة</button>}
    </div>
  );
}
