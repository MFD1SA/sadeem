// ============================================================================
// SADEEM Admin — Topbar
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES } from '../utils/constants';
import {
  Menu,
  Search,
  ChevronDown,
  UserCircle,
  Lock,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import type { BreadcrumbItem } from '../types';

interface AdminTopbarProps {
  breadcrumbs?: BreadcrumbItem[];
  onMenuToggle: () => void;
}

export function AdminTopbar({ breadcrumbs = [], onMenuToggle }: AdminTopbarProps) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle); };
  }, [showUserMenu]);

  return (
    <header className="admin-topbar" dir="rtl">
      {/* Right: menu + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu size={18} />
        </button>

        {breadcrumbs.length > 0 && (
          <nav className="hidden sm:flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronLeft size={14} className="text-slate-600" />}
                {crumb.path ? (
                  <a href={crumb.path} className="text-slate-400 hover:text-white transition-colors whitespace-nowrap">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-white font-medium whitespace-nowrap">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* Left: search + user */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="بحث سريع..."
            className="admin-search-input"
            disabled
            title="البحث قريباً"
          />
        </div>

        <div className="hidden md:block w-px h-6 bg-white/[0.08]" />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name_ar?.charAt(0) || 'م'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-white font-medium leading-tight">
                {user?.full_name_ar || 'مشرف'}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {user?.is_super_admin ? 'مدير عام' : user?.role?.display_name_ar}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 py-1.5 z-50">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="text-sm text-white font-medium">{user?.full_name_ar}</div>
                <div className="text-xs text-slate-500 mt-0.5">{user?.email}</div>
              </div>
              <div className="py-1.5">
                <button
                  onClick={() => { navigate(ADMIN_ROUTES.PROFILE); setShowUserMenu(false); }}
                  className="admin-dropdown-item"
                >
                  <UserCircle size={15} className="text-slate-500" />
                  الملف الشخصي
                </button>
                <button
                  onClick={() => { navigate(ADMIN_ROUTES.SECURITY); setShowUserMenu(false); }}
                  className="admin-dropdown-item"
                >
                  <Lock size={15} className="text-slate-500" />
                  الأمان
                </button>
              </div>
              <div className="border-t border-white/[0.06] pt-1.5">
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={15} />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
