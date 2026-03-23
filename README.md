# Sentosa Ekam — Society Portal

React + Vite + Tailwind CSS + Supabase. Features: common hall booking (overlap checks), parking stickers (max 4 per flat), contacts, nearby landmarks, buy & sell, and admin approval for new members. UI strings are available in **English**, **Hindi**, and **Marathi** (language switcher in the header).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is enough)

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
3. **Authentication → Providers → Email**: enable Email. Configure **Site URL** to your deployed app URL (e.g. `https://your-app.vercel.app`). Add the same URL under **Redirect URLs** if needed.
4. **Optional — disable email confirmation** for testing: Authentication → Providers → Email → turn off “Confirm email”. For production, keep confirmation enabled.
5. Sign up once via **Request access** (or use an existing account) for the committee Gmail you will use to log in.

If a trigger fails to create (rare Postgres version differences), try replacing `execute function` with `execute procedure` in the two trigger definitions at the bottom of `schema.sql`, then run again.

6. **One committee admin email** (optional but recommended): In `.env` set `VITE_COMMITTEE_ADMIN_EMAIL` to the same Gmail/login the committee uses. Add the same variable on **Vercel**. Only that user will see **Admin** in the app (approve access, manage contacts/landmarks, see all residents). Then run in **SQL Editor** (replace with your committee email):

   ```sql
   update public.profiles set role = 'member' where role = 'admin';

   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'sentosaekampunawale@gmail.com' limit 1);
   ```

7. **Extra SQL migrations** (run once in SQL Editor, in order):
   - `supabase/migration_profiles_select_for_members.sql` — so members can see who booked the hall (name + flat).
   - `supabase/migration_email_on_profiles.sql` — stores login email on `profiles` for the Admin table.
   - `supabase/migration_ensure_my_profile.sql` — creates `ensure_my_profile()` so users without a `profiles` row (missing trigger) get a row on next load; run this if people see “couldn’t load your society profile” while signed in.

### How to log in (committee)

1. Open **Sign in** (`/login`).
2. Use **Email** and **Password** for `sentosaekampunawale@gmail.com` (the account must exist — register first if needed).
3. After the SQL above, that user has **Admin** and can open **Admin** from the sidebar to **approve** pending users and see **all residents** (with email after migration), hall list shows **Booked by: name · flat**.

**Notifications:** Supabase sends signup/reset emails to the **applicant’s** address, not automatically to the committee inbox. To also email `VITE_SOCIETY_NOTIFY_EMAIL` on each signup, you’d add a small **Edge Function** or **webhook** (e.g. Resend) — not included in the default app.

## 2. Local environment

```bash
cd sento-ekam-portal
cp .env.example .env
```

Edit `.env` and set:

- `VITE_SUPABASE_URL` — **Project Settings → API → Project URL**
- `VITE_SUPABASE_ANON_KEY` — **anon public** key (never commit the service role key)
- `VITE_SOCIETY_NOTIFY_EMAIL` *(optional)* — society / committee email; shown on the home page (set the same on Vercel for production)
- `VITE_COMMITTEE_ADMIN_EMAIL` *(recommended)* — only this login email may open **Admin** (must match Supabase Auth email; set on Vercel too)

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

## Blank page on Vercel?

1. **Environment variables (most common):** Vite bakes `VITE_*` into the **build**. In **Vercel → Settings → Environment Variables**, add **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** for **Production** (same values as local `.env`), then **Redeploy**. If they are missing, older versions could crash at startup; the app now degrades gracefully, but auth still won’t work until these are set.
2. **Vercel → Settings → General → Build & Output Settings**
   - **Framework Preset:** **Vite** (not “Create React App”).
   - **Output Directory:** **`dist`** (override on if needed). CRA uses `build`; Vite uses `dist`.
   - **Development Command:** e.g. `npm run dev` or `vite` (not `react-scripts start`).
3. If the dashboard says *Production deployment differs from Project Settings*, align the **Project Settings** with the working production values (Vite + `dist`) and save.
4. In the browser **DevTools → Network**, reload and confirm **`/assets/index-….js`** returns **200** (JavaScript, not HTML).
5. **Supabase → Authentication → URL configuration:** set **Site URL** to your live URL (e.g. `https://sentosekamportal.vercel.app`).

