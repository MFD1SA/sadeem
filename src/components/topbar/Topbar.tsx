import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Search, Bell, Menu, Globe, ChevronDown, LogOut, User, Settings } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t, toggleLanguage, lang } = useLanguage();
  const { profile, organization, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on route change
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  // Close dropdown on click outside (no invisible full-screen overlay)
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    // Use setTimeout to avoid closing immediately from the toggle click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const userName = profile?.full_name || profile?.email || '';
  const userAvatar = profile?.avatar_url;
  const userInitial = userName.charAt(0) || '?';
  const orgName = organization?.name || '';

  const handleLogout = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 min-h-[56px] bg-surface-primary border-b border-border flex items-center justify-between px-4 lg:px-6 gap-3 relative z-30">
      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-content-secondary hover:text-content-primary" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div>
          <div className="text-[13px] font-semibold text-content-primary leading-tight">{orgName}</div>
          <div className="text-2xs text-content-tertiary">{organization?.industry || ''}</div>
        </div>
      </div>

      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-secondary border border-border rounded-md px-3 py-1.5 w-56">
          <Search size={15} className="text-content-tertiary flex-shrink-0" />
          <input
            type="text"
            placeholder={t.topbar.search}
            className="bg-transparent border-none outline-none text-xs text-content-primary w-full placeholder:text-content-tertiary cursor-not-allowed"
            disabled
            title={lang === 'ar' ? 'البحث قريباً' : 'Search coming soon'}
          />
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-white text-xs font-medium text-content-secondary hover:bg-surface-secondary transition-colors"
        >
          <Globe size={14} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/dashboard/notifications')}
          className="relative w-8 h-8 flex items-center justify-center rounded-md border border-border bg-white text-content-secondary hover:bg-surface-secondary transition-colors"
        >
          <Bell size={16} />
        </button>

        {/* User avatar & dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu((prev: boolean) => !prev)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-secondary transition-colors"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
                {userInitial}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-medium text-content-primary">{userName}</span>
            <ChevronDown size={12} className={`text-content-tertiary transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu — NO invisible overlay blocking the page */}
          {showUserMenu && (
            <div className="absolute top-full mt-1 ltr:right-0 rtl:left-0 w-52 bg-white border border-border rounded-lg shadow-md ring-1 ring-black/5 z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* User info */}
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs font-medium text-content-primary">{userName}</div>
                <div className="text-2xs text-content-tertiary">{profile?.email}</div>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); navigate('/dashboard/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-content-primary hover:bg-surface-secondary transition-colors"
              >
                <User size={14} />
                {t.topbar.profile}
              </button>

              <button
                onClick={() => { setShowUserMenu(false); navigate('/dashboard/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-content-primary hover:bg-surface-secondary transition-colors"
              >
                <Settings size={14} />
                {t.settingsPage?.title || 'Settings'}
              </button>

              <div className="border-t border-border my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                {t.topbar.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
