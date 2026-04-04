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
  const { lang, t } = useLanguage();
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
        throw new Error(t.qrPage.enterGoogleUrl);
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

      setSetupSuccess(t.qrPage.savedSuccessfully);
      setShowSetup(false);
      void loadData();
    } catch (err: unknown) {
      const msg =
        (err as Error).message === 'Request timeout'
          ? t.qrPage.saveTimeout
          : (err as Error).message || t.qrPage.saveFailed;

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
        message={t.qrPage.loadingQr}
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
            {t.qrPage.title}
          </h2>
          <p className="text-xs text-content-tertiary mt-0.5">
            {t.qrPage.subtitle}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            message={t.qrPage.noBranches}
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
                  {t.qrPage.qrConfigured}
                </p>
                <p className="text-2xl font-bold text-content-primary leading-none">
                  {configuredItems.length}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {`${items.length} ${t.qrPage.ofBranches}`}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {t.qrPage.totalScans}
                </p>
                <p className="text-2xl font-bold text-content-primary leading-none">
                  {totalScans.toLocaleString()}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {t.qrPage.acrossAllBranches}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {t.qrPage.totalClicks}
                </p>
                <p className="text-2xl font-bold text-content-primary leading-none">
                  {totalClicks.toLocaleString()}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {t.qrPage.acrossAllBranches}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body py-3 px-4">
                <p className="text-2xs text-content-tertiary uppercase tracking-wider mb-1">
                  {t.qrPage.withoutQr}
                </p>
                <p className="text-2xl font-bold text-amber-500 leading-none">
                  {unconfiguredItems.length}
                </p>
                <p className="text-2xs text-content-tertiary mt-1">
                  {t.qrPage.notConfiguredYet}
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
                      {t.qrPage.noQrYet}
                    </p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openSetup(branch, null)}
                    >
                      <Plus size={13} />
                      {t.qrPage.generateQr}
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
                              ? t.qrPage.landingPage
                              : t.qrPage.googleDirect}
                          </Badge>
                        </div>

                        {/* Big stat numbers */}
                        <div className="flex gap-5">
                          <div>
                            <div className="flex items-center gap-1 text-content-tertiary mb-0.5">
                              <ScanLine size={12} />
                              <span className="text-2xs uppercase tracking-wide">
                                {t.qrPage.scanLabel}
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
                                {t.qrPage.clicksLabel}
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
                        title={t.qrPage.copyLink}
                        aria-label={t.qrPage.copyLink}
                        onClick={() => copyLink(landingUrl || '')}
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
                        {t.qrPage.download}
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openSetup(branch, config)}
                      >
                        <Settings size={12} />
                        {t.qrPage.settings}
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRegenerate(config, branch.internal_name)}
                      >
                        <RefreshCw size={12} />
                        {t.qrPage.regenerate}
                      </button>

                      {config.mode === 'landing' && (
                        <a
                          href={landingUrl || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={12} />
                          {t.qrPage.preview}
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
          title={`${t.qrPage.qrSetup} — ${setupBranch.internal_name}`}
          onClose={closeSetup}
          footer={
            <>
              <button className="btn btn-primary" onClick={handleSaveSetup} disabled={saving}>
                {saving ? t.qrPage.saving : t.common.save}
              </button>
              <button className="btn btn-secondary" onClick={closeSetup} disabled={saving}>
                {t.common.cancel}
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
              <label className="form-label" id="qr-mode-label">{t.qrPage.qrMode}</label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="qr-mode-label">
                <button
                  type="button"
                  onClick={() => setSetupMode('landing')}
                  role="radio"
                  aria-checked={setupMode === 'landing'}
                  className={`p-3 rounded-lg border text-start transition-colors ${
                    setupMode === 'landing'
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                      : 'border-border hover:bg-surface-secondary'
                  }`}
                >
                  <div className="text-[13px] font-medium text-content-primary mb-0.5">
                    {t.qrPage.smartLanding}
                  </div>
                  <div className="text-2xs text-content-tertiary">
                    {t.qrPage.smartLandingDesc}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupMode('direct')}
                  role="radio"
                  aria-checked={setupMode === 'direct'}
                  className={`p-3 rounded-lg border text-start transition-colors ${
                    setupMode === 'direct'
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                      : 'border-border hover:bg-surface-secondary'
                  }`}
                >
                  <div className="text-[13px] font-medium text-content-primary mb-0.5">
                    {t.qrPage.googleDirect}
                  </div>
                  <div className="text-2xs text-content-tertiary">
                    {t.qrPage.googleDirectDesc}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="qr-google-url" className="form-label">
                {t.qrPage.googleReviewUrl}
              </label>
              <input
                id="qr-google-url"
                className="form-input text-xs"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={setupGoogleUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSetupGoogleUrl(e.target.value)}
                dir="ltr"
              />
              <p className="text-2xs text-content-tertiary mt-1">
                {t.qrPage.googleReviewUrlPlaceholder}
              </p>
            </div>

            {setupMode === 'landing' && (
              <>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-[13px] font-medium text-content-primary">
                      {t.qrPage.employeeNameField}
                    </div>
                    <div className="text-2xs text-content-tertiary">
                      {t.qrPage.employeeNameFieldDesc}
                    </div>
                  </div>
                  <Toggle value={setupShowEmployee} onChange={setSetupShowEmployee} />
                </div>

                <div className="rounded-lg border border-border bg-surface-secondary/40 p-3">
                  <div className="text-xs font-medium text-content-primary mb-2">
                    {t.qrPage.landingPreviewLogic}
                  </div>

                  <div className="text-2xs text-content-tertiary">
                    {setupShowEmployee ? t.qrPage.employeeFieldShown : t.qrPage.employeeFieldHidden}
                  </div>
                </div>

                <div>
                  <label htmlFor="qr-custom-message" className="form-label">
                    {t.qrPage.customMessage}
                  </label>
                  <textarea
                    id="qr-custom-message"
                    className="form-textarea text-xs"
                    rows={2}
                    placeholder={t.qrPage.customMessagePlaceholder}
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
          title={t.qrPage.downloadQrTitle}
          onClose={() => setDownloadConfig(null)}
        >
          <div className="flex flex-col items-center py-4">
            <div className="bg-white border border-border/60 rounded-xl p-4 mb-4">
              <QrPreview url={qrService.getQrUrl(downloadConfig)} size={240} />
            </div>

            <div className="text-2xs text-content-tertiary mb-4 text-center">
              {t.qrPage.suggestedPrintSizes}
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
                <Download size={12} /> {t.qrPage.hdPrint}
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
