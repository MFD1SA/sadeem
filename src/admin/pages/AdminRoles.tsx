// ============================================================================
// SENDA Admin — Roles & Permissions Page (Phase 3)
// View roles, view/edit permissions per role — all via RPCs.
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminRolesService } from '../services/adminRoles.service';
import { PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import type { AdminRole, AdminPermission } from '../types';
import { ShieldCheck, Users, ChevronLeft, Lock, Save, Check } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  admin_users: 'إدارة المشرفين',
  roles: 'الأدوار والصلاحيات',
  subscribers: 'المشتركين',
  settings: 'الإعدادات',
  audit_logs: 'سجل العمليات',
  dashboard: 'لوحة التحكم',
  finance: 'الشؤون المالية',
  support: 'الدعم الفني',
};

function groupByModule(perms: AdminPermission[]): Record<string, AdminPermission[]> {
  const g: Record<string, AdminPermission[]> = {};
  perms.forEach((p) => { if (!g[p.module]) g[p.module] = []; g[p.module].push(p); });
  return g;
}

export default function AdminRoles() {
  const { hasPermission, user: currentUser } = useAdminAuth();
  const canEdit = hasPermission(PERMISSIONS.ROLES_UPDATE);

  useEffect(() => { document.title = 'سيندا — الأدوار والصلاحيات'; }, []);

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Detail / Edit state
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [rolePerms, setRolePerms] = useState<AdminPermission[]>([]);
  const [allPerms, setAllPerms] = useState<AdminPermission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rolesData, counts] = await Promise.all([
        adminRolesService.listRoles(),
        adminRolesService.getRoleUserCounts(),
      ]);
      setRoles(rolesData);
      setUserCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const viewRole = async (role: AdminRole) => {
    setDetailLoading(true);
    setError('');
    try {
      const [roleData, allPermsData] = await Promise.all([
        adminRolesService.getRoleWithPermissions(role.id),
        adminRolesService.listAllPermissions(),
      ]);

      setSelectedRole(role);
      setRolePerms(roleData?.permissions ?? []);
      setAllPerms(allPermsData);
      setSelectedPermIds(new Set((roleData?.permissions ?? []).map((p) => p.id)));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب الصلاحيات');
    } finally {
      setDetailLoading(false);
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const toggleModule = (modulePerms: AdminPermission[]) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      const allSelected = modulePerms.every((p) => next.has(p.id));
      if (allSelected) {
        modulePerms.forEach((p) => next.delete(p.id));
      } else {
        modulePerms.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await adminRolesService.updateRolePermissions(
        selectedRole.id,
        Array.from(selectedPermIds)
      );
      showMsg('تم تحديث الصلاحيات بنجاح', 'success');
      // Refresh
      const updated = await adminRolesService.getRoleWithPermissions(selectedRole.id);
      setRolePerms(updated?.permissions ?? []);
      setSelectedPermIds(new Set((updated?.permissions ?? []).map((p) => p.id)));
      setIsEditing(false);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل في حفظ الصلاحيات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedPermIds(new Set(rolePerms.map((p) => p.id)));
    setIsEditing(false);
  };

  const isSuperAdminRole = selectedRole?.name === 'super_admin';
  const isSystemRole = selectedRole?.is_system ?? false;
  const canEditThisRole = canEdit && !isSuperAdminRole && (currentUser?.is_super_admin || !isSystemRole);

  // ─── Back to list ───
  const goBack = () => {
    setSelectedRole(null);
    setIsEditing(false);
    setError('');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {selectedRole && (
            <button onClick={goBack}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              {selectedRole ? selectedRole.display_name_ar : 'الأدوار والصلاحيات'}
            </h1>
            <p className="text-sm text-slate-400">
              {selectedRole
                ? (isEditing ? 'تعديل صلاحيات الدور' : `صلاحيات دور "${selectedRole.display_name_ar}"`)
                : 'إدارة أدوار المشرفين وصلاحياتهم'}
            </p>
          </div>
        </div>

        {/* Edit / Save buttons */}
        {selectedRole && !isEditing && canEditThisRole && (
          <button onClick={() => setIsEditing(true)} className="admin-btn-primary text-sm">
            تعديل الصلاحيات
          </button>
        )}
        {selectedRole && isEditing && (
          <div className="flex items-center gap-2">
            <button onClick={handleCancelEdit} className="admin-btn-secondary text-sm">إلغاء</button>
            <button onClick={handleSavePermissions} disabled={saving} className="admin-btn-primary text-sm">
              <Save size={14} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {msg && (
        <div className={`text-xs rounded-lg p-3 mb-4 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>{msg.text}</div>
      )}

      {isLoading || detailLoading ? (
        <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button onClick={() => { setError(''); selectedRole ? viewRole(selectedRole) : loadData(); }}
            className="admin-btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : selectedRole ? (
        /* ─── Permission Detail / Edit View ─── */
        <div className="space-y-4">
          {/* Role info */}
          <div className="admin-card">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <ShieldCheck size={24} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">{selectedRole.display_name_ar}</h2>
                <p className="text-xs text-slate-500">{selectedRole.display_name_en}</p>
              </div>
              <div className="flex items-center gap-3">
                {isSuperAdminRole && (
                  <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-medium">
                    محمي
                  </span>
                )}
                {isSystemRole && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                    نظامي
                  </span>
                )}
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{isEditing ? selectedPermIds.size : rolePerms.length}</div>
                  <div className="text-xs text-slate-500">صلاحية</div>
                </div>
              </div>
            </div>
          </div>

          {isSuperAdminRole && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg p-3">
              دور المدير العام (Super Admin) يملك جميع الصلاحيات تلقائيًا ولا يمكن تعديل صلاحياته.
            </div>
          )}

          {/* Permissions grouped */}
          {Object.entries(groupByModule(isEditing ? allPerms : rolePerms)).map(([module, perms]) => {
            const moduleSelected = isEditing
              ? perms.filter((p) => selectedPermIds.has(p.id)).length
              : perms.length;
            const allModuleSelected = isEditing && perms.every((p) => selectedPermIds.has(p.id));

            return (
              <div key={module} className="admin-card">
                <div className="admin-card-header">
                  <div className="flex items-center gap-3">
                    {isEditing && (
                      <button
                        onClick={() => toggleModule(perms)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          allModuleSelected
                            ? 'bg-cyan-500 border-cyan-500'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {allModuleSelected && <Check size={12} className="text-white" />}
                      </button>
                    )}
                    <h3>{MODULE_LABELS[module] || module}</h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    {moduleSelected}{isEditing ? `/${perms.length}` : ''} صلاحية
                  </span>
                </div>
                <div className="admin-card-body">
                  <div className="space-y-1">
                    {perms.map((perm) => {
                      const isSelected = selectedPermIds.has(perm.id);
                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
                            isEditing ? 'cursor-pointer hover:bg-white/[0.03]' : 'bg-white/[0.02]'
                          }`}
                          onClick={isEditing ? () => togglePerm(perm.id) : undefined}
                        >
                          {isEditing ? (
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                              isSelected
                                ? 'bg-cyan-500 border-cyan-500'
                                : 'border-slate-600'
                            }`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                          ) : (
                            <Lock size={14} className="text-cyan-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">{perm.display_name_ar}</div>
                            <div className="text-xs text-slate-500" dir="ltr">{perm.key}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {!isEditing && rolePerms.length === 0 && !isSuperAdminRole && (
            <div className="admin-card">
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">هذا الدور ليس لديه صلاحيات مُعيّنة</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── Roles Grid ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => viewRole(role)}
              className="admin-card group hover:border-cyan-500/20 transition-colors text-right w-full"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{role.display_name_ar}</h3>
                    <p className="text-xs text-slate-500">{role.display_name_en}</p>
                  </div>
                  {role.is_system && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium flex-shrink-0">
                      نظامي
                    </span>
                  )}
                </div>
                {role.description_ar && (
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{role.description_ar}</p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    <span>{userCounts[role.id] || 0} مشرف</span>
                  </div>
                  <span className="text-cyan-400/60 text-[11px]">
                    {role.is_system ? '🔒 نظامي' : `${role.id === 'super_admin' ? '∞' : ''} صلاحية`}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
