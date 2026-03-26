// ============================================================================
// SADEEM Admin — Topbar (Final)
// Branding from DB. Avatar shown. No logout (sidebar only).
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES } from '../utils/constants';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
import { Menu, UserCircle, Lock, ChevronDown, User } from 'lucide-react';
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
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Menu size={18} />
        </button>

        {/* Page title */}
        {pageTitle && (
          <div className="hidden sm:flex items-center gap-2.5">
            <h2 className="text-sm font-medium text-white">{pageTitle}</h2>
            <span className="text-[10px] text-slate-600">|</span>
            <span className="text-[11px] text-slate-500">{branding?.platform_name_ar || 'سديم'}</span>
          </div>
        )}
      </div>

      {/* User quick menu */}
      <div className="relative" ref={menuRef}>
        <button onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : user?.full_name_ar?.charAt(0)
                ? <span>{user.full_name_ar.charAt(0)}</span>
                : <User size={14} className="text-white/80" />}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-[13px] text-white font-medium leading-tight">{user?.full_name_ar || 'مشرف'}</div>
            <div className="text-[11px] text-slate-500 leading-tight">{user?.is_super_admin ? 'مدير عام' : user?.role?.display_name_ar}</div>
          </div>
          <ChevronDown size={13} className="text-slate-600 hidden sm:block" />
        </button>

        {showMenu && (
          <div className="absolute left-0 top-full mt-2 w-52 bg-[#1e293b] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
              <div className="text-sm text-white font-medium">{user?.full_name_ar}</div>
              <div className="text-[11px] text-slate-500 mt-0.5" dir="ltr">{user?.email}</div>
            </div>
            <div className="py-1.5">
              <button onClick={() => { navigate(ADMIN_ROUTES.PROFILE); setShowMenu(false); }} className="admin-dropdown-item">
                <UserCircle size={15} className="text-slate-500" /> الملف الشخصي
              </button>
              <button onClick={() => { navigate(ADMIN_ROUTES.SECURITY); setShowMenu(false); }} className="admin-dropdown-item">
                <Lock size={15} className="text-slate-500" /> الأمان
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
