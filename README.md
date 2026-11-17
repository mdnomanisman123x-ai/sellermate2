# SellerMate2

SellerMate2 is a mobile-first business workspace built with Next.js 14 and React 18.

## Current app foundation

- Mobile-friendly business dashboard
- Sales, expenses, customers and inventory sections
- English/Bengali interface toggle
- Add-record forms
- Demo records saved in the current browser using localStorage
- PWA manifest, app icon, install prompt and basic offline fallback

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important security and product limitations

This is an early frontend MVP, not a production SaaS yet.

- Data is stored only in the current browser on the current device.
- There is no user authentication, cloud database, team sharing, backup or tenant isolation yet.
- Do not enter real customer personal information or confidential business data.
- No AI provider is connected. No business data is sent to an AI service.
- Browser localStorage is not a secure production database and can be cleared by the user or browser.
- Offline support is basic; some features still require an internet connection.

Before accepting real business data, implement Supabase Auth, PostgreSQL tenant isolation, Row Level Security (RLS), server-side authorization, backups, audit logging and tested data export/deletion. Add AI only behind a server-side permission and data-minimization layer.

## Deployment

Import this repository into Vercel. Framework preset: Next.js. Build command: `npm run build`.
