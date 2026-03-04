# URBNWAVE

����������� storefront ��� ������� � Atelier-������� �������.

## ������

1. ���������� �����������:

```bash
npm i
```

2. �������� `.env` �� �������:

```bash
cp .env.example .env
```

3. � ������ ��������� ��������� analytics endpoint:

```bash
npm run analytics:server
```

4. �� ������ ��������� ��������� �����:

```bash
npm run dev
```

## ������

```bash
npm run build
```

�� ����� `build` ������������� ������������:
- `public/sitemap.xml`
- `public/og/default.svg`
- `public/og/product-<id>.svg`

## Analytics endpoint

��������� endpoint ��������� �������:
- `POST /collect`
- `GET /health`
- `GET /events?limit=100`
- `GET /metrics`

������� ����������� � `analytics/events-YYYY-MM-DD.ndjson`.

����� ���������� �������, ���� ����� `VITE_ANALYTICS_ENDPOINT`.

## Supabase admin

1. Create a Supabase project.
2. Run SQL from `supabase/schema.sql` in SQL Editor.
3. In Authentication, create an admin user (email/password).
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
5. Open `/admin` and login.

Current admin features:
- Orders: list + status updates
- Products: create/update/delete
- Content: hero block + menu labels

## CMS update (Storage + pages)

To enable image upload from `/admin`, run the latest SQL from `supabase/schema.sql` again in Supabase SQL Editor.
This creates/updates:
- `site_content` keys: `benefits`, `brand`, `pages`
- Storage bucket `site-assets` + policies for public read and admin upload

## Production deploy (Vercel)

1. Push current code to GitHub repository.
2. In Vercel import this repo and deploy with preset `Vite`.
3. In Vercel Project Settings -> Environment Variables add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `RESEND_API_KEY` (optional if Telegram is configured)
   - `LEADS_EMAIL_TO` (default: `alihka0529@gmail.com`)
   - `LEADS_EMAIL_FROM` (default: `URBNWAVE <onboarding@resend.dev>`)
4. Redeploy.

### Subscription form behavior

Footer form sends `POST /api/subscribe`.
The backend tries to deliver each new subscription to:
- Telegram (bot API), and/or
- Email (Resend API).

If at least one channel is configured and works, the request is treated as successful.
