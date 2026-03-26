import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { branchesService } from '@/services/branches';
import { qrService } from '@/services/qr';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import {
  QrCode,
  Copy,
  Download,
  RefreshCw,
  Settings,
  Eye,
  MousePointerClick,
  ScanLine,
  Plus,
} from 'lucide-react';
import type { DbBranch } from '@/types/database';
import type { DbQrConfig } from '@/types/qr';
import { QrPreview } from './QrPreview';

interface BranchQr {
  branch: DbBranch;
  config: DbQrConfig | null;
}

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Request timeout'));
    }, ms);

    promise
      .then((result) => {
        window.clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export default function QrReviews() {
  const { lang } = useLanguage();
  const { organization } = useAuth();

  const [items, setItems] = useState<BranchQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showSetup, setShowSetup] = useState(false);
  const [setupBranch, setSetupBranch] = useState<DbBranch | null>(null);
  const [setupConfig, setSetupConfig] = useState<DbQrConfig | null>(null);
  const [setupMode, setSetupMode] = useState<'direct' | 'landing'>('landing');
  const [setupGoogleUrl, setSetupGoogleUrl] = useState('');
  const [setupShowEmployee, setSetupShowEmployee] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  const [downloadConfig, setDownloadConfig] = useState<DbQrConfig | null>(null);

  const loadData = useCallback(async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [branches, configs] = await Promise.all([
        branchesService.list(organization.id),
        qrService.listByOrganization(organization.id),
      ]);

      const configMap = new Map(configs.map((c) => [c.branch_id, c]));

      setItems(
        branches
          .filter((b: DbBranch) => b.status === 'active')
          .map((branch: DbBranch) => ({
            branch,
            config: configMap.get(branch.id) || null,
          }))
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load QR data');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openSetup = (branch: DbBranch, config: DbQrConfig | null) => {
    setSetupBranch(branch);
    setSetupConfig(config);
    setSetupMode(config?.mode || 'landing');
    setSetupGoogleUrl(config?.google_review_url || '');
    setSetupShowEmployee(config?.show_employee_field ?? true);
    setSetupMessage(config?.custom_message || '');
    setSetupError('');
    setSetupSuccess('');
    setShowSetup(true);
  };

  const closeSetup = () => {
    if (saving) return;
    setShowSetup(false);
    setSetupBranch(null);
    setSetupConfig(null);
    setSetupError('');
    setSetupSuccess('');
  };

  const handleSaveSetup = async () => {
    if (!organization || !setupBranch) return;

    setSaving(true);
    setSetupError('');
    setSetupSuccess('');

    try {
      if (!setupGoogleUrl.trim()) {
        throw new Error(
          lang === 'ar'
            ? 'يرجى إدخال رابط تقييم Google'
            : 'Please enter the Google review URL'
        );
      }

      const payload = {
        mode: setupMode,
        google_review_url: setupGoogleUrl.trim(),
        show_employee_field: setupShowEmployee,
        custom_message: setupMessage.trim() || null,
      };

      if (setupConfig) {
        await withTimeout(qrService.update(setupConfig.id, payload), 12000);
      } else {
        await withTimeout(
          qrService.create({
            branch_id: setupBranch.id,
            organization_id: organization.id,
            mode: setupMode,
            google_review_url: setupGoogleUrl.trim(),
            branchName: setupBranch.internal_name,
            show_employee_field: setupShowEmployee,
            custom_message: setupMessage.trim() || undefined,
          }),
          12000
        );
      }

      setSetupSuccess(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
      setShowSetup(false);
      void loadData();
    } catch (err: unknown) {
      const msg =
        (err as Error).message === 'Request timeout'
          ? lang === 'ar'
            ? 'انتهت مهلة الحفظ. تحقق من الجدول أو الصلاحيات ثم حاول مرة أخرى.'
            : 'Save timed out. Check table/policies and try again.'
          : (err as Error).message || (lang === 'ar' ? 'فشل الحفظ' : 'Save failed');

      setSetupError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (config: DbQrConfig, branchName: string) => {
    try {
      await withTimeout(qrService.regenerateSlug(config.id, branchName), 12000);
      await loadData();
    } catch {}
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  };

  if (loading) {
    return (
      <LoadingState
        message={lang === 'ar' ? 'جاري تحميل QR التقييمات...' : 'Loading Review QR...'}
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // Computed stats
  const configuredItems = items.filter((i) => i.config !== null);
  const unconfiguredItems = items.filter((i) => i.config === null);
  const totalScans = configuredItems.reduce((sum, i) => sum + (i.config?.scan_count ?? 0), 0);
  const totalClicks = configuredItems.reduce((sum, i) => sum + (i.config?.click_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-content-primary">
            {lang === 'ar' ? 'QR التقييمات' : 'Review QR'}
          </h2>
          <p className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar'
              ? 'أنشئ رموز QR لجمع التقييمات من الفروع'
              : 'Generate QR codes to collect reviews at branches'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            message={
              lang === 'ar'
                ? 'لا توجد فروع نشطة. أضف فروعاً من صفحة الفروع.'
                : 'No active branches. Add branches first.'
            }
            icon={<QrCode size={44} strokeWidth={1} className="text-gray-200" />}
          />
        </div>
      ) : (
        <>
          {/* Stats summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {lang === 'ar' ? 'رموز مُعدَّة' : 'QR Configured'}
                </p>
                <p className="text-2xl font-bold text-content-primary leading-none">
                  {configuredItems.length}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {lang === 'ar' ? `من ${items.length} فرع` : `of ${items.length} branches`}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {lang === 'ar' ? 'إجمالي المسح' : 'Total Scans'}
                </p>
                <p className="text-2xl font-bold text-content-primary leading-none">
                  {totalScans.toLocaleString()}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {lang === 'ar' ? 'عبر جميع الفروع' : 'across all branches'}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {lang === 'ar' ? 'إجمالي النقرات' : 'Total Clicks'}
                </p>
                <p className="text-2xl font-bold text-content-primary leading-none">
                  {totalClicks.toLocaleString()}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {lang === 'ar' ? 'عبر جميع الفروع' : 'across all branches'}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {lang === 'ar' ? 'فروع بدون QR' : 'Without QR'}
                </p>
                <p className="text-2xl font-bold text-amber-500 leading-none">
                  {unconfiguredItems.length}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {lang === 'ar' ? 'لم تُعدَّ بعد' : 'not configured yet'}
                </p>
              </div>
            </div>
          </div>

          {/* QR cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {items.map(({ branch, config }: BranchQr) => {
              const qrUrl = config ? qrService.getQrUrl(config) : null;
              const landingUrl = config ? qrService.getLandingUrl(config.slug) : null;

              if (!config) {
                // Not-configured state: dashed border card
                return (
                  <div
                    key={branch.id}
                    className="rounded-xl border-2 border-dashed border-border bg-surface-secondary/30 p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[200px] hover:border-brand-400 hover:bg-brand-50/20 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-surface-secondary flex items-center justify-center">
                      <QrCode size={26} className="text-content-tertiary/50" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-content-primary">
                        {branch.internal_name}
                      </p>
                      {branch.city && (
                        <p className="text-xs text-content-tertiary mt-0.5">{branch.city}</p>
                      )}
                    </div>
                    <p className="text-xs text-content-tertiary max-w-[200px]">
                      {lang === 'ar'
                        ? 'لم يتم إنشاء رمز QR لهذا الفرع بعد'
                        : 'No QR code generated for this branch yet'}
                    </p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openSetup(branch, null)}
                    >
                      <Plus size={13} />
                      {lang === 'ar' ? 'إنشاء QR' : 'Generate QR'}
                    </button>
                  </div>
                );
              }

              return (
                <div key={branch.id} className="card">
                  <div className="card-body">
                    {/* Top section: QR preview + branch info */}
                    <div className="flex gap-5 mb-4">
                      {/* Large QR preview */}
                      <div className="flex-shrink-0">
                        <div className="w-40 h-40 bg-white border border-border/60 rounded-xl p-2.5 flex items-center justify-center shadow-sm">
                          <QrPreview url={qrUrl!} size={136} />
                        </div>
                      </div>

                      {/* Branch info + stats */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-content-primary leading-snug">
                          {branch.internal_name}
                        </h3>
                        {branch.city && (
                          <p className="text-xs text-content-tertiary mt-0.5 mb-2">{branch.city}</p>
                        )}

                        <div className="mb-3">
                          <Badge variant={config.mode === 'landing' ? 'info' : 'success'}>
                            {config.mode === 'landing'
                              ? lang === 'ar' ? 'صفحة هبوط' : 'Landing Page'
                              : lang === 'ar' ? 'Google مباشر' : 'Google Direct'}
                          </Badge>
                        </div>

                        {/* Big stat numbers */}
                        <div className="flex gap-5">
                          <div>
                            <div className="flex items-center gap-1 text-content-tertiary mb-0.5">
                              <ScanLine size={12} />
                              <span className="text-2xs uppercase tracking-wide">
                                {lang === 'ar' ? 'مسح' : 'Scans'}
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-content-primary leading-none">
                              {config.scan_count.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-px bg-border/60" />
                          <div>
                            <div className="flex items-center gap-1 text-content-tertiary mb-0.5">
                              <MousePointerClick size={12} />
                              <span className="text-2xs uppercase tracking-wide">
                                {lang === 'ar' ? 'نقرات' : 'Clicks'}
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-content-primary leading-none">
                              {config.click_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Landing URL copy row */}
                    <div className="flex items-center gap-2 mb-4 bg-surface-secondary rounded-lg px-3 py-2">
                      <code className="flex-1 text-2xs text-content-tertiary truncate" dir="ltr">
                        {landingUrl}
                      </code>
                      <button
                        className="btn-icon w-7 h-7 flex-shrink-0"
                        title={lang === 'ar' ? 'نسخ الرابط' : 'Copy link'}
                        onClick={() => copyLink(qrUrl || '')}
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setDownloadConfig(config)}
                      >
                        <Download size={12} />
                        {lang === 'ar' ? 'تنزيل' : 'Download'}
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openSetup(branch, config)}
                      >
                        <Settings size={12} />
                        {lang === 'ar' ? 'إعدادات' : 'Settings'}
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRegenerate(config, branch.internal_name)}
                      >
                        <RefreshCw size={12} />
                        {lang === 'ar' ? 'تجديد' : 'Regenerate'}
                      </button>

                      {config.mode === 'landing' && (
                        <a
                          href={landingUrl || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={12} />
                          {lang === 'ar' ? 'معاينة' : 'Preview'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Setup modal — unchanged */}
      {showSetup && setupBranch && (
        <Modal
          title={
            lang === 'ar'
              ? `إعداد QR — ${setupBranch.internal_name}`
              : `QR Setup — ${setupBranch.internal_name}`
          }
          onClose={closeSetup}
          footer={
            <>
              <button className="btn btn-primary" onClick={handleSaveSetup} disabled={saving}>
                {saving
                  ? lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'
                  : lang === 'ar' ? 'حفظ' : 'Save'}
              </button>
              <button className="btn btn-secondary" onClick={closeSetup} disabled={saving}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {setupError && (
              <div className="text-xs rounded-md p-3 bg-red-50 text-red-700 border border-red-200">
                {setupError}
              </div>
            )}

            {setupSuccess && (
              <div className="text-xs rounded-md p-3 bg-emerald-50 text-emerald-700 border border-emerald-200">
                {setupSuccess}
              </div>
            )}

            <div>
              <label className="form-label">{lang === 'ar' ? 'وضع QR' : 'QR Mode'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSetupMode('landing')}
                  className={`p-3 rounded-lg border text-start transition-colors ${
                    setupMode === 'landing'
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                      : 'border-border hover:bg-surface-secondary'
                  }`}
                >
                  <div className="text-[13px] font-medium text-content-primary mb-0.5">
                    {lang === 'ar' ? 'صفحة هبوط ذكية' : 'Smart Landing Page'}
                  </div>
                  <div className="text-2xs text-content-tertiary">
                    {lang === 'ar'
                      ? 'صفحة مخصصة تشجع العميل على التقييم'
                      : 'Branded page encouraging reviews'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupMode('direct')}
                  className={`p-3 rounded-lg border text-start transition-colors ${
                    setupMode === 'direct'
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                      : 'border-border hover:bg-surface-secondary'
                  }`}
                >
                  <div className="text-[13px] font-medium text-content-primary mb-0.5">
                    {lang === 'ar' ? 'Google مباشر' : 'Google Direct'}
                  </div>
                  <div className="text-2xs text-content-tertiary">
                    {lang === 'ar'
                      ? 'يفتح صفحة تقييم Google مباشرة'
                      : 'Opens Google review page directly'}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">
                {lang === 'ar' ? 'رابط تقييم Google' : 'Google Review URL'}
              </label>
              <input
                className="form-input text-xs"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={setupGoogleUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSetupGoogleUrl(e.target.value)}
                dir="ltr"
              />
              <p className="text-2xs text-content-tertiary mt-1">
                {lang === 'ar'
                  ? 'رابط التقييم من Google Business Profile'
                  : 'Review link from Google Business Profile'}
              </p>
            </div>

            {setupMode === 'landing' && (
              <>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-[13px] font-medium text-content-primary">
                      {lang === 'ar' ? 'حقل اسم الموظف' : 'Employee Name Field'}
                    </div>
                    <div className="text-2xs text-content-tertiary">
                      {lang === 'ar'
                        ? 'يظهر حقل اختياري لإدخال اسم الموظف'
                        : 'Shows optional field for employee name'}
                    </div>
                  </div>
                  <Toggle value={setupShowEmployee} onChange={setSetupShowEmployee} />
                </div>

                <div className="rounded-lg border border-border bg-surface-secondary/40 p-3">
                  <div className="text-xs font-medium text-content-primary mb-2">
                    {lang === 'ar' ? 'معاينة منطق الصفحة' : 'Landing Page Preview Logic'}
                  </div>

                  {setupShowEmployee ? (
                    <div className="text-2xs text-content-tertiary">
                      {lang === 'ar'
                        ? 'سيظهر للعميل حقل اختياري لإدخال اسم الموظف.'
                        : 'An optional employee-name field will be shown to customers.'}
                    </div>
                  ) : (
                    <div className="text-2xs text-content-tertiary">
                      {lang === 'ar'
                        ? 'لن يظهر حقل اسم الموظف للعميل.'
                        : 'The employee-name field will be hidden from customers.'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    {lang === 'ar' ? 'رسالة مخصصة (اختياري)' : 'Custom Message (optional)'}
                  </label>
                  <textarea
                    className="form-textarea text-xs"
                    rows={2}
                    placeholder={
                      lang === 'ar'
                        ? 'مثال: شكراً لزيارتكم! رأيكم يهمنا.'
                        : 'e.g. Thank you for visiting! Your feedback matters.'
                    }
                    value={setupMessage}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setSetupMessage(e.target.value)
                    }
                  />
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Download modal — unchanged */}
      {downloadConfig && (
        <Modal
          title={lang === 'ar' ? 'تنزيل QR' : 'Download QR'}
          onClose={() => setDownloadConfig(null)}
        >
          <div className="flex flex-col items-center py-4">
            <div className="bg-white border border-border/60 rounded-xl p-4 mb-4">
              <QrPreview url={qrService.getQrUrl(downloadConfig)} size={240} />
            </div>

            <div className="text-2xs text-content-tertiary mb-4 text-center">
              {lang === 'ar'
                ? 'أحجام الطباعة المقترحة: بطاقة طاولة (8×8 سم) • ملصق جداري (15×15 سم) • حامل كاونتر (10×10 سم)'
                : 'Suggested print sizes: Table card (8×8cm) • Wall sticker (15×15cm) • Counter stand (10×10cm)'}
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => void downloadQrImage(downloadConfig, 'png')}
              >
                <Download size={12} /> PNG
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => void downloadQrImage(downloadConfig, 'svg')}
              >
                <Download size={12} /> SVG
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => void downloadQrImage(downloadConfig, 'png-hd')}
              >
                <Download size={12} /> {lang === 'ar' ? 'HD عالي الدقة' : 'HD Print'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

async function downloadQrImage(
  config: DbQrConfig,
  format: 'png' | 'svg' | 'png-hd'
) {
  const url = qrService.getQrUrl(config);
  const size = format === 'png-hd' ? 1024 : 512;

  if (format === 'svg') {
    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
    });

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `qr-${config.slug}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
    return;
  }

  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#111111',
      light: '#FFFFFF',
    },
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `qr-${config.slug}${format === 'png-hd' ? '-hd' : ''}.png`;
  link.click();
}
