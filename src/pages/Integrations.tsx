import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import {
  googleBusinessService,
  classifyGbpError,
  type GoogleLocation,
} from '@/integrations/google-business';
import { aiService } from '@/integrations/ai';
import { reviewSyncService } from '@/services/sync';
import { branchesService } from '@/services/branches';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { Modal } from '@/components/ui/Modal';
import {
  Link2,
  RefreshCw,
  Zap,
  Building2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import type { DbBranch } from '@/types/database';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryGoogleRequest<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const message = (error as Error)?.message?.toLowerCase() || '';
      const isRateLimit =
        message.includes('rate') ||
        message.includes('quota') ||
        message.includes('429') ||
        message.includes('too many requests');

      if (!isRateLimit || attempt === retries) {
        throw error;
      }

      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}

// Step number circle component
function StepCircle({
  number,
  done,
}: {
  number: number;
  done: boolean;
}) {
  if (done) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Check size={16} className="text-white" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-sm font-bold text-white leading-none">{number}</span>
    </div>
  );
}

// Connector line between steps
function StepConnector({ done }: { done: boolean }) {
  return (
    <div className="flex justify-center my-1 px-4">
      <div
        className={`w-0.5 h-5 rounded-full transition-colors ${
          done ? 'bg-emerald-400' : 'bg-border'
        }`}
      />
    </div>
  );
}

export default function Integrations() {
  const { t, lang } = useLanguage();
  useEffect(() => { document.title = lang === 'ar' ? 'سيندا — التكاملات' : 'SENDA — Integrations'; }, [lang]);
  const { organization } = useAuth();

  const [hasGoogleToken, setHasGoogleToken] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [linkedCount, setLinkedCount] = useState(0);

  // Location linking
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [linkingLocations, setLinkingLocations] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState('');

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    drafts: number;
    errors: string[];
  } | null>(null);

  // Gemini test
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState('');

  const loadStatus = useCallback(async () => {
    const token = await googleBusinessService.hasAccessToken();
    setHasGoogleToken(token);
    setGeminiConfigured(aiService.isConfigured());

    if (organization) {
      const br = await branchesService.list(organization.id);
      setBranches(br);
      setLinkedCount(br.filter((b: DbBranch) => !!b.google_location_id).length);
    }
  }, [organization]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnectGoogle = async () => {
    setLocationError('');
    setLocationSuccess('');
    try {
      await googleBusinessService.connectGoogleBusiness();
    } catch (err: unknown) {
      const classified = classifyGbpError(err, lang);
      setLocationError(classified.message);
    }
  };

  const handleFetchLocations = async () => {
    if (loadingLocations) return;

    setLoadingLocations(true);
    setLocationError('');
    setLocationSuccess('');

    try {
      const {
        data: { session },
      } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      const token = session?.provider_token;
      if (!token) {
        throw new Error(t.integrationsExt.noValidGoogleToken);
      }

      const accounts = await retryGoogleRequest(() =>
        googleBusinessService.listAccounts(token)
      );

      if (accounts.length === 0) {
        throw new Error(t.integrationsExt.noGoogleAccounts);
      }

      const allLocations: GoogleLocation[] = [];

      for (const account of accounts) {
        const locs = await retryGoogleRequest(() =>
          googleBusinessService.listLocations(token, account.name)
        );

        allLocations.push(...locs);
        await sleep(600);
      }

      if (allLocations.length === 0) {
        setLocationError(t.integrationsExt.noGoogleLocations);
        return;
      }

      setLocations(allLocations);
      setSelectedLocations(new Set());
      setShowLocationModal(true);
    } catch (err: unknown) {
      const rawMessage = (err as Error)?.message || '';
      const lower = rawMessage.toLowerCase();

      const isRateLimit =
        lower.includes('rate') ||
        lower.includes('quota') ||
        lower.includes('429') ||
        lower.includes('too many requests');

      if (isRateLimit) {
        setLocationError(t.integrationsExt.rateLimited);
      } else {
        const classified = classifyGbpError(err, lang);
        setLocationError(classified.message);
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  const toggleLocationSelection = (locationName: string) => {
    setSelectedLocations((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(locationName)) next.delete(locationName);
      else next.add(locationName);
      return next;
    });
  };

  const handleLinkSelected = async () => {
    if (!organization || selectedLocations.size === 0) return;
    setLinkingLocations(true);

    let linked = 0;
    let skipped = 0;

    for (const locName of selectedLocations) {
      const location = locations.find((l: GoogleLocation) => l.name === locName);
      if (!location) continue;

      if (branches.some((b: DbBranch) => b.google_location_id === location.name)) {
        skipped++;
        continue;
      }

      try {
        await branchesService.create({
          organization_id: organization.id,
          internal_name: location.title,
          google_name: location.title,
          google_location_id: location.name,
          city: location.storefrontAddress?.locality || '',
          address: location.storefrontAddress?.addressLines?.join(', ') || '',
          status: 'active',
        });
        linked++;
      } catch (err: unknown) {
        console.error(`Failed to link ${location.title}:`, err);
      }
    }

    await loadStatus();
    setShowLocationModal(false);
    setSelectedLocations(new Set());

    if (linked > 0) {
      const unit = linked === 1 ? t.integrationsExt.locationSingular : t.integrationsExt.locationPlural;
      let msg = t.integrationsExt.linkedSuccess
        .replace('{count}', String(linked))
        .replace('{unit}', unit)
        .replace('{s}', linked > 1 ? 's' : '');
      if (skipped > 0) {
        msg += ` (${skipped} ${t.integrationsExt.alreadyLinked})`;
      }
      setLocationSuccess(msg);
    }

    setLinkingLocations(false);
  };

  const handleSync = async () => {
    if (!organization) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await reviewSyncService.syncAndProcess(organization.id);
      setSyncResult({
        synced: result.reviewsSynced,
        drafts: result.draftsGenerated,
        errors: result.errors,
      });
    } catch (err: unknown) {
      const classified = classifyGbpError(err, lang);
      setSyncResult({ synced: 0, drafts: 0, errors: [classified.message] });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult('');
    try {
      const result = await aiService.generateReply({
        reviewText: 'الطعام ممتاز والخدمة سريعة. أنصح الجميع بزيارة هذا المطعم.',
        reviewerName: 'محمد',
        rating: 5,
        branchName: 'الفرع الرئيسي',
        organizationName: organization?.name || 'سيندا',
        language: 'ar',
      });
      setGeminiTestResult(`✓ ${result.sentiment} | ${result.reply}`);
    } catch (err: unknown) {
      setGeminiTestResult(`✗ ${(err as Error).message}`);
    } finally {
      setTestingGemini(false);
    }
  };

  const unlinkedInModal = locations.filter(
    (l: GoogleLocation) => !branches.some((b: DbBranch) => b.google_location_id === l.name)
  );

  const selectedUnlinkedCount = [...selectedLocations].filter(
    (name) => !branches.some((b: DbBranch) => b.google_location_id === name)
  ).length;

  // Step completion state
  const step1Done = hasGoogleToken;
  const step2Done = linkedCount > 0;
  const step3Done = false; // Sync is an action, never permanently "done" — handled per-result

  return (
    <div className="space-y-8">
      {/* ── Google Business section ── */}
      <div>
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-4">
          {t.integrationsPage.google}
        </h3>

        {/* Global feedback banners */}
        {locationError && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200/60 rounded-lg p-3 mb-4">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {locationSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg p-3 mb-4">
            <CheckCircle size={14} className="flex-shrink-0" />
            <span>{locationSuccess}</span>
          </div>
        )}

        {/* Numbered step flow */}
        <div className="space-y-0">
          {/* Step 1 — Connect Google Account */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-start gap-4">
                <StepCircle number={1} done={step1Done} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-[13px] font-semibold text-content-primary">
                        {t.integrationsExt.connectGoogleBusiness}
                      </p>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t.integrationsExt.connectGoogleBusinessDesc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {step1Done ? (
                        <>
                          <StatusDot color="green" />
                          <Badge variant="success">
                            {t.integrationsExt.connected}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="neutral">
                          {t.integrationsExt.notConnected}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-3">
                    {!step1Done ? (
                      <button className="btn btn-primary btn-sm" onClick={handleConnectGoogle}>
                        <ExternalLink size={13} />
                        {t.integrationsExt.connectGoogle}
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={handleConnectGoogle}>
                        <ExternalLink size={13} />
                        {t.integrationsExt.changeAccount}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <StepConnector done={step1Done} />

          {/* Step 2 — Link Locations */}
          <div className={`card transition-opacity ${!step1Done ? 'opacity-50' : ''}`}>
            <div className="card-body">
              <div className="flex items-start gap-4">
                <StepCircle number={2} done={step2Done} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-[13px] font-semibold text-content-primary">
                        {t.integrationsExt.linkLocations}
                      </p>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t.integrationsExt.linkLocationsDesc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {step2Done ? (
                        <>
                          <StatusDot color="green" />
                          <Badge variant="success">
                            {linkedCount} {t.integrationsExt.linked}
                          </Badge>
                        </>
                      ) : step1Done ? (
                        <>
                          <StatusDot color="yellow" />
                          <Badge variant="warning">
                            {t.integrationsExt.readyToLink}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="neutral">
                          {t.integrationsExt.awaitingStep1}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {step1Done && (
                    <div className="mt-3">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleFetchLocations}
                        disabled={loadingLocations}
                      >
                        {loadingLocations ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Building2 size={13} />
                        )}
                        {loadingLocations
                          ? t.common.loading
                          : t.integrationsExt.linkLocations}
                      </button>
                    </div>
                  )}

                  {/* Linked locations chips */}
                  {step2Done && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {branches
                        .filter((b: DbBranch) => b.google_location_id)
                        .map((b: DbBranch) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1 text-2xs px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md"
                          >
                            <Building2 size={10} />
                            {b.internal_name}
                            {b.city && (
                              <span className="text-emerald-500">— {b.city}</span>
                            )}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <StepConnector done={step2Done} />

          {/* Step 3 — Sync Reviews */}
          <div className={`card transition-opacity ${!step2Done ? 'opacity-50' : ''}`}>
            <div className="card-body">
              <div className="flex items-start gap-4">
                <StepCircle number={3} done={step3Done} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-[13px] font-semibold text-content-primary">
                        {t.integrationsExt.syncReviews}
                      </p>
                      <p className="text-xs text-content-tertiary mt-0.5">
                        {t.integrationsExt.syncReviewsDesc}
                      </p>
                    </div>
                    {step2Done && (
                      <Badge variant="neutral">
                        {t.integrationsExt.readyToSync}
                      </Badge>
                    )}
                  </div>

                  {/* Action */}
                  {step2Done && (
                    <div className="mt-3">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSync}
                        disabled={syncing}
                      >
                        {syncing ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        {syncing
                          ? t.integrationsExt.syncing
                          : t.integrationsExt.syncReviews}
                      </button>
                    </div>
                  )}

                  {/* Sync result */}
                  {syncResult && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-xs ${
                        syncResult.errors.length > 0
                          ? 'bg-amber-50 border border-amber-200/60'
                          : 'bg-emerald-50 border border-emerald-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {syncResult.errors.length > 0 ? (
                          <AlertCircle size={14} className="text-amber-600" />
                        ) : (
                          <CheckCircle size={14} className="text-emerald-600" />
                        )}
                        <span className="font-medium">
                          {t.integrationsExt.syncedResult
                            .replace('{synced}', String(syncResult.synced))
                            .replace('{drafts}', String(syncResult.drafts))}
                        </span>
                      </div>
                      {syncResult.errors.map((e: string, i: number) => (
                        <div key={i} className="text-amber-700 ps-5">
                          {e}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI section ── */}
      <div>
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-4">
          {t.integrationsExt.ai}
        </h3>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  geminiConfigured
                    ? 'bg-brand-100 text-brand-600'
                    : 'bg-surface-secondary text-content-tertiary'
                }`}
              >
                <Zap size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-[13px] font-semibold text-content-primary">
                      {t.integrationsExt.aiSmartReplyEngine}
                    </p>
                    <p className="text-xs text-content-tertiary mt-0.5">
                      {t.integrationsExt.aiSmartReplyEngineDesc}
                    </p>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5">
                    <StatusDot color={geminiConfigured ? 'green' : 'gray'} />
                    <Badge variant={geminiConfigured ? 'success' : 'neutral'}>
                      {geminiConfigured
                        ? t.integrationsExt.connected
                        : t.integrationsExt.aiNotConnected}
                    </Badge>
                  </div>
                </div>

                {/* Content based on configured state */}
                {geminiConfigured ? (
                  <div className="mt-3 space-y-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleTestGemini}
                      disabled={testingGemini}
                    >
                      {testingGemini ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Zap size={13} />
                      )}
                      {testingGemini
                        ? t.integrationsExt.testing
                        : t.integrationsExt.testEngine}
                    </button>

                    {geminiTestResult && (
                      <div
                        className={`text-xs p-3 rounded-lg border ${
                          geminiTestResult.startsWith('✓')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : 'bg-red-50 text-red-700 border-red-200/60'
                        }`}
                      >
                        {geminiTestResult}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-content-tertiary bg-surface-secondary rounded-lg px-3 py-2.5">
                    {t.integrationsExt.aiUnavailable}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location modal — unchanged */}
      {showLocationModal && (
        <Modal
          title={t.integrationsExt.linkGoogleLocations}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedLocations(new Set());
          }}
          footer={
            unlinkedInModal.length > 0 ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleLinkSelected}
                  disabled={linkingLocations || selectedUnlinkedCount === 0}
                >
                  {linkingLocations ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />{' '}
                      {t.integrationsExt.linking}
                    </>
                  ) : (
                    <>
                      <Link2 size={13} />{' '}
                      {t.integrationsExt.linkCount
                        .replace('{count}', String(selectedUnlinkedCount))
                        .replace('{unit}', selectedUnlinkedCount === 1 ? t.integrationsExt.locationSingular : t.integrationsExt.locationPlural)
                        .replace('{s}', selectedUnlinkedCount > 1 ? 's' : '')}
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLocationModal(false);
                    setSelectedLocations(new Set());
                  }}
                >
                  {t.common.cancel}
                </button>
              </>
            ) : undefined
          }
        >
          {locations.length === 0 ? (
            <div className="py-10 text-center text-sm text-content-tertiary">
              {t.integrationsExt.noGoogleLocations}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {locations.map((loc: GoogleLocation) => {
                const alreadyLinked = branches.some(
                  (b: DbBranch) => b.google_location_id === loc.name
                );
                const isSelected = selectedLocations.has(loc.name);

                return (
                  <button
                    key={loc.name}
                    type="button"
                    disabled={alreadyLinked}
                    onClick={() => !alreadyLinked && toggleLocationSelection(loc.name)}
                    className={[
                      'w-full text-start p-3 border rounded-lg transition-colors',
                      alreadyLinked
                        ? 'border-emerald-200/60 bg-emerald-50/50 cursor-default'
                        : isSelected
                          ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
                          : 'border-border hover:bg-surface-secondary cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                          alreadyLinked
                            ? 'bg-emerald-500 border-emerald-500'
                            : isSelected
                              ? 'bg-brand-600 border-brand-600'
                              : 'border-gray-300 bg-white',
                        ].join(' ')}
                      >
                        {(alreadyLinked || isSelected) && (
                          <Check size={12} className="text-white" strokeWidth={3} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-content-primary">
                          {loc.title}
                        </div>
                        <div className="text-2xs text-content-tertiary">
                          {[
                            loc.storefrontAddress?.locality,
                            loc.storefrontAddress?.addressLines?.join(', '),
                          ]
                            .filter(Boolean)
                            .join(' — ')}
                        </div>
                      </div>

                      {alreadyLinked && (
                        <Badge variant="success">
                          {t.integrationsExt.linked}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
