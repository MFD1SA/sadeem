import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { branchesService } from '@/services/branches';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusDot } from '@/components/ui/StatusDot';
import { Modal } from '@/components/ui/Modal';
import { useBranchLimit } from '@/components/ui/FeatureGate';
import { Plus, Edit3, Trash2, Lock } from 'lucide-react';
import type { DbBranch } from '@/types/database';

export default function Branches() {
  const { t, lang } = useLanguage();
  const { organization, isLoading: authLoading } = useAuth();
  const {
    canAdd: canAddBranch,
    max: maxBranches,
    showUpgrade,
  } = useBranchLimit();

  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limitWarning, setLimitWarning] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<DbBranch | null>(null);
  const [formData, setFormData] = useState({
    internal_name: '',
    google_name: '',
    city: '',
    address: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const loadBranches = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    setError('');

    try {
      const data = await branchesService.list(organization.id);
      setBranches(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!organization?.id) { setLoading(false); return; }
    void loadBranches();
  }, [authLoading, organization?.id, loadBranches]);

  const openCreate = () => {
    if (!canAddBranch) {
      setLimitWarning(true);
      return;
    }

    setEditBranch(null);
    setFormData({
      internal_name: '',
      google_name: '',
      city: '',
      address: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const openEdit = (branch: DbBranch) => {
    setEditBranch(branch);
    setFormData({
      internal_name: branch.internal_name,
      google_name: branch.google_name || '',
      city: branch.city || '',
      address: branch.address || '',
      status: branch.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!organization?.id || !formData.internal_name.trim()) return;

    setSaving(true);
    setError('');

    try {
      if (editBranch) {
        await branchesService.update(editBranch.id, {
          internal_name: formData.internal_name,
          google_name: formData.google_name || null,
          city: formData.city || null,
          address: formData.address || null,
          status: formData.status as DbBranch['status'],
        });
      } else {
        await branchesService.create({
          organization_id: organization.id,
          internal_name: formData.internal_name,
          google_name: formData.google_name || undefined,
          city: formData.city || undefined,
          address: formData.address || undefined,
          status: formData.status,
        });
      }

      setShowModal(false);
      await loadBranches();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (
      !confirm(
        lang === 'ar'
          ? 'هل أنت متأكد من حذف هذا الفرع؟'
          : 'Are you sure you want to delete this branch?'
      )
    ) {
      return;
    }

    try {
      await branchesService.remove(branchId);
      await loadBranches();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to delete branch');
    }
  };

  if (authLoading || loading) {
    return <LoadingState message={t.common.loading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadBranches} />;
  }

  return (
    <div>
      {limitWarning && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-content-primary">
                {lang === 'ar'
                  ? `وصلت إلى الحد الأقصى (${maxBranches === -1 ? '∞' : maxBranches} ${
                      maxBranches === 1 ? 'فرع' : 'فروع'
                    })`
                  : `Branch limit reached (${maxBranches === -1 ? '∞' : maxBranches} max)`}
              </div>
              <div className="text-xs text-content-tertiary">
                {lang === 'ar'
                  ? 'قم بترقية خطتك لإضافة المزيد من الفروع'
                  : 'Upgrade your plan to add more branches'}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={showUpgrade}>
              {lang === 'ar' ? 'ترقية' : 'Upgrade'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setLimitWarning(false)}
            >
              {lang === 'ar' ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3>
              {t.branchesPage.title} ({branches.length})
            </h3>
            {maxBranches > 0 && (
              <span className="text-2xs text-content-tertiary">
                / {maxBranches === -1 ? '∞' : maxBranches}
              </span>
            )}
          </div>

          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> {t.branchesPage.addBranch}
          </button>
        </div>

        {branches.length === 0 ? (
          <EmptyState
            message={
              lang === 'ar'
                ? 'لا توجد فروع بعد. أضف أول فرع.'
                : 'No branches yet. Add your first branch.'
            }
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} /> {t.branchesPage.addBranch}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-right rtl:text-right ltr:text-left px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">
                    {t.branchesPage.internalName}
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">
                    {t.branchesPage.googleName}
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">
                    {t.branchesPage.city}
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">
                    {t.branchesPage.address}
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">
                    {t.branchesPage.status}
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border w-24"></th>
                </tr>
              </thead>

              <tbody>
                {branches.map((b: DbBranch) => (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{b.internal_name}</td>
                    <td className="px-4 py-3 text-xs text-content-secondary">
                      {b.google_name || '—'}
                    </td>
                    <td className="px-4 py-3">{b.city || '—'}</td>
                    <td className="px-4 py-3 text-xs text-content-secondary">
                      {b.address || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusDot
                          color={
                            b.status === 'active'
                              ? 'green'
                              : b.status === 'pending'
                                ? 'yellow'
                                : 'gray'
                          }
                        />
                        <span className="text-xs">{t.status[b.status]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="btn-icon"
                          title={t.common.edit}
                          onClick={() => openEdit(b)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          title={t.common.delete}
                          onClick={() => handleDelete(b.id)}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={
            editBranch
              ? lang === 'ar'
                ? 'تعديل الفرع'
                : 'Edit Branch'
              : t.branchesPage.addBranch
          }
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !formData.internal_name.trim()}
              >
                {saving ? t.common.loading : t.common.save}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                {t.common.cancel}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="form-label">{t.branchesPage.internalName} *</label>
              <input
                className="form-input"
                value={formData.internal_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, internal_name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="form-label">{t.branchesPage.googleName}</label>
              <input
                className="form-input"
                value={formData.google_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, google_name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t.branchesPage.city}</label>
                <input
                  className="form-input"
                  value={formData.city}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="form-label">{t.branchesPage.status}</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="active">{t.status.active}</option>
                  <option value="inactive">{t.status.inactive}</option>
                  <option value="pending">{t.status.pending}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">{t.branchesPage.address}</label>
              <input
                className="form-input"
                value={formData.address}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
