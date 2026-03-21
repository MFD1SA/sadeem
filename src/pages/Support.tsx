import { useLanguage } from '@/i18n';
import { EmptyState } from '@/components/ui/EmptyState';
import { HelpCircle } from 'lucide-react';

export default function Support() {
  const { t, lang } = useLanguage();

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.supportPage.title}</h3>
      </div>
      <EmptyState
        message={lang === 'ar' ? 'لا توجد تذاكر دعم حالياً. تواصل معنا عبر support@sadeem.sa' : 'No support tickets. Contact us at support@sadeem.sa'}
        icon={<HelpCircle size={48} strokeWidth={1.2} className="text-gray-300" />}
      />
    </div>
  );
}
