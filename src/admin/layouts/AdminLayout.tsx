// ============================================================================
// SADEEM Admin — Layout
// Wraps AdminAuthProvider so it only affects admin routes.
// Does NOT touch main.tsx or subscriber's AuthProvider.
// ============================================================================

import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import { RequireAdminAuth } from '../guards';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopbar } from '../components/AdminTopbar';

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);

  return (
    <RequireAdminAuth>
      <div className="admin-shell" dir="rtl">
        <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="admin-main">
          <AdminTopbar onMenuToggle={toggleSidebar} />
          <main className="admin-content">
            <div className="admin-content-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </RequireAdminAuth>
  );
}

/**
 * AdminLayout — entry point for all /admin/* authenticated routes.
 * AdminAuthProvider is scoped here, not in main.tsx.
 */
export function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner />
    </AdminAuthProvider>
  );
}
