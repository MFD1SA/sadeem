// ============================================================================
// SENDA Admin — Topbar (Final)
// Branding from DB. Avatar shown. No logout (sidebar only).
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES } from '../utils/constants';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
import { adminTicketsService } from '../services/adminTickets.service';
import { Menu, UserCircle, Lock, ChevronDown, User, Bell, AlertCircle } from 'lucide-react';
import type { BreadcrumbItem } from '../types';

// Page title map
const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'لوحة التحكم',
  '/admin/subscribers': 'المشتركين',
  '/admin/billing': 'المالية والفوترة',
  '/admin/ai-usage': 'استهلاك AI',
  '/admin/payment-gateway': 'بوابة الدفع',
  '/admin/tickets': 'الدعم الفني',
  '/admin/integrations': 'التكاملات',
  '/admin/admins': 'المشرفين',
  '/admin/roles': 'الأدوار والصلاحيات',
  '/admin/settings': 'الإعدادات',
  '/admin/audit-logs': 'سجل العمليات',
  '/admin/profile': 'الملف الشخصي',
  '/admin/security': 'الأمان',
  '/admin/plans': 'الخطط والأسعار',
};

interface AdminTopbarProps { onMenuToggle: () => void; }

export function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const { user } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminSettingsService.getBranding().then(setBranding).catch(() => {});
  }, []);

  // Refetch open ticket count on every route change (topbar stays mounted)
  useEffect(() => {
    adminTicketsService.list({ status: 'open' })
      .then(r => setOpenTicketCount(r.total))
      .catch(() => setOpenTicketCount(0));
  }, [location.pathname]);

  useEffect(() => {
    if (!showMenu) return;
    const handle = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle); };
  }, [showMenu]);

  const pageTitle = PAGE_TITLES[location.pathname] || '';

  return (
    <header className="admin-topbar" dir="rtl">

      {/* ── Left side: hamburger + page title ── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle sidebar menu"
          className="lg:hidden p-2 rounded-xl transition-colors flex-shrink-0"
          style={{ color: '#6b7280' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#111827'; (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <Menu size={18} />
        </button>

        {pageTitle && (
          <div className="hidden sm:flex flex-col min-w-0">
            <h2 className="text-[14px] font-semibold leading-none truncate" style={{ color: '#111827' }}>
              {pageTitle}
            </h2>
            <span className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>
              {branding?.platform_name_ar || 'سيندا'} · لوحة الإدارة
            </span>
          </div>
        )}
      </div>

      {/* ── Right side: notifications + user ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Notification bell */}
        <button
          onClick={() => navigate(ADMIN_ROUTES.TICKETS)}
          title="تذاكر الدعم"
          aria-label="Support tickets"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150"
          style={{ color: '#6b7280' }}
          onMouseOver={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#111827';
            el.style.background = '#f9fafb';
          }}
          onMouseOut={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#6b7280';
            el.style.background = '';
          }}
        >
          <Bell size={17} />
          {openTicketCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white px-1"
              style={{ background: '#EF4444' }}
            >
              {openTicketCount > 99 ? '99+' : openTicketCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: '#e5e7eb' }} />

        {/* User profile button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="User menu"
            aria-expanded={showMenu}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150"
            style={{ color: '#374151' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = showMenu ? '#f3f4f6' : ''}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', boxShadow: '0 2px 8px rgba(76,110,245,0.2)' }}
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : user?.full_name_ar?.charAt(0)
                  ? user.full_name_ar.charAt(0)
                  : <User size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />}
            </div>

            {/* Name + role */}
            <div className="hidden sm:block text-right min-w-0">
              <div className="text-[13px] font-semibold leading-none truncate" style={{ color: '#111827' }}>
                {user?.full_name_ar || 'مشرف'}
              </div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: '#6b7280' }}>
                {user?.is_super_admin ? 'مدير عام' : (user?.role?.display_name_ar || 'مشرف')}
              </div>
            </div>

            <ChevronDown
              size={12}
              className="hidden sm:block transition-transform duration-150 flex-shrink-0"
              style={{ color: '#9ca3af', transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div
              className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)',
              }}
            >
              {/* User info header */}
              <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                <div className="text-[13.5px] font-semibold" style={{ color: '#111827' }}>
                  {user?.full_name_ar}
                </div>
                <div className="text-[11px] mt-0.5 font-mono" dir="ltr" style={{ color: '#6b7280' }}>
                  {user?.email}
                </div>
                {user?.is_super_admin && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium mt-1.5"
                    style={{ background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' }}
                  >
                    <AlertCircle size={9} /> مدير عام
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="py-1.5">
                <button
                  onClick={() => { navigate(ADMIN_ROUTES.PROFILE); setShowMenu(false); }}
                  aria-label="Profile"
                  className="admin-dropdown-item"
                >
                  <UserCircle size={15} /> الملف الشخصي
                </button>
                <button
                  onClick={() => { navigate(ADMIN_ROUTES.SECURITY); setShowMenu(false); }}
                  aria-label="Security"
                  className="admin-dropdown-item"
                >
                  <Lock size={15} /> الأمان
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
