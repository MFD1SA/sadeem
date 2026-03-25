import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Bell,
  Menu,
  Globe,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t, toggleLanguage, lang } = useLanguage();
  const { profile, organization, signOut, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const userName = profile?.full_name || profile?.email || '';
  const sessionMeta = (session as { user?: { user_metadata?: { avatar_url?: string } } } | null)?.user?.user_metadata;
  const userAvatar = profile?.avatar_url || sessionMeta?.avatar_url || null;
  const userInitial = userName.charAt(0) || '?';
  const orgName = organization?.name || '';
  const orgIndustry = organization?.industry || '';

  const handleLogout = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Right / brand context */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-content-secondary shadow-sm transition-colors hover:bg-surface-secondary hover:text-content-primary lg:hidden"
            onClick={onMenuClick}
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-content-primary">
              {orgName}
            </div>
            <div className="truncate text-[11px] text-content-tertiary">
              {orgIndustry}
            </div>
          </div>
        </div>

        {/* Left / actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-surface-secondary/70 px-3 py-2 w-64 lg:w-72">
            <Search size={15} className="text-content-tertiary flex-shrink-0" />
            <input
              type="text"
              placeholder={t.topbar.search}
              className="w-full border-none bg-transparent text-xs text-content-primary outline-none placeholder:text-content-tertiary cursor-not-allowed"
              disabled
              title={lang === 'ar' ? 'البحث قريباً' : 'Search coming soon'}
            />
          </div>

          {/* Language */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-content-secondary shadow-sm transition-colors hover:bg-surface-secondary hover:text-content-primary"
            title={lang === 'ar' ? 'تغيير اللغة' : 'Change language'}
          >
            <Globe size={14} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'AR' : 'EN'}</span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/notifications')}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-content-secondary shadow-sm transition-colors hover:bg-surface-secondary hover:text-content-primary"
            title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          >
            <Bell size={16} />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev: boolean) => !prev)}
              className="flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-2.5 sm:px-3 shadow-sm transition-colors hover:bg-surface-secondary"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {userInitial}
                </div>
              )}

              <div className="hidden min-w-0 sm:block text-start">
                <div className="max-w-[120px] truncate text-xs font-medium text-content-primary">
                  {userName}
                </div>
              </div>

              <ChevronDown
                size={14}
                className={`text-content-tertiary transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute top-full mt-2 ltr:right-0 rtl:left-0 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="border-b border-border bg-surface-secondary/40 px-4 py-3">
                  <div className="truncate text-sm font-semibold text-content-primary">
                    {userName}
                  </div>
                  <div className="truncate text-[11px] text-content-tertiary mt-0.5">
                    {profile?.email}
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/dashboard/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-content-primary transition-colors hover:bg-surface-secondary"
                  >
                    <User size={15} />
                    {t.topbar.profile}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/dashboard/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-content-primary transition-colors hover:bg-surface-secondary"
                  >
                    <Settings size={15} />
                    {t.settingsPage?.title || 'Settings'}
                  </button>

                  <div className="my-1.5 border-t border-border" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    {t.topbar.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
