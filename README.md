# Sento Ekam — Society Portal

React + Vite + Tailwind CSS + Supabase. Features: common hall booking (overlap checks), parking stickers (max 4 per flat), contacts, nearby landmarks, buy & sell, and admin approval for new members. UI strings are available in **English**, **Hindi**, and **Marathi** (language switcher in the header).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is enough)

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
3. **Authentication → Providers → Email**: enable Email. Configure **Site URL** to your deployed app URL (e.g. `https://your-app.vercel.app`). Add the same URL under **Redirect URLs** if needed.
4. **Optional — disable email confirmation** for testing: Authentication → Providers → Email → turn off “Confirm email”. For production, keep confirmation enabled.
5. **First admin**: sign up once through the app, then in SQL Editor run (replace the email):

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com' limit 1);
   ```

   After that, you can approve pending users and manage contacts/landmarks from **Admin** in the app.

If a trigger fails to create (rare Postgres version differences), try replacing `execute function` with `execute procedure` in the two trigger definitions at the bottom of `schema.sql`, then run again.

## 2. Local environment

```bash
cd sento-ekam-portal
cp .env.example .env
```

Edit `.env` and set:

- `VITE_SUPABASE_URL` — **Project Settings → API → Project URL**
- `VITE_SUPABASE_ANON_KEY` — **anon public** key (never commit the service role key)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## 3. Free hosting (frontend)

- **Vercel** (recommended): connect this repo, framework Vite, build `npm run build`, output `dist`. `vercel.json` is included for SPA routing.
- **Netlify**: same build; add a redirect rule: `/*` → `/index.html` (200).

Set the same **Supabase Site URL** and **Redirect URLs** to your production URL.

## 4. Email (free options)

| What | Free option |
|------|-------------|
| Login, signup, password reset | Supabase Auth **built-in** email (limits apply on free tier; fine for small societies) |
| “Notify society@…” on every new signup | Not included out of the box. Later you can add **Resend** (free tier), **Supabase Edge Function**, or **Database Webhook** to forward events to the committee inbox. |

For a minimal workflow without extra services: new users appear under **Admin → Pending approvals**; the committee checks the portal and approves members.

## Project layout

- `src/pages/` — screens (dashboard, hall, parking, contacts, landmarks, marketplace, admin)
- `src/i18n/locales/` — `en.json`, `hi.json`, `mr.json`
- `supabase/schema.sql` — tables, RLS, triggers (run once in Supabase)

## Scripts

- `npm run dev` — development
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally
