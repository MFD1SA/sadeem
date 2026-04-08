// ============================================================================
// SENDA — Contact Page (تواصل معنا)
// ============================================================================
import { useState, useEffect, type FormEvent } from 'react';
import { Send, Loader2, CheckCircle2, MapPin, Clock, MessageSquare, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PublicLayout from '@/layouts/PublicLayout';
import { getSavedLang, saveLang } from '@/lib/lang';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'تواصل معنا',
    heroH1: 'نحن هنا لمساعدتك',
    heroSub: 'أرسل لنا رسالتك وسنتواصل معك في أقرب وقت ممكن',
    heroBtn: 'أرسل رسالتك الآن',
    nameLabel: 'الاسم الكامل',
    namePh: 'أدخل اسمك الكامل',
    emailLabel: 'البريد الإلكتروني',
    emailPh: 'example@email.com',
    msgLabel: 'رسالتك',
    msgPh: 'اكتب رسالتك هنا...',
    sendBtn: 'إرسال الرسالة',
    sending: 'جارِ الإرسال...',
    successTitle: 'تم إرسال رسالتك بنجاح',
    successDesc: 'شكرًا لتواصلك معنا. سنعود إليك في أقرب وقت.',
    sendAnother: 'إرسال رسالة أخرى',
    errorMsg: 'حدث خطأ أثناء الإرسال. يرجى المحاولة مجددًا.',
    infoCards: [
      { title: 'موقعنا', desc: 'المملكة العربية السعودية', icon: 'MapPin' },
      { title: 'ساعات العمل', desc: 'الأحد – الخميس، 9 ص – 6 م', icon: 'Clock' },
      { title: 'الدعم الفني', desc: 'متاح عبر نظام التذاكر داخل المنصة', icon: 'MessageSquare' },
    ],
  },
  en: {
    heroTag: 'Contact Us',
    heroH1: 'We\'re Here to Help',
    heroSub: 'Send us your message and we\'ll get back to you as soon as possible',
    heroBtn: 'Send Your Message',
    nameLabel: 'Full Name',
    namePh: 'Enter your full name',
    emailLabel: 'Email',
    emailPh: 'example@email.com',
    msgLabel: 'Your Message',
    msgPh: 'Write your message here...',
    sendBtn: 'Send Message',
    sending: 'Sending...',
    successTitle: 'Message sent successfully',
    successDesc: 'Thank you for reaching out. We\'ll get back to you shortly.',
    sendAnother: 'Send another message',
    errorMsg: 'An error occurred. Please try again.',
    infoCards: [
      { title: 'Location', desc: 'Saudi Arabia', icon: 'MapPin' },
      { title: 'Working Hours', desc: 'Sun – Thu, 9 AM – 6 PM', icon: 'Clock' },
      { title: 'Technical Support', desc: 'Available via the in-platform ticket system', icon: 'MessageSquare' },
    ],
  },
};

const ICONS: Record<string, any> = { MapPin, Clock, MessageSquare };

export default function ContactPage() {
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const t = T[lang];

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — تواصل معنا' : 'SENDA | سيندا — Contact Us'; }, [lang]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: fnErr } = await supabase.functions.invoke('send-contact', {
        body: { name, email, message },
      });
      if (fnErr) throw fnErr;
      setSent(true);
      setName(''); setEmail(''); setMessage('');
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => { const next = l === 'ar' ? 'en' : 'ar'; saveLang(next); return next; })}>
      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">{t.heroH1}</h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">{t.heroSub}</p>
          <button onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
            {t.heroBtn}
            <ArrowDown size={16} />
          </button>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section id="contact-form" className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10">
          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="text-center py-16 rounded-2xl border border-blue-100 bg-blue-50/30">
                <CheckCircle2 size={48} className="text-blue-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t.successTitle}</h3>
                <p className="text-sm text-slate-500 mb-6">{t.successDesc}</p>
                <button onClick={() => setSent(false)} className="text-sm font-medium text-blue-900 hover:text-blue-900">{t.sendAnother}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8">
                {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.nameLabel}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.emailLabel}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPh} required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.msgLabel}</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t.msgPh} required rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#0F1A2E] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#162032] disabled:opacity-50 transition-colors">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t.sending}</> : <><Send size={16} /> {t.sendBtn}</>}
                </button>
              </form>
            )}
          </div>

          {/* Info Cards */}
          <div className="md:col-span-2 space-y-4">
            {t.infoCards.map((card: any, i: number) => {
              const Icon = ICONS[card.icon] || MapPin;
              return (
                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white">
                  <div className="w-10 h-10 rounded-xl bg-[#0F1A2E] flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">{card.title}</h4>
                    <p className="text-sm text-slate-500">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
