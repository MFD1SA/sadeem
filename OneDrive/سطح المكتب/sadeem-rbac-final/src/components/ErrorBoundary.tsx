import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Sadeem] Uncaught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'IBM Plex Sans Arabic, Inter, system-ui, sans-serif',
          background: '#f8f9fb',
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7ed',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1d2e', marginBottom: '8px' }}>
              حدث خطأ غير متوقع
            </h1>
            <p style={{ fontSize: '14px', color: '#5f6580', marginBottom: '20px', lineHeight: 1.6 }}>
              نعتذر عن هذا الخطأ. يرجى تحديث الصفحة أو المحاولة لاحقاً.
            </p>
            <p style={{ fontSize: '12px', color: '#8b90a8', marginBottom: '20px', direction: 'ltr' as const, background: '#f8f9fb', padding: '8px 12px', borderRadius: '6px', wordBreak: 'break-all' as const }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#3b5bdb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
