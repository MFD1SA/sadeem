import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from '@/i18n';
import { AuthProvider } from '@/hooks/useAuth';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('[Sadeem] Root element not found');
}
