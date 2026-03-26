// ============================================================================
// SADEEM Admin — Admin Users Page (Phase 3)
// All writes go through RPCs. Permission checks happen in DB.
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminUsersService } from '../services/adminUsers.service';
import { adminRolesService } from '../services/adminRoles.service';
import { STATUS_CONFIG, PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import type { AdminUserWithRole, AdminRole } from '../types';
import {
  UsersRound, Plus, Search, MoreVertical,
  UserCheck, UserX, Trash2, X, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { AdminSelect } from '../components/AdminSelect';

export default function AdminUsers() {
  const { user: currentUser, hasPermission } = useAdminAuth();

  const [users, setUsers] = useState<AdminUserWithRole[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '', password: '', full_name_ar: '', full_name_en: '', phone: '', role_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  // Action menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Role reassignment modal
  const [roleTarget, setRoleTarget] = useState<AdminUserWithRole | null>(null);
  const [newRoleId, setNewRoleId] = useState('');
  const [assigningRole, setAssigningRole] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const [usersResult, rolesData] = await Promise.all([
        adminUsersService.list({ page: 1, pageSize: 100, search }),
        adminRolesService.listRoles(),
      ]);
      setUsers(usersResult.data);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // --- Create ---
  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name_ar || !createForm.role_id) {
      showMsg('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    setCreating(true);
    try {
      await adminUsersService.create({
        email: createForm.email,
        password: createForm.password,
        full_name_ar: createForm.full_name_ar,
        full_name_en: createForm.full_name_en || undefined,
        phone: createForm.phone || undefined,
        role_id: createForm.role_id,
      });
      showMsg('تم إنشاء المشرف بنجاح', 'success');
      setShowCreate(false);
      setCreateForm({ email: '', password: '', full_name_ar: '', full_name_en: '', phone: '', role_id: '' });
      loadData();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل الإنشاء', 'error');
    } finally {
      setCreating(false);
    }
  };

  // --- Actions ---
  const handleDeactivate = async (id: string) => {
    setActiveMenu(null);
    try {
      await adminUsersService.deactivate(id);
      showMsg('تم تعطيل المشرف', 'success');
      loadData();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل التعطيل', 'error'); }
  };

  const handleActivate = async (id: string) => {
    setActiveMenu(null);
    try {
      await adminUsersService.activate(id);
      showMsg('تم تفعيل المشرف', 'success');
      loadData();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل التفعيل', 'error'); }
  };

  const handleDelete = async (id: string, name: string) => {
    setActiveMenu(null);
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await adminUsersService.softDelete(id);
      showMsg('تم حذف المشرف', 'success');
      loadData();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل الحذف', 'error'); }
  };

  const openRoleModal = (u: AdminUserWithRole) => {
    setActiveMenu(null);
    setRoleTarget(u);
    setNewRoleId(u.role_id);
  };

  const handleAssignRole = async () => {
    if (!roleTarget || !newRoleId || newRoleId === roleTarget.role_id) return;
    setAssigningRole(true);
    try {
      await adminRolesService.assignRole(roleTarget.id, newRoleId);
      showMsg('تم تغيير الدور بنجاح', 'success');
      setRoleTarget(null);
      loadData();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل تغيير الدور', 'error');
    } finally {
      setAssigningRole(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">إدارة المشرفين</h1>
          <p className="text-sm text-slate-400">إدارة حسابات المشرفين والموظفين الداخليين</p>
        </div>
        <PermissionGate permission={PERMISSIONS.ADMIN_USERS_CREATE}>
          <button className="admin-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            <span>إضافة مشرف</span>
          </button>
        </PermissionGate>
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className={`text-xs rounded-lg p-3 mb-4 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Search */}
      <div className="admin-card mb-4">
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="admin-form-input pr-9"
            />
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {!isLoading && !error && users.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'الكل', value: users.length, color: 'slate' },
            { label: 'نشط', value: users.filter(u => u.status === 'active').length, color: 'emerald' },
            { label: 'معلّق', value: users.filter(u => u.status === 'suspended').length, color: 'amber' },
            { label: 'مدير عام', value: users.filter(u => u.is_super_admin).length, color: 'cyan' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`admin-card p-3 text-center`}>
              <div className={`text-lg font-bold text-${color}-400`}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="admin-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UsersRound size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا يوجد مشرفين حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المشرف</th>
                  <th>البريد</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>آخر دخول</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const statusInfo = STATUS_CONFIG[u.status] || STATUS_CONFIG.inactive;
                  const isSelf = u.id === currentUser?.id;
                  const canManage = hasPermission(PERMISSIONS.ADMIN_USERS_UPDATE) || hasPermission(PERMISSIONS.ADMIN_USERS_DEACTIVATE);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.full_name_ar?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">
                              {u.full_name_ar}
                              {isSelf && <span className="text-[10px] text-slate-500 mr-2">(أنت)</span>}
                            </div>
                            {u.is_super_admin && (
                              <span className="text-[10px] text-cyan-400 font-medium">Super Admin</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><span className="text-sm text-slate-300" dir="ltr">{u.email}</span></td>
                      <td><span className="text-sm text-slate-300">{u.role?.display_name_ar || '—'}</span></td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                            u.status === 'suspended' ? 'bg-amber-500/10 text-amber-400' :
                            u.status === 'pending' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-slate-500/10 text-slate-400'}`}>
                          {statusInfo.ar}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {u.last_login_at && (new Date().getTime() - new Date(u.last_login_at).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="نشط مؤخراً" />
                          )}
                          <span className="text-sm text-slate-500">
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {canManage && !isSelf && !u.is_super_admin && (
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu === u.id && (
                              <div className="absolute left-0 top-full mt-1 w-44 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl py-1.5 z-50">
                                <PermissionGate permission={PERMISSIONS.ROLES_ASSIGN}>
                                  <button
                                    onClick={() => openRoleModal(u)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                                  >
                                    <ShieldCheck size={14} /> تغيير الدور
                                  </button>
                                </PermissionGate>
                                {u.status === 'active' ? (
                                  <PermissionGate permission={PERMISSIONS.ADMIN_USERS_DEACTIVATE}>
                                    <button
                                      onClick={() => handleDeactivate(u.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                                    >
                                      <UserX size={14} /> تعطيل
                                    </button>
                                  </PermissionGate>
                                ) : (
                                  <PermissionGate permission={PERMISSIONS.ADMIN_USERS_UPDATE}>
                                    <button
                                      onClick={() => handleActivate(u.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                    >
                                      <UserCheck size={14} /> تفعيل
                                    </button>
                                  </PermissionGate>
                                )}
                                <PermissionGate permission={PERMISSIONS.ADMIN_USERS_DELETE}>
                                  <button
                                    onClick={() => handleDelete(u.id, u.full_name_ar)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 size={14} /> حذف
                                  </button>
                                </PermissionGate>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">إضافة مشرف جديد</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم بالعربي *</label>
                <input className="admin-form-input" value={createForm.full_name_ar}
                  onChange={(e) => setCreateForm((p) => ({ ...p, full_name_ar: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم بالإنجليزي</label>
                <input className="admin-form-input" dir="ltr" value={createForm.full_name_en}
                  onChange={(e) => setCreateForm((p) => ({ ...p, full_name_en: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">البريد الإلكتروني *</label>
                <input className="admin-form-input" type="email" dir="ltr" value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور *</label>
                <div className="relative">
                  <input className="admin-form-input pl-10" type={showPassword ? 'text' : 'password'}
                    value={createForm.password} minLength={8}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">8 أحرف على الأقل — سيُطلب تغييرها عند أول دخول</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">رقم الهاتف</label>
                <input className="admin-form-input" type="tel" dir="ltr" placeholder="+966..."
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">الدور *</label>
                <AdminSelect value={createForm.role_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, role_id: e.target.value }))}>
                  <option value="">اختر الدور</option>
                  {roles.filter((r) => r.name !== 'super_admin' && r.is_active).map((r) => (
                    <option key={r.id} value={r.id}>{r.display_name_ar}</option>
                  ))}
                </AdminSelect>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowCreate(false)} className="admin-btn-secondary text-sm">إلغاء</button>
              <button onClick={handleCreate} disabled={creating} className="admin-btn-primary text-sm">
                {creating ? 'جاري الإنشاء...' : 'إنشاء المشرف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Reassignment Modal */}
      {roleTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setRoleTarget(null); }}>
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">تغيير الدور</h2>
              <button onClick={() => setRoleTarget(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-white/[0.03]">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {roleTarget.full_name_ar?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{roleTarget.full_name_ar}</div>
                  <div className="text-xs text-slate-500">{roleTarget.email}</div>
                </div>
              </div>

              <div className="mb-2 text-xs text-slate-400">الدور الحالي: <span className="text-white">{roleTarget.role?.display_name_ar}</span></div>

              <label className="block text-xs font-medium text-slate-400 mb-1.5">الدور الجديد</label>
              <AdminSelect value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}>
                {roles.filter((r) => r.name !== 'super_admin' && r.is_active).map((r) => (
                  <option key={r.id} value={r.id}>{r.display_name_ar}</option>
                ))}
              </AdminSelect>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
              <button onClick={() => setRoleTarget(null)} className="admin-btn-secondary text-sm">إلغاء</button>
              <button onClick={handleAssignRole} disabled={assigningRole || newRoleId === roleTarget.role_id}
                className="admin-btn-primary text-sm">
                {assigningRole ? 'جاري التغيير...' : 'تغيير الدور'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
