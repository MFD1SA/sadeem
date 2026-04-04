# سيندا — Senda

AI-powered Google Reviews management platform for Saudi businesses.

## Features

- **Google Business Integration** — Connect Google Business Profile, sync reviews
- **AI Smart Reply Engine** — Rating + sentiment-aware professional replies
- **QR Review System** — QR codes per branch with smart landing pages
- **Multi-Branch Management** — Manage multiple locations
- **Review Analytics** — Rating distribution, sentiment, branch comparison
- **Subscription Plans** — Starter, Growth, Pro, Enterprise
- **24-Hour Trial** — Full access with AI/template usage limits
- **Arabic-First UI** — Full RTL with Arabic and English

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · Supabase · Google Gemini · Vercel

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key        # optional
```

### 3. Database (run in order in Supabase SQL Editor)

```
1. supabase/schema.sql
2. supabase/fix-rls-policies.sql
3. supabase/subscriptions-schema.sql
4. supabase/trial-system-schema.sql
5. supabase/qr-system-schema.sql
6. supabase/notifications-schema.sql
7. supabase/audit-logs-schema.sql
```

### 4. Supabase Auth

Enable Google provider with scope: `https://www.googleapis.com/auth/business.manage`

### 5. Supabase Storage

Create public bucket: `avatars`

### 6. Run

```bash
npm run dev
```

### 7. Deploy

Push to GitHub → Vercel auto-deploys. Set env vars in Vercel Dashboard.

---

## AI Reply Logic

| Rating | Sentiment | Action |
|--------|-----------|--------|
| 5-4★ | Positive | Template reply |
| 5-4★ | Complaint | Manual review |
| 3★ | Any | AI reply |
| 2★ | Any | AI apology |
| 1★ | Any | Manual only |

Follow-up reviews → always manual.

## License
<!-- deploy trigger -->

Proprietary — All rights reserved.
