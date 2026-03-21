// ============================================================================
// SADEEM Admin — Settings Page (Foundation)
// ============================================================================

import { Settings, Globe, Bell, Shield, Database } from 'lucide-react';

const sections = [
  { id: 'general', label: 'إعدادات عامة', desc: 'اسم المنصة، اللغة الافتراضية، المنطقة الزمنية', icon: Globe },
  { id: 'security', label: 'الأمان والحماية', desc: 'سياسات كلمة المرور، مدة الجلسات، قيود تسجيل الدخول', icon: Shield },
  { id: 'notifications', label: 'الإشعارات', desc: 'إعدادات الإشعارات الداخلية والبريد الإلكتروني', icon: Bell },
  { id: 'system', label: 'النظام', desc: 'صيانة قاعدة البيانات، النسخ الاحتياطي، الحالة', icon: Database },
];

export default function AdminSettings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">الإعدادات</h1>
        <p className="text-sm text-slate-400">إعدادات النظام العامة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.id} className="admin-card group hover:border-white/[0.12] transition-colors cursor-pointer">
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                <section.icon size={20} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{section.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{section.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 admin-card">
        <div className="p-5 text-center">
          <Settings size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            سيتم تفعيل تفاصيل الإعدادات في المراحل التالية
          </p>
        </div>
      </div>
    </div>
  );
}
