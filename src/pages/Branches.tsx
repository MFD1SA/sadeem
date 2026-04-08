import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { branchesService } from '@/services/branches';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusDot } from '@/components/ui/StatusDot';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useBranchLimit } from '@/components/ui/FeatureGate';
import { Plus, Edit3, Trash2, Lock, MapPin, Link2, Unlink } from 'lucide-react';
import type { DbBranch } from '@/types/database';

let _cache: DbBranch[] | null = null;

export default function Branches() {
  const { t, lang } = useLanguage();
  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — الفروع' : 'SENDA | سيندا — Branches'; }, [lang]);
  const { organization, isLoading: authLoading } = useAuth();
  const {
    canAdd: canAddBranch,
    max: maxBranches,
    showUpgrade,
  } = useBranchLimit();

  const [branches, setBranches] = useState<DbBranch[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
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

    if (_cache === null) setLoading(true);
    setError('');

    try {
      const data = await branchesService.list(organization.id);
      _cache = data;
      setBranches(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (!organization?.id) { if (!authLoading) setLoading(false); return; }
    void loadBranches();
  }, [organization?.id, loadBranches, authLoading]);

  useEffect(() => { _cache = null; }, [organization?.id]);

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
      !confirm(t.branchesExt.confirmDelete)
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

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadBranches} />;
  }

  const activeCount = branches.filter((b) => b.status === 'active').length;
  const linkedCount = branches.filter((b) => !!b.google_name).length;
  const unlinkedCount = branches.length - linkedCount;
  const usedSlots = branches.length;
  const maxSlots = maxBranches === -1 ? null : maxBranches;
  const progressPct = maxSlots ? Math.min(100, (usedSlots / maxSlots) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Limit Warning Banner */}
      {limitWarning && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-content-primary">
                {`${t.branchesExt.limitReachedTitle} (${maxBranches === -1 ? '∞' : maxBranches} max)`}
              </div>
              <div className="text-xs text-content-tertiary">
                {t.branchesExt.upgradePlanMessage}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={showUpgrade}>
              {t.branchesExt.upgrade}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setLimitWarning(false)}>
              {t.branchesExt.dismiss}
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <MapPin size={20} className="text-brand-500" />
          {t.branchesExt.branchManagement}
        </h1>
        <p className="page-subtitle">{t.branchesExt.manageBranchesSubtitle}</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <MapPin size={16} className="text-brand-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{branches.length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.branchesExt.totalBranches}
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="text-emerald-500 text-xs font-bold">{activeCount}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{activeCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.branchesExt.activeBranches}
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Link2 size={16} className="text-green-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-green-600 leading-none">{linkedCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.branchesExt.googleLinked}
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
            <Unlink size={16} className="text-gray-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{unlinkedCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.branchesExt.notLinked}
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <h3>{t.branchesPage.title} ({branches.length})</h3>
            {maxSlots !== null && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressPct >= 90 ? 'bg-red-500' : progressPct >= 70 ? 'bg-amber-500' : 'bg-brand-600'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-2xs text-content-tertiary">{usedSlots}/{maxSlots}</span>
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> {t.branchesPage.addBranch}
          </button>
        </div>

        {branches.length === 0 ? (
          <EmptyState
            message={t.branchesExt.noBranchesYet}
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} /> {t.branchesPage.addBranch}
              </button>
            }
          />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {branches.map((b: DbBranch) => (
                <div
                  key={b.id}
                  className="card card-body flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Branch Name + City */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-content-primary truncate">
                          {b.internal_name}
                        </div>
                        {b.city && (
                          <span className="inline-block text-2xs bg-surface-secondary text-content-secondary rounded px-1.5 py-0.5 mt-1 font-medium">
                            {b.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <StatusDot
                        color={b.status === 'active' ? 'green' : b.status === 'pending' ? 'yellow' : 'gray'}
                      />
                      <span className="text-xs text-content-secondary">{(t.status as Record<string, string>)[b.status] || b.status}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Google Link Status */}
                  <div className="flex items-center gap-2">
                    {b.google_name ? (
                      <>
                        <Link2 size={13} className="text-green-500 flex-shrink-0" />
                        <span className="text-xs text-content-secondary truncate">{b.google_name}</span>
                        <Badge variant="success">
                          {t.branchesExt.connected}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Unlink size={13} className="text-content-tertiary flex-shrink-0" />
                        <span className="text-xs text-content-tertiary italic">
                          {t.branchesExt.notLinkedToGoogle}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Address */}
                  {b.address && (
                    <div className="text-xs text-content-tertiary truncate">
                      {b.address}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                    <button
                      className="btn-icon"
                      title={t.common.edit}
                      aria-label={`${t.common.edit} ${b.internal_name}`}
                      onClick={() => openEdit(b)}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      title={t.common.delete}
                      aria-label={`${t.common.delete} ${b.internal_name}`}
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editBranch ? t.branchesExt.editBranch : t.branchesPage.addBranch}
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
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {t.common.cancel}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="branch-internal-name" className="form-label">{t.branchesPage.internalName} *</label>
              <input
                id="branch-internal-name"
                className="form-input"
                value={formData.internal_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, internal_name: e.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="branch-google-name" className="form-label">{t.branchesPage.googleName}</label>
              <input
                id="branch-google-name"
                className="form-input"
                value={formData.google_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, google_name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="branch-city" className="form-label">{t.branchesPage.city}</label>
                <input
                  id="branch-city"
                  className="form-input"
                  value={formData.city}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="branch-status" className="form-label">{t.branchesPage.status}</label>
                <select
                  id="branch-status"
                  className="form-select"
                  value={formData.status}
                  aria-label={t.branchesPage.status}
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
              <label htmlFor="branch-address" className="form-label">{t.branchesPage.address}</label>
              <input
                id="branch-address"
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
