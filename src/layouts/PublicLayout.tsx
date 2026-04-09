// ============================================================================
// SENDA — Shared Public Page Layout (Header + Footer)
// Matches the HomePage navbar (scrolled state) and dark footer exactly
// ============================================================================
import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    dir: 'rtl',
    langToggle: 'English',
    nav: ['الرئيسية', 'من نحن', 'المميزات', 'الباقات', 'الأسئلة الشائعة', 'المدونة', 'تواصل معنا'],
    navPaths: ['/', '/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'دخول',
    ctaBtn: 'ابدأ الآن',
    footerTagline: 'حلك المتكامل لإدارة تقييمات جوجل وتحسين السمعة الرقمية',
    footerProduct: 'المنتج',
    footerProductLinks: ['المميزات', 'الباقات', 'من نحن'],
    footerProductPaths: ['/features', '/pricing', '/about'],
    footerSupport: 'الدعم',
    footerSupportLinks: ['الأسئلة الشائعة', 'تواصل معنا'],
    footerSupportPaths: ['/faq', '/contact-us'],
    footerLegal: 'قانوني',
    footerLegalLinks: [
      { label: 'سياسة الخصوصية', path: '/privacy' },
      { label: 'شروط الاستخدام', path: '/terms' },
    ],
    copyright: 'جميع الحقوق محفوظة لـ © 2025 SENDA',
  },
  en: {
    dir: 'ltr',
    langToggle: 'العربية',
    nav: ['Home', 'About', 'Features', 'Pricing', 'FAQ', 'Blog', 'Contact'],
    navPaths: ['/', '/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'Login',
    ctaBtn: 'Get Started',
    footerTagline: 'Your complete solution for Google review management and digital reputation',
    footerProduct: 'Product',
    footerProductLinks: ['Features', 'Pricing', 'About'],
    footerProductPaths: ['/features', '/pricing', '/about'],
    footerSupport: 'Support',
    footerSupportLinks: ['FAQ', 'Contact Us'],
    footerSupportPaths: ['/faq', '/contact-us'],
    footerLegal: 'Legal',
    footerLegalLinks: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
    copyright: 'All rights reserved © 2025 SENDA',
  },
};

interface PublicLayoutProps {
  children: ReactNode;
  lang: Lang;
  onToggleLang: () => void;
}

export default function PublicLayout({ children, lang, onToggleLang }: PublicLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = T[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div dir={t.dir} className="min-h-screen bg-[#FAFBFC] text-slate-800" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Inter', system-ui, sans-serif" }}>

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[72px]">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/senda-logo.png" alt="SENDA" className={`h-9 transition-all duration-500 ${scrolled ? '' : 'brightness-0 invert'}`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7">
            {t.nav.map((label: string, i: number) => (
              <Link key={i} to={t.navPaths[i]} className={`text-[13px] font-medium transition-colors ${scrolled ? 'text-slate-500 hover:text-blue-900' : 'text-white/70 hover:text-white'}`}>{label}</Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={onToggleLang} className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${scrolled ? 'text-slate-500 border border-slate-200 hover:bg-slate-50' : 'text-white/70 border border-white/20 hover:bg-white/10'}`}>{t.langToggle}</button>
            <Link to="/login" className={`text-sm transition-colors px-3 py-1.5 ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>{t.loginBtn}</Link>
            <Link to="/login" className="bg-[#0F1A2E] hover:bg-[#1a2d45] text-white text-sm font-medium px-5 py-2 rounded-lg transition-all shadow-sm">{t.ctaBtn}</Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 ${scrolled ? 'text-slate-600' : 'text-white'}`}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg px-6 py-4">
            {t.nav.map((label: string, i: number) => (
              <Link key={i} to={t.navPaths[i]} onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-slate-600 border-b border-slate-50">{label}</Link>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { onToggleLang(); setMobileOpen(false); }} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-500">{t.langToggle}</button>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 bg-[#0F1A2E] text-white text-sm font-medium py-2 rounded-lg text-center">{t.ctaBtn}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ CONTENT ═══════════════════ */}
      <main>
        {children}
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/senda-logo.png" alt="SENDA" className="h-8 brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[260px]">{t.footerTagline}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerProduct}</h4>
              <ul className="space-y-2.5">
                {t.footerProductLinks.map((link: string, i: number) => (
                  <li key={i}><Link to={t.footerProductPaths[i]} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerSupport}</h4>
              <ul className="space-y-2.5">
                {t.footerSupportLinks.map((link: string, i: number) => (
                  <li key={i}><Link to={t.footerSupportPaths[i]} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerLegal}</h4>
              <ul className="space-y-2.5">
                {t.footerLegalLinks.map((link: any, i: number) => (
                  <li key={i}><Link to={link.path} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 py-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Twitter / X */}
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/966504566777" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
            <p className="text-xs text-slate-500">{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
