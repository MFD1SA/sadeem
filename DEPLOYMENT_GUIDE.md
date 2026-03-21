# دليل تشغيل واختبار سديم — Sadeem Deployment Guide

## المتطلبات المسبقة

- Node.js 18+ مثبت
- حساب Google Cloud Console
- حساب Supabase (مجاني يكفي)
- حساب Google Business Profile (للاختبار الحقيقي)

---

## الخطوة 1 — إنشاء مشروع Supabase

1. اذهب إلى https://supabase.com/dashboard
2. اضغط "New Project"
3. اختر:
   - Organization: أنشئ واحدة أو اختر موجودة
   - Project name: `sadeem`
   - Database password: اختر كلمة مرور واحفظها
   - Region: اختر الأقرب (مثلاً `Middle East (Bahrain)`)
4. انتظر حتى يكتمل الإنشاء (2-3 دقائق)

### الحصول على المفاتيح:

1. اذهب إلى Settings → API
2. انسخ:
   - **Project URL** = `https://xxxxxxxx.supabase.co`
   - **anon public key** = `eyJhbGciOi...`

---

## الخطوة 2 — تشغيل schema.sql

1. في Supabase Dashboard اذهب إلى **SQL Editor**
2. اضغط "New Query"
3. انسخ محتوى الملف `supabase/schema.sql` بالكامل
4. اضغط **Run**
5. تأكد أن النتيجة "Success. No rows returned"

### التحقق:
- اذهب إلى **Table Editor**
- يجب أن ترى الجداول التالية:
  - `users`
  - `organizations`
  - `memberships`
  - `branches`
  - `reviews`
  - `reply_drafts`
  - `reply_templates`

---

## الخطوة 3 — تفعيل Google OAuth في Supabase

### 3.1 — إعداد Google Cloud Console

1. اذهب إلى https://console.cloud.google.com
2. أنشئ مشروع جديد: `Sadeem`
3. فعّل APIs التالية:
   - **Google+ API** (أو People API)
   - **My Business Account Management API**
   - **My Business Business Information API**
   - **Google My Business API** (legacy - للتقييمات)
4. اذهب إلى **APIs & Services → Credentials**
5. اضغط **Create Credentials → OAuth 2.0 Client ID**
6. اختر Application type: **Web application**
7. Name: `Sadeem Web`
8. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://xxxxxxxx.supabase.co
   ```
9. Authorized redirect URIs:
   ```
   https://xxxxxxxx.supabase.co/auth/v1/callback
   ```
   (استبدل `xxxxxxxx` بـ project reference من Supabase)
10. اضغط Create
11. انسخ **Client ID** و **Client Secret**

### 3.2 — تفعيل OAuth Consent Screen

1. اذهب إلى **OAuth consent screen**
2. اختر **External**
3. App name: `سديم - Sadeem`
4. User support email: بريدك
5. **Scopes**: اضغط Add or remove scopes وأضف:
   ```
   openid
   email
   profile
   https://www.googleapis.com/auth/business.manage
   ```
6. Test users: أضف بريدك الخاص (مطلوب إذا كان التطبيق في وضع Testing)
7. احفظ

### 3.3 — تفعيل Google في Supabase

1. في Supabase Dashboard اذهب إلى **Authentication → Providers**
2. ابحث عن **Google** واضغط عليه
3. فعّله (Enable)
4. ضع:
   - **Client ID**: من Google Cloud Console
   - **Client Secret**: من Google Cloud Console
5. في **Additional Scopes** أضف بالضبط:
   ```
   https://www.googleapis.com/auth/business.manage
   ```
6. احفظ

---

## الخطوة 4 — تفعيل Gemini API Key

1. اذهب إلى https://aistudio.google.com/app/apikey
2. اضغط **Create API Key**
3. اختر المشروع `Sadeem` (أو أنشئ مفتاح جديد)
4. انسخ المفتاح

---

## الخطوة 5 — إعداد ملف .env

في مجلد المشروع `sadeem/`، أنشئ ملف `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
VITE_GEMINI_API_KEY=AIzaSy...your-gemini-key...
```

**مهم**: استبدل القيم بالقيم الحقيقية من الخطوات السابقة.

---

## الخطوة 6 — تشغيل المشروع محلياً

```bash
cd sadeem
npm install
npm run dev
```

سيعمل على: http://localhost:5173

---

## الخطوة 7 — الاختبار خطوة بخطوة

### 7.1 — اختبار Login

1. افتح http://localhost:5173
2. يجب أن تُحوَّل إلى `/login`
3. اختبر:
   - [ ] الصفحة تظهر بشكل صحيح (عربي RTL)
   - [ ] زر "تسجيل الدخول عبر Google" يظهر
   - [ ] نموذج Email/Password يظهر
   - [ ] رابط "أنشئ حساباً" يعمل

4. اضغط **"تسجيل الدخول عبر Google"**
5. اختر حسابك
6. وافق على الصلاحيات
7. يجب أن تُحوَّل إلى `/auth/callback` ثم إلى `/onboarding`

**نتيجة متوقعة**: تسجيل دخول ناجح → انتقال إلى onboarding

### 7.2 — اختبار Onboarding

1. بعد تسجيل الدخول، يجب أن تظهر صفحة Onboarding
2. اختبر:
   - [ ] الخطوة 1: أدخل اسم النشاط (مثلاً "مطاعم الأفق")
   - [ ] زر "التالي" يعمل
   - [ ] الخطوة 2: اختر القطاع (مثلاً "مطاعم")
   - [ ] زر "التالي" يعمل
   - [ ] الخطوة 3: اختر المدينة (مثلاً "الرياض")
   - [ ] زر "ابدأ الآن" يعمل
3. بعد الضغط على "ابدأ الآن":
   - [ ] يتم إنشاء organization في قاعدة البيانات
   - [ ] يتم إنشاء membership
   - [ ] يتم تحويلك إلى `/dashboard`

**تحقق من Supabase**: اذهب إلى Table Editor وتأكد أن:
- جدول `users` يحتوي على سجلك
- جدول `organizations` يحتوي على النشاط الذي أنشأته
- جدول `memberships` يحتوي على ربط بينهما

### 7.3 — اختبار Dashboard

1. بعد الانتقال إلى Dashboard:
   - [ ] Topbar يعرض اسمك الحقيقي
   - [ ] Topbar يعرض صورتك من Google
   - [ ] Topbar يعرض اسم النشاط
   - [ ] بطاقات الإحصائيات تظهر (ستكون أصفار لأنه لا يوجد بيانات بعد)
   - [ ] التقييمات الحرجة فارغة مع رسالة "لا توجد نتائج"
   - [ ] أداء الفروع فارغ مع رسالة "لا توجد بيانات"

### 7.4 — اختبار Branches

1. اذهب إلى `/dashboard/branches`
2. اختبر:
   - [ ] الصفحة تعرض "لا توجد فروع بعد"
   - [ ] زر "إضافة فرع" يعمل
   - [ ] أدخل: الاسم الداخلي = "الفرع الرئيسي"، المدينة = "الرياض"
   - [ ] اضغط "حفظ"
   - [ ] الفرع يظهر في الجدول
   - [ ] زر التعديل يعمل
   - [ ] زر الحذف يعمل

**تحقق من Supabase**: جدول `branches` يحتوي على الفرع

### 7.5 — اختبار Integrations + ربط Google Business

1. اذهب إلى `/dashboard/integrations`
2. اختبر:
   - [ ] حالة Google Login = "متصل" (أخضر)
   - [ ] حالة Google Business = "جاهز للربط" (أصفر) أو "غير متصل"
   - [ ] حالة Gemini = "متصل" (إذا وضعت API key) أو "غير متصل"

3. اضغط **"ربط المواقع"**:
   - [ ] يظهر Modal بقائمة المواقع من Google Business
   - [ ] لكل موقع يظهر الاسم والمدينة والعنوان
   - [ ] زر "ربط" يعمل
   - [ ] بعد الربط يظهر "مرتبط" (أخضر)

**ملاحظة**: إذا لم يكن لديك حساب Google Business حقيقي، هذا الجزء لن يعمل. يمكنك إضافة فروع يدوياً من صفحة Branches بدلاً من ذلك.

### 7.6 — اختبار مزامنة التقييمات

1. بعد ربط موقع واحد على الأقل:
2. اضغط **"مزامنة التقييمات"**
3. اختبر:
   - [ ] تظهر حالة المزامنة (جاري...)
   - [ ] تظهر النتيجة (عدد التقييمات المزامنة + عدد الردود المقترحة)
   - [ ] إذا Gemini مفعّل: يتم توليد ردود AI تلقائياً

**تحقق من Supabase**:
- جدول `reviews` يحتوي على التقييمات
- جدول `reply_drafts` يحتوي على ردود AI مقترحة

### 7.7 — اختبار Reviews Center

1. اذهب إلى `/dashboard/reviews`
2. اختبر:
   - [ ] العمود الأيسر: الفلاتر تعمل (الفرع، التقييم، المشاعر، الحالة)
   - [ ] العمود الأوسط: قائمة التقييمات تظهر
   - [ ] كل تقييم يعرض: اسم المراجع، النجوم، النص، الفرع، الحالة
   - [ ] الضغط على تقييم يفتح التفاصيل في العمود الأيمن
   - [ ] التقييم الأول يعرض "الرد المقترح" (من AI)
   - [ ] أزرار: اعتماد وإرسال / تعديل / تأجيل / رفض تظهر
   - [ ] تقييم follow-up يعرض تحذير "مراجعة يدوية مطلوبة" + مربع رد يدوي

### 7.8 — اختبار Responses Inbox

1. اذهب إلى `/dashboard/replies`
2. اختبر:
   - [ ] Tabs تعمل (الكل، بانتظار، مؤجلة، مرسلة تلقائياً، مرفوضة، تم إرسالها)
   - [ ] كل رد يعرض: المصدر (AI/قالب/يدوي)، الحالة، النص
   - [ ] أزرار approve/defer/reject تعمل

### 7.9 — اختبار إرسال رد

1. في Reviews Center، اختر تقييم بحالة "بانتظار الرد"
2. اضغط "اعتماد وإرسال"
3. اختبر:
   - [ ] حالة reply_draft تتغير إلى "sent"
   - [ ] حالة review تتغير إلى "replied"
   - [ ] إذا مرتبط بـ Google: الرد يُنشر على Google

### 7.10 — اختبار Gemini (اختبار مستقل)

1. في صفحة Integrations
2. اضغط **"اختبار Gemini"**
3. اختبر:
   - [ ] يظهر نتيجة الاختبار (sentiment + reply)
   - [ ] الرد مهني وقصير وبدون emoji

### 7.11 — اختبار Templates

1. اذهب إلى `/dashboard/templates`
2. اختبر:
   - [ ] إضافة قالب جديد
   - [ ] تعديل قالب
   - [ ] تفعيل/تعطيل قالب
   - [ ] حذف قالب

### 7.12 — اختبار Team

1. اذهب إلى `/dashboard/team`
2. اختبر:
   - [ ] يظهر اسمك كـ "مالك الحساب"
   - [ ] الصورة والبريد والدور

### 7.13 — اختبار Settings

1. اذهب إلى `/dashboard/settings`
2. اختبر:
   - [ ] تبويب "النشاط التجاري": تعديل الاسم والمدينة ← حفظ
   - [ ] تبويب "الملف الشخصي": عرض البريد والاسم ← تعديل الاسم ← حفظ
   - [ ] تبويب "سياسة الردود": عرض قواعد سديم
   - [ ] تبويب "عام": تبديل اللغة بين العربية والإنجليزية

### 7.14 — اختبار RTL/LTR

1. من Settings → عام → غيّر اللغة إلى English
2. اختبر:
   - [ ] كل النصوص تتحول للإنجليزية
   - [ ] الاتجاه يتحول إلى LTR
   - [ ] Sidebar على اليسار
   - [ ] كل شيء يعمل بشكل صحيح
3. ارجع إلى العربية
4. اختبر:
   - [ ] الاتجاه يعود RTL
   - [ ] Sidebar على اليمين

### 7.15 — اختبار Logout

1. اضغط على اسمك في Topbar
2. اضغط "تسجيل الخروج"
3. اختبر:
   - [ ] يتم تحويلك إلى `/login`
   - [ ] محاولة فتح `/dashboard` مباشرة تعيدك إلى `/login`

### 7.16 — اختبار Route Protection

1. من غير تسجيل دخول، حاول فتح:
   - [ ] `/dashboard` → يحولك إلى `/login`
   - [ ] `/dashboard/reviews` → يحولك إلى `/login`
   - [ ] `/onboarding` → يحولك إلى `/login`

2. سجل دخول بدون إكمال onboarding (احذف org من DB):
   - [ ] `/dashboard` → يحولك إلى `/onboarding`

---

## Checklist ملخص الاختبار

```
[ ] npm install ناجح
[ ] npm run dev يعمل بدون أخطاء
[ ] صفحة Login تظهر
[ ] Google Login يعمل
[ ] Onboarding يعمل (3 خطوات)
[ ] Organization تُنشأ في DB
[ ] Dashboard يعرض بيانات حقيقية
[ ] Topbar يعرض اسم وصورة حقيقية
[ ] Branches CRUD يعمل
[ ] Templates CRUD يعمل
[ ] Team يعرض أعضاء حقيقيين
[ ] Settings تحفظ التغييرات
[ ] Integrations تعرض حالات حقيقية
[ ] Google Business locations تُجلب (إذا متاح)
[ ] Review sync يعمل (إذا locations مرتبطة)
[ ] Gemini يولد ردود (إذا API key موجود)
[ ] ReviewsCenter يعرض تقييمات حقيقية
[ ] ResponsesInbox يعرض ردود حقيقية
[ ] Approve/Reject/Defer تعمل
[ ] Reply يُرسل إلى Google (إذا مرتبط)
[ ] Follow-up reviews → Manual Review Required
[ ] RTL ↔ LTR يعمل
[ ] Logout يعمل
[ ] Route protection يعمل
[ ] Analytics يعرض بيانات حقيقية
[ ] Empty states تظهر عند عدم وجود بيانات
[ ] Loading states تظهر أثناء التحميل
```

---

## ملاحظات مهمة

### إذا لم يكن لديك Google Business Profile:
- يمكنك اختبار كل شيء عدا:
  - ربط المواقع من Google
  - مزامنة التقييمات من Google
  - إرسال الردود إلى Google
- يمكنك إضافة فروع يدوياً وإدخال تقييمات يدوياً في Supabase Table Editor

### إذا أردت اختبار التقييمات بدون Google:
أدخل مباشرة في Supabase SQL Editor:
```sql
INSERT INTO reviews (branch_id, organization_id, reviewer_name, rating, review_text, source, status, published_at)
VALUES
  ('YOUR_BRANCH_ID', 'YOUR_ORG_ID', 'محمد الشمري', 5, 'تجربة ممتازة! الطعام لذيذ جداً.', 'manual', 'new', now()),
  ('YOUR_BRANCH_ID', 'YOUR_ORG_ID', 'سارة القحطاني', 2, 'الانتظار طويل والطعام بارد.', 'manual', 'new', now()),
  ('YOUR_BRANCH_ID', 'YOUR_ORG_ID', 'عبدالله الدوسري', 4, 'مكان جميل والأكل ممتاز.', 'manual', 'new', now());
```
(استبدل YOUR_BRANCH_ID و YOUR_ORG_ID بالقيم الحقيقية من جداول branches و organizations)

### Auto-send بعد 24 ساعة:
- الدالة `autoSendPendingDrafts` جاهزة لكن تحتاج استدعاء دوري
- لاحقاً يمكن تحويلها إلى Supabase Edge Function + Cron
- حالياً يمكنك اختبارها يدوياً من console المتصفح
