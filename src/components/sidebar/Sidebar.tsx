import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  MessageSquareText,
  Inbox,
  BarChart3,
  Building2,
  FileText,
  Users,
  Plug,
  ListTodo,
  Bell,
  CreditCard,
  HelpCircle,
  Settings,
  X,
  QrCode,
  Target,
  LogOut,
  User,
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
  const { t, lang } = useLanguage();
  const { profile, signOut, session } = useAuth();
  const navigate = useNavigate();
  useLocation();

  const userName = profile?.full_name || profile?.email || '';
  const sessionMeta = (session as { user?: { user_metadata?: { avatar_url?: string } } } | null)?.user?.user_metadata;
  const userAvatar = profile?.avatar_url || sessionMeta?.avatar_url || null;
  const userInitial = userName.charAt(0) || '?';

  const handleLogout = () => {
    onCloseMobile();
    // Navigate FIRST — don't wait for async signOut to prevent white screen
    navigate('/login', { replace: true });
    signOut();
  };

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-0 bottom-0 z-50 w-[260px] bg-sidebar-bg flex flex-col overflow-y-auto overflow-x-hidden',
          'rtl:right-0 ltr:left-0',
          'lg:relative lg:z-auto lg:!translate-x-0 lg:flex',
          'lg:transition-none transition-transform duration-200 ease-out',
          mobileSidebarOpen
            ? 'translate-x-0'
            : 'max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full',
        ].join(' ')}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4c6ef5, #3b5bdb)' }}>
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <span className="text-[13.5px] font-bold text-white tracking-wide">{t.appName}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: 'rgba(76,110,245,0.8)', background: 'rgba(76,110,245,0.12)' }}>
                  Beta
                </span>
              </div>
            </div>
          </div>
          <button
            className="lg:hidden text-sidebar-text hover:text-white transition-colors focus:outline-2 focus:outline-white/50 rounded-lg"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={onCloseMobile}
              className={({ isActive }: { isActive: boolean }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={17} />
              <span>{t.nav[item.key]}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2.5 mb-2">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #334155, #1e293b)' }}>
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold truncate" style={{ color: '#e2e8f0' }}>{userName}</div>
                <div className="text-[11px] truncate" style={{ color: '#94a3b8' }}>{profile?.email || ''}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => { onCloseMobile(); navigate('/dashboard/settings'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <User size={13} />
                {lang === 'ar' ? 'الملف' : 'Profile'}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={13} />
                {lang === 'ar' ? 'خروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
