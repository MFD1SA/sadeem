import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRouter } from '@/router';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppRouter />
    </>
  );
}
