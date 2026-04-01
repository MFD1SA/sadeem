import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { qrService } from '@/services/qr';
import type { DbQrConfig } from '@/types/qr';
import { Star, Send } from 'lucide-react';

interface BranchInfo { internal_name: string; city: string | null; }
interface OrgInfo { name: string; logo_url: string | null; }

export default function ReviewLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<DbQrConfig | null>(null);
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      try {
        const { data: configData, error: configErr } = await supabase
          .from('qr_configs')
          .select('*')
          .eq('slug', slug)
          .single();

        if (configErr || !configData) { setNotFound(true); setLoading(false); return; }
        const cfg = configData as DbQrConfig;
        setConfig(cfg);

        // Track scan
        qrService.trackEvent(cfg.id, 'scan').catch(() => {});

        // If direct mode, redirect immediately
        if (cfg.mode === 'direct' && cfg.google_review_url) {
          qrService.trackEvent(cfg.id, 'click').catch(() => {});
          window.location.href = cfg.google_review_url;
          return;
        }

        // Load branch + org info
        const { data: branchData } = await supabase
          .from('branches')
          .select('internal_name, city')
          .eq('id', cfg.branch_id)
          .single();
        setBranch(branchData as BranchInfo | null);

        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, logo_url')
          .eq('id', cfg.organization_id)
          .single();
        setOrg(orgData as OrgInfo | null);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const handleReviewClick = async () => {
    if (!config) return;

    // Track employee name if entered
    if (employeeName.trim()) {
      await qrService.trackEvent(config.id, 'employee_submit', employeeName.trim()).catch(() => {});
    }

    // Track click
    await qrService.trackEvent(config.id, 'click').catch(() => {});

    if (config.google_review_url) {
      window.location.href = config.google_review_url;
    } else {
      setSubmitted(true);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Not Found ───
  if (notFound || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-lg font-bold text-gray-800 mb-2">الرابط غير صالح</h1>
          <p className="text-sm text-gray-500">هذا الرابط غير موجود أو انتهت صلاحيته.</p>
        </div>
      </div>
    );
  }

  // ─── Thank You (no Google URL) ───
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">💚</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">شكراً لك!</h1>
          <p className="text-sm text-gray-500">نقدّر رأيك ونعمل على تحسين خدماتنا دائماً.</p>
        </div>
      </div>
    );
  }

  const message = config.custom_message || 'نسعد بسماع رأيك! تقييمك يساعدنا على تقديم خدمة أفضل.';

  // ─── Landing Page ───
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="max-w-sm mx-auto px-5 py-8">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          {org?.logo_url ? (
            <img src={org.logo_url} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xl font-bold">{org?.name?.charAt(0) || 'س'}</span>
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900">{org?.name || 'سديم'}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-sm text-gray-500">{branch?.internal_name || ''}</span>
            {branch?.city && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">{branch.city}</span>
              </>
            )}
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={28} fill="#fbbf24" className="text-amber-400" />
          ))}
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-[15px] leading-relaxed text-gray-700 text-center">{message}</p>
        </div>

        {/* Employee Name Field */}
        {config.show_employee_field && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 text-center">
              اسم الموظف الذي خدمك (اختياري)
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmployeeName(e.target.value)}
              placeholder="مثال: أحمد"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 text-center bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
          </div>
        )}

        {/* Review Button */}
        <button
          onClick={handleReviewClick}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-[15px] rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          </svg>
          قيّمنا على Google
        </button>

        {/* Footer */}
        <div className="text-center mt-8">
          <span className="text-2xs text-gray-300">Powered by سديم</span>
        </div>
      </div>
    </div>
  );
}
