import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from '@/i18n';
import { AuthProvider } from '@/hooks/useAuth';
import { initErrorTracking } from '@/services/errorTracking';
import App from './App';
import './index.css';

// Initialize global error tracking (unhandled errors + promise rejections)
initErrorTracking();

// React.StrictMode is intentionally removed: in development it mounts
// components twice, which causes Supabase's BroadcastChannel auth lock
// ("lock:sadeem-auth") to become orphaned. The second mount then waits
// 5 000 ms for the lock to expire before INITIAL_SESSION fires — making
// the "جاري التحميل..." spinner stuck for 5+ seconds on every page load.

const rootEl = document.getElementById('root');

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
} else {
  console.error('[Senda] Root element not found');
}
