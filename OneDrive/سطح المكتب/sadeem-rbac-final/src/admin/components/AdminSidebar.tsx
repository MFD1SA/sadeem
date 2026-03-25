// ============================================================================
// SADEEM Admin — Sidebar (Upgraded)
// Branding loaded from DB. Single logout. Tickets + Integrations added.
// ============================================================================

import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES, PERMISSIONS } from '../utils/constants';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
import { useEffect, useState } from 'react';
import {
  LayoutGrid, UsersRound, ShieldCheck, Settings, ClipboardList,
  UserCircle, Lock, LogOut, X, Building2, CreditCard, Zap,
  Activity, Headphones, Puzzle, Layers, Package,
} from 'lucide-react';

interface AdminSidebarProps { isOpen: boolean; onClose: () => void; }

const mainNav = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutGrid, path: ADMIN_ROUTES.DASHBOARD, permission: PERMISSIONS.DASHBOARD_VIEW },
  { id: 'subscribers', label: 'المشتركين', icon: Building2, path: ADMIN_ROUTES.SUBSCRIBERS, permission: PERMISSIONS.SUBSCRIBERS_VIEW },
  { id: 'billing', label: 'المالية والفوترة', icon: CreditCard, path: ADMIN_ROUTES.BILLING, permission: PERMISSIONS.FINANCE_VIEW },
  { id: 'ai-usage', label: 'استهلاك AI', icon: Zap, path: ADMIN_ROUTES.AI_USAGE, permission: PERMISSIONS.DASHBOARD_ANALYTICS },
  { id: 'payment-gateway', label: 'بوابة الدفع', icon: Activity, path: ADMIN_ROUTES.PAYMENT_GATEWAY, permission: PERMISSIONS.FINANCE_VIEW, dividerAfter: true },
  { id: 'tickets', label: 'الدعم الفني', icon: Headphones, path: ADMIN_ROUTES.TICKETS, permission: PERMISSIONS.SUPPORT_VIEW },
  { id: 'integrations', label: 'التكاملات', icon: Puzzle, path: ADMIN_ROUTES.INTEGRATIONS, permission: PERMISSIONS.SETTINGS_VIEW },
  { id: 'plans', label: 'الخطط والأسعار', icon: Package, path: ADMIN_ROUTES.PLANS, permission: PERMISSIONS.SETTINGS_VIEW, dividerAfter: true },
  { id: 'admins', label: 'المشرفين', icon: UsersRound, path: ADMIN_ROUTES.ADMINS, permission: PERMISSIONS.ADMIN_USERS_VIEW },
  { id: 'roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, path: ADMIN_ROUTES.ROLES, permission: PERMISSIONS.ROLES_VIEW, dividerAfter: true },
  { id: 'settings', label: 'الإعدادات', icon: Settings, path: ADMIN_ROUTES.SETTINGS, permission: PERMISSIONS.SETTINGS_VIEW },
  { id: 'audit', label: 'سجل العمليات', icon: ClipboardList, path: ADMIN_ROUTES.AUDIT_LOGS, permission: PERMISSIONS.AUDIT_LOGS_VIEW },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { user, hasPermission, logout } = useAdminAuth();
  const location = useLocation();
  const [branding, setBranding] = useState<BrandingSettings | null>(null);

  useEffect(() => {
    adminSettingsService.getBranding().then(setBranding).catch(() => {});
  }, []);

  const isActive = (path: string) => {
    if (path === ADMIN_ROUTES.DASHBOARD) return location.pathname === ADMIN_ROUTES.DASHBOARD || location.pathname === ADMIN_ROUTES.ROOT;
    return location.pathname.startsWith(path);
  };

  const filtered = mainNav.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}

      <aside className={`admin-sidebar ${isOpen ? 'translate-x-0' : 'max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full'}`}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            {branding?.logo_icon_url ? (
              <img src={branding.logo_icon_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Layers size={16} className="text-white" />
              </div>
            )}
            <div>
              <span className="text-white text-sm font-semibold tracking-wide">{branding?.platform_name_en || 'SADEEM'}</span>
              <span className="block text-[10px] text-cyan-400/80 font-medium -mt-0.5">لوحة الإدارة</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {filtered.map((item) => (
              <div key={item.id}>
                <NavLink to={item.path} onClick={onClose}
                  className={`admin-nav-item ${isActive(item.path) ? 'admin-nav-item-active' : ''}`}>
                  <item.icon size={18} className="flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive(item.path) && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />}
                </NavLink>
                {item.dividerAfter && <div className="my-3 mx-3 border-t border-white/[0.04]" />}
              </div>
            ))}
          </div>
        </nav>

        {/* User card — single logout location */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : user?.full_name_ar?.charAt(0)
                  ? <span>{user.full_name_ar.charAt(0)}</span>
                  : <UserCircle size={16} className="text-slate-400" />}
            </div>
            <div className="flex-1 text-right min-w-0">
              <div className="text-sm text-white font-medium truncate">{user?.full_name_ar || 'مشرف'}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.role?.display_name_ar || user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <NavLink to={ADMIN_ROUTES.PROFILE} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors">
              <UserCircle size={14} /> الملف
            </NavLink>
            <NavLink to={ADMIN_ROUTES.SECURITY} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors">
              <Lock size={14} /> الأمان
            </NavLink>
            <button onClick={() => { logout(); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut size={14} /> خروج
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
