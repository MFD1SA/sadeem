 { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import {
  LayoutDashboard, MessageSquareText, Inbox, BarChart3, Building2, FileText,
  Users, Plug, ListTodo, Bell, CreditCard, HelpCircle, Settings, X, QrCode, Target,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, key: 'dashboard' as const },
  { path: '/dashboard/reviews', icon: MessageSquareText, key: 'reviews' as const },
  { path: '/dashboard/replies', icon: Inbox, key: 'replies' as const },
  { path: '/dashboard/analytics', icon: BarChart3, key: 'analytics' as const },
  { path: '/dashboard/insights', icon: Target, key: 'insights' as const },
  { path: '/dashboard/branches', icon: Building2, key: 'branches' as const },
  { path: '/dashboard/templates', icon: FileText, key: 'templates' as const },
  { path: '/dashboard/qr', icon: QrCode, key: 'qr' as const },
  { path: '/dashboard/team', icon: Users, key: 'team' as const },
  { path: '/dashboard/integrations', icon: Plug, key: 'integrations' as const },
  { path: '/dashboard/tasks', icon: ListTodo, key: 'tasks' as const },
  { path: '/dashboard/notifications', icon: Bell, key: 'notifications' as const },
  { path: '/dashboard/billing', icon: CreditCard, key: 'billing' as const },
  { path: '/dashboard/support', icon: HelpCircle, key: 'support' as const },
  { path: '/dashboard/settings', icon: Settings, key: 'settings' as const },
];

interface SidebarProps {
  mobileSidebarOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileSidebarOpen, onCloseMobile }: SidebarProps) {
  const { t } = useLanguage();
  useLocation(); // subscribe to route changes for NavLink active state

  return (
    <>
      {/* Mobile backdrop — only on small screens when open */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 
        Desktop: always visible (lg:relative lg:translate-x-0), no transition
        Mobile: slides in/out based on mobileSidebarOpen 
      */}
      <aside
        className={[
          'fixed top-0 bottom-0 z-50 w-[240px] bg-sidebar-bg flex flex-col overflow-y-auto overflow-x-hidden',
          'rtl:right-0 ltr:left-0',
          'lg:relative lg:z-auto lg:!translate-x-0 lg:flex',
          'lg:transition-none transition-transform duration-200 ease-out',
          mobileSidebarOpen
            ? 'translate-x-0'
            : 'max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-white tracking-tight">{t.appName}</span>
            <span className="text-[9px] font-semibold text-brand-300/80 bg-brand-500/15 px-1.5 py-0.5 rounded">Beta</span>
          </div>
          <button className="lg:hidden text-sidebar-text hover:text-white" onClick={onCloseMobile}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={onCloseMobile}
              className={({ isActive }: { isActive: boolean }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{t.nav[item.key]}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/[0.04]">
          <div className="text-[10px] text-sidebar-text/30">سديم v0.1.0</div>
        </div>
      </aside>
    </>
  );
}
