// ============================================================================
// SADEEM Admin — Sidebar
// Uses lucide-react (already in package.json dependencies).
// ============================================================================

import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES, PERMISSIONS } from '../utils/constants';
import {
  LayoutGrid,
  UsersRound,
  ShieldCheck,
  Settings,
  ClipboardList,
  UserCircle,
  Lock,
  LogOut,
  X,
  ChevronDown,
  Building2,
  CreditCard,
  Zap,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNav = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutGrid, path: ADMIN_ROUTES.DASHBOARD, permission: PERMISSIONS.DASHBOARD_VIEW },
  { id: 'subscribers', label: 'المشتركين', icon: Building2, path: ADMIN_ROUTES.SUBSCRIBERS, permission: PERMISSIONS.SUBSCRIBERS_VIEW, dividerAfter: true },
  { id: 'billing', label: 'المالية والفوترة', icon: CreditCard, path: ADMIN_ROUTES.BILLING, permission: PERMISSIONS.FINANCE_VIEW },
  { id: 'ai-usage', label: 'استهلاك AI', icon: Zap, path: ADMIN_ROUTES.AI_USAGE, permission: PERMISSIONS.DASHBOARD_ANALYTICS },
  { id: 'payment-gateway', label: 'بوابة الدفع', icon: Activity, path: ADMIN_ROUTES.PAYMENT_GATEWAY, permission: PERMISSIONS.FINANCE_VIEW, dividerAfter: true },
  { id: 'admins', label: 'إدارة المشرفين', icon: UsersRound, path: ADMIN_ROUTES.ADMINS, permission: PERMISSIONS.ADMIN_USERS_VIEW },
  { id: 'roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, path: ADMIN_ROUTES.ROLES, permission: PERMISSIONS.ROLES_VIEW, dividerAfter: true },
  { id: 'settings', label: 'الإعدادات', icon: Settings, path: ADMIN_ROUTES.SETTINGS, permission: PERMISSIONS.SETTINGS_VIEW },
  { id: 'audit', label: 'سجل العمليات', icon: ClipboardList, path: ADMIN_ROUTES.AUDIT_LOGS, permission: PERMISSIONS.AUDIT_LOGS_VIEW },
];

const accountNav = [
  { id: 'profile', label: 'الملف الشخصي', icon: UserCircle, path: ADMIN_ROUTES.PROFILE },
  { id: 'security', label: 'الأمان', icon: Lock, path: ADMIN_ROUTES.SECURITY },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { user, hasPermission, logout } = useAdminAuth();
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === ADMIN_ROUTES.DASHBOARD) {
      return location.pathname === ADMIN_ROUTES.DASHBOARD || location.pathname === ADMIN_ROUTES.ROOT;
    }
    return location.pathname.startsWith(path);
  };

  const filteredMain = mainNav.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          admin-sidebar
          ${isOpen ? 'translate-x-0' : 'max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white text-xs font-bold">سد</span>
            </div>
            <div>
              <span className="text-white text-sm font-semibold tracking-wide">SADEEM</span>
              <span className="block text-[10px] text-cyan-400/80 font-medium -mt-0.5 tracking-widest uppercase">
                Control Center
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              الرئيسية
            </span>
          </div>

          <div className="space-y-0.5">
            {filteredMain.map((item) => (
              <div key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={`
                    admin-nav-item
                    ${isActive(item.path) ? 'admin-nav-item-active' : ''}
                  `}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <div className="mr-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  )}
                </NavLink>
                {item.dividerAfter && <div className="my-3 mx-3 border-t border-white/[0.04]" />}
              </div>
            ))}
          </div>

          {/* Account section */}
          <div className="mt-6 px-3 mb-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              الحساب
            </span>
          </div>
          <div className="space-y-0.5">
            {accountNav.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={`
                  admin-nav-item
                  ${isActive(item.path) ? 'admin-nav-item-active' : ''}
                `}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User card */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.full_name_ar?.charAt(0) || 'م'}
            </div>
            <div className="flex-1 text-right min-w-0">
              <div className="text-sm text-white font-medium truncate">
                {user?.full_name_ar || 'مشرف'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {user?.role?.display_name_ar || user?.email}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-500 transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showAccountMenu && (
            <div className="mt-1 py-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
