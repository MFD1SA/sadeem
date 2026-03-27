// ============================================================================
// SADEEM Admin — Topbar (Final)
// Branding from DB. Avatar shown. No logout (sidebar only).
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES } from '../utils/constants';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminSettingsService.getBranding().then(setBranding).catch(() => {});
  }, []);

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
          className="lg:hidden p-2 rounded-xl transition-colors flex-shrink-0"
          style={{ color: '#6B7280' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <Menu size={18} />
        </button>

        {pageTitle && (
          <div className="hidden sm:flex flex-col min-w-0">
            <h2 className="text-[14px] font-semibold leading-none truncate" style={{ color: '#E5E7EB' }}>
              {pageTitle}
            </h2>
            <span className="text-[11px] mt-0.5" style={{ color: '#4B5563' }}>
              {branding?.platform_name_ar || 'سديم'} · لوحة الإدارة
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
          className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150"
          style={{ color: '#6B7280' }}
          onMouseOver={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#E5E7EB';
            el.style.background = 'rgba(255,255,255,0.05)';
          }}
          onMouseOut={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#6B7280';
            el.style.background = '';
          }}
        >
          <Bell size={17} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#080D1A]"
            style={{ background: '#EF4444' }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: '#1F2937' }} />

        {/* User profile button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150"
            style={{ color: '#9CA3AF' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = showMenu ? 'rgba(255,255,255,0.04)' : ''}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0891b2, #1d4ed8)', boxShadow: '0 2px 8px rgba(6,182,212,0.3)' }}
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : user?.full_name_ar?.charAt(0)
                  ? user.full_name_ar.charAt(0)
                  : <User size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />}
            </div>

            {/* Name + role */}
            <div className="hidden sm:block text-right min-w-0">
              <div className="text-[13px] font-semibold leading-none truncate" style={{ color: '#E5E7EB' }}>
                {user?.full_name_ar || 'مشرف'}
              </div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: '#6B7280' }}>
                {user?.is_super_admin ? 'مدير عام' : (user?.role?.display_name_ar || 'مشرف')}
              </div>
            </div>

            <ChevronDown
              size={12}
              className="hidden sm:block transition-transform duration-150 flex-shrink-0"
              style={{ color: '#4B5563', transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div
              className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
              style={{
                background: '#111827',
                border: '1px solid #1F2937',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              {/* User info header */}
              <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #1F2937', background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-[13.5px] font-semibold" style={{ color: '#E5E7EB' }}>
                  {user?.full_name_ar}
                </div>
                <div className="text-[11px] mt-0.5 font-mono" dir="ltr" style={{ color: '#6B7280' }}>
                  {user?.email}
                </div>
                {user?.is_super_admin && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium mt-1.5"
                    style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.2)' }}
                  >
                    <AlertCircle size={9} /> مدير عام
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="py-1.5">
                <button
                  onClick={() => { navigate(ADMIN_ROUTES.PROFILE); setShowMenu(false); }}
                  className="admin-dropdown-item"
                >
                  <UserCircle size={15} /> الملف الشخصي
                </button>
                <button
                  onClick={() => { navigate(ADMIN_ROUTES.SECURITY); setShowMenu(false); }}
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
