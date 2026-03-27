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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'translate-x-0' : 'max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full'}`}>

        {/* ── Brand header ── */}
        <div className="h-16 flex items-center justify-between px-4 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            {branding?.logo_icon_url ? (
              <img src={branding.logo_icon_url} alt="" className="w-8 h-8 rounded-xl object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0891b2, #1d4ed8)', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
                <Layers size={15} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-white tracking-wide leading-none">
                {branding?.platform_name_en || 'SADEEM'}
              </div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(6,182,212,0.7)' }}>
                لوحة الإدارة
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            onMouseOver={e => (e.currentTarget.style.color = '#E5E7EB')}
            onMouseOut={e => (e.currentTarget.style.color = '#6B7280')}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5" style={{ scrollbarWidth: 'none' }}>
          <div className="space-y-0.5">
            {filtered.map((item) => (
              <div key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={`admin-nav-item ${isActive(item.path) ? 'admin-nav-item-active' : ''}`}
                >
                  <item.icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {isActive(item.path) && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#06B6D4', boxShadow: '0 0 6px rgba(6,182,212,0.6)' }}
                    />
                  )}
                </NavLink>
                {item.dividerAfter && (
                  <div className="my-2.5 mx-2" style={{ borderTop: '1px solid #1F2937' }} />
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* ── User footer ── */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {/* User info row */}
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl mb-1"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #374151, #1F2937)' }}
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : user?.full_name_ar?.charAt(0)
                  ? user.full_name_ar.charAt(0)
                  : <UserCircle size={15} style={{ color: '#9CA3AF' }} />}
            </div>
            <div className="flex-1 text-right min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: '#E5E7EB' }}>
                {user?.full_name_ar || 'مشرف'}
              </div>
              <div className="text-[11px] truncate mt-0.5" style={{ color: '#6B7280' }}>
                {user?.role?.display_name_ar || user?.email}
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-1">
            <NavLink to={ADMIN_ROUTES.PROFILE} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors"
              style={{ color: '#6B7280' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <UserCircle size={13} /> الملف
            </NavLink>
            <NavLink to={ADMIN_ROUTES.SECURITY} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors"
              style={{ color: '#6B7280' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <Lock size={13} /> الأمان
            </NavLink>
            <button
              onClick={() => { logout(); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors"
              style={{ color: '#EF4444' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <LogOut size={13} /> خروج
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
