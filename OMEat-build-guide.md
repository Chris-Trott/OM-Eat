# OMEat Build Guide

**Purpose:** a staged plan to take OMEat from nothing to a live Phase 1 site, using Claude Code for the build and manual click-by-click steps for the platform setup. Pair this with `CLAUDE.md`, which lives in the repo root and gives Claude Code the standing context.

**How to use it:** work through the stages in order. Each stage ends with a verification checklist; do not move on until it passes. Stages 0 to 2 are mostly you clicking. Stages 3 onward are mostly Claude Code, with you supplying secrets and doing dashboard steps where flagged.

**Target:** brief says "days not weeks". Stages 0 to 2 are an evening. Stages 3 to 7 are realistically two to four Claude Code sessions.

---

## Stage 0: Decisions before touching anything

These are the brief's open items. Settle them now; everything downstream references them.

- [ ] **Domain name.** Buy it before the WhatsApp link goes out. A `.uk` or `.com` from any registrar is fine; Vercel handles the DNS side later (Stage 2). You can build against the free `omeat.vercel.app` style URL and add the domain last, so do not block on this.
- [ ] **Destination list at launch.** Pick the LGW routes that get pages on day one. Recommendation: seed 15 to 20 destinations even where there are no Finds yet, because the "Nothing found here yet. Be the first." page is itself a submission prompt. Write the list as `IATA code, city, country` triples; it becomes seed data in Stage 4.
- [ ] **Seed Finds.** Two or three Finds you and colleagues can write yourselves, so the WhatsApp link never lands on an empty site. Draft them against the field list in the brief (section 8) now, in a notes app; they get entered through your own admin panel in Stage 7 as its first real test.
- [ ] **Second curator.** Get their email address; you will create their login in Stage 2.
- [ ] **Supabase organisation arrangement.** Verified against current Supabase docs (July 2026): the free plan allows **2 active projects counted across all organisations where you are Owner or Admin**, and paused projects do not count. Flown and Found plus OMEat fits exactly, but check you are not Owner/Admin of any other org with an active free project. Recommendation: create a **new free organisation named "OMEat"** for this project. That keeps the later plan of moving Flown and Found to its own account clean, since plans are set per organisation.

---

## Stage 1: GitHub repository

1. Go to github.com, click the **+** (top right), then **New repository**.
2. Name: `omeat`. Visibility: **Private** (nothing in the brief needs it public, and curators' patterns stay private).
3. Do **not** initialise with a README, .gitignore, or licence. Claude Code will scaffold the project and an empty repo avoids merge friction.
4. Click **Create repository** and keep the page open; you will need the remote URL in Stage 3.

- [ ] Verify: empty private repo `omeat` exists and you have its `git@github.com:you/omeat.git` URL.

---

## Stage 2: Supabase project

### 2.1 Create the organisation and project

1. Log into supabase.com, open the org switcher (top left), click **New organization**.
2. Name it `OMEat`, plan **Free**, create.
3. Inside the new org, click **New project**.
   - Name: `omeat`
   - Database password: generate a strong one and store it in your password manager. You rarely need it (the app uses API keys), but you cannot easily view it again.
   - Region: **West EU (London)** or closest available. Crew are UK-based; latency and data locality both point here.
4. Wait for provisioning (a minute or two).

### 2.2 Collect the keys

1. In the project, go to **Settings → API** (or **Project Settings → API keys** depending on current dashboard layout).
2. Copy into your password manager:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / publishable key** (safe in the browser; RLS is what protects data)
   - **service_role / secret key** (server only, never shipped to the client; Claude Code must only ever use it in server-side code)

> **Gotcha (verified July 2026):** Supabase is rolling out an explicit Postgres grants requirement for the Data API on new projects created after 30 May 2026. If API calls fail with permission errors despite correct RLS policies, check the Supabase dashboard notices for the grants migration and apply the suggested grants. Mention this to Claude Code if it happens; it is a known platform change, not a bug in your code.

### 2.3 Auth: curator accounts only

1. Go to **Authentication → Providers**. Ensure **Email** is enabled.
2. Go to **Authentication → Sign In / Providers settings** and **disable public sign-ups** (toggle usually named "Allow new users to sign up"). OMEat has no public accounts; the only users are two curators, created by hand.
3. Go to **Authentication → Users → Add user → Create new user**. Create yourself and the second curator with email + password. Tick "auto confirm" if offered so no email round-trip is needed.

### 2.4 Storage bucket

1. Go to **Storage → New bucket**.
2. Name: `find-images`. Set it **Public** (read). Writes will be restricted by policy so only authenticated curators (and the server-side submission route) can upload.
3. Optional but recommended: set an upload size limit on the bucket of 1 MB as a backstop. Client-side compression (Stage 6) is the real control; this is the belt to its braces.

- [ ] Verify: project live; three keys stored; two curator users exist and can log into the Supabase dashboard-hosted auth (they will really log in via `/admin` later); `find-images` bucket exists; public sign-up disabled.

---

## Stage 3: Scaffold, Vercel, and the keep-alive cron

### 3.1 Scaffold with Claude Code

In an empty local folder, tell Claude Code roughly:

> Scaffold a new Next.js App Router project (current stable, TypeScript, Tailwind) named omeat, add @supabase/supabase-js and @supabase/ssr, create a .env.local with placeholders for NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET, add .env.local to .gitignore, initialise git, and push to git@github.com:YOU/omeat.git. Read CLAUDE.md first.

Copy `CLAUDE.md` (the companion file to this guide) into the repo root **before** this prompt, then fill in the real values in `.env.local` yourself. Never paste the service role key into the chat; edit the file directly.

> **Version note:** "current stable" is deliberate. If you would rather mirror Flown and Found exactly, paste its `package.json` to Claude Code at this point and say "match these framework versions". Otherwise let Claude Code use the latest stable Next.js and Supabase JS v2; the patterns are the same.

### 3.2 Create the Vercel project

1. Log into vercel.com, click **Add New → Project**.
2. Import the `omeat` GitHub repo (grant Vercel access to it if prompted).
3. Framework preset: Next.js is auto-detected. Before deploying, open **Environment Variables** and add all four variables from `.env.local`. Mark `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as available to **Production** (and Preview if you want preview deploys to work against the same database, which at this scale is fine).
   - `CRON_SECRET`: generate a random string of 32+ characters from your password manager. Vercel automatically sends this as an `Authorization: Bearer` header when it invokes your cron route, so the route can reject anyone else.
4. Click **Deploy**. First deploy of the bare scaffold should succeed; that green check is your CI baseline.

### 3.3 The keep-alive cron (mandatory, do not skip)

Facts verified against Vercel and Supabase docs, July 2026:

- Supabase free projects pause after **7 days of low database activity**. "A few user requests to the database each day" is typically enough to stay awake. A paused project must be manually restored from the dashboard, and there is a 90-day restore window.
- Vercel Hobby cron jobs are limited to **once per day maximum**, fire at an unpredictable minute **within the scheduled hour**, run **only on the production deployment**, and are best-effort (occasional missed runs possible).

Once per day comfortably beats the 7-day window even with a couple of missed runs. Critically, the ping must generate **database activity**, not just load a page; a cheap `select` through the Supabase client is the right shape.

Tell Claude Code:

> Add a route handler at /api/cron/keepalive that (1) rejects requests whose Authorization header is not `Bearer ${CRON_SECRET}`, (2) uses the server-side Supabase client to run a trivial select against the destinations table, (3) returns 200 with a timestamp. Add a vercel.json crons entry running it once daily. Note Vercel Hobby only allows daily cron expressions, so use something like "0 3 * * *".

5. After the next deploy, check **Vercel → Project → Settings → Cron Jobs** shows the job, then use its **Run** / logs view to confirm a 200.

- [ ] Verify: repo pushed; Vercel production deploy green; env vars set; cron job listed and returning 200 in its logs.

---

## Stage 4: Database schema and seed data

This is a Claude Code stage; your only manual part is running the migration. Two workable paths: Supabase CLI migrations (preferred, since it keeps schema in the repo), or pasting SQL into the dashboard **SQL Editor**. Ask Claude Code to set up the CLI path (`supabase init`, `supabase link`, migrations in `supabase/migrations/`).

Direct Claude Code to build the schema from `CLAUDE.md`'s data model section. In outline:

- `destinations`: id, IATA code, city, country, slug.
- `finds`: id, destination_id, dish, place, airside (boolean, **not null**), terminal_area, walking_time, cost text + currency, payment (cash/card/both), opening_hours, directions, maps_url (nullable, landside only), submitter_display (nullable, "first name + last initial" as a single stored string), status (`published`/`archived`), confirm_count, last_confirmed_at, timestamps.
- `find_images`: id, find_id, storage path, alt text, sort order.
- `submissions`: id, type (`new_find`/`update`), find_id (nullable), payload jsonb, submitter_display, status (`pending`/`published`/`rejected`), created_at. **Everything from the public forms lands here and only here.**
- `confirms`: id, find_id, created_at, device_hash (see Stage 5 notes). Plus a trigger or RPC that bumps `finds.confirm_count` and `last_confirmed_at`.

**Row Level Security, the load-bearing part.** Have Claude Code enable RLS on every table with policies to this effect:

- Public (anon) **read** on `destinations`, published `finds`, `find_images`.
- Public (anon) **no direct writes anywhere**. Submissions and confirms are written by **server route handlers using the service role key**, which is where the honeypot check and rate limiting live. This is simpler and safer than anon insert policies.
- Authenticated curators: full read/write on everything.

Then seed: give Claude Code your Stage 0 destination list and have it write a seed migration or script.

- [ ] Verify: run the migration; in Supabase **Table Editor** all five tables exist with RLS enabled (shield icon); destinations table contains your list; the anon key cannot insert into `finds` (Claude Code can write a quick check script).

---

## Stage 5: Public site, submission path first

The brief's ordering rule: **the submission path must exist before reading is polished.** Build in this order.

### 5.1 Submission form ("Add a Find")

- All fields from the data model, airside/landside as a required, prominent choice, not buried in a dropdown.
- **Honeypot field**: a visually hidden input that humans never fill; server route silently drops any submission where it is non-empty.
- Optional image upload, compressed client-side (Stage 6) but stored against the submission, not published.
- Posts to a server route handler that validates, checks the honeypot, rate-limits by IP (a simple in-memory or database-backed counter is proportionate here), and inserts into `submissions` with the service role client.
- Confirmation screen in ops-manual voice ("Submission logged. A curator will review.").

### 5.2 Update details form

Same pipeline, `type = 'update'`, reachable from every Find page, free-text body plus optional field corrections.

### 5.3 👍 Confirm

- One tap, no typing, no login. Server route inserts a `confirms` row and updates the Find's count and date.
- **One confirm per device per Find:** store confirmed Find IDs in `localStorage`; the button renders as already-confirmed when present. Belt-and-braces on the server: a hashed, non-reversible device token in a cookie checked against `confirms.device_hash`, plus rate limiting. Honest-system security, per the brief; do not gold-plate it.
- Display format exactly: **"Confirmed by 12 crew, last on 3 June 2026."**

### 5.4 Read pages

- **Home:** what OMEat is, ops-manual register, route to destinations, prominent "Add a Find".
- **Destinations:** list grouped by country.
- **Destination page:** its Finds; if none, the explicit "Nothing found here yet. Be the first." with the Add a Find link.
- **Find page:** full detail, the airside/landside badge as the visually loudest element on the page, Confirm control, Update details link, freshness line.

- [ ] Verify, end to end on the production URL: submit a test Find (arrives in `submissions`, not on the site); submit with the honeypot filled via curl (silently dropped); tap Confirm (count and date update, second tap on same device blocked); empty destination shows the invitation copy; airside badge legible at arm's length on a phone.

---

## Stage 6: Images and compression

The brief is blunt: **compression on upload is a requirement, not an optimisation.** 1 GB of storage is ample for 50 compressed images and nothing at all for raw phone photos.

- Client-side compression before upload (e.g. `browser-image-compression` or canvas-based resize): cap at roughly 1600 px on the long edge and target well under 300 KB per image as JPEG/WebP.
- The bucket's 1 MB limit from Stage 2.4 backstops any client that bypasses compression.
- Submitter images attach to the submission; only the curator publishes images to a Find (including, in Phase 2, the annotated Google Earth screenshots).
- Serve via Next.js `<Image>` against the public bucket URL.

- [ ] Verify: upload a 4 MB phone photo through the form; the object landing in `find-images` (or the submissions staging path) is under ~300 KB and looks acceptable.

---

## Stage 7: /admin

- Route group under `/admin`, unlinked from the public site, wrapped in Supabase auth (email + password, the two accounts from Stage 2.3). Middleware redirects unauthenticated visitors to a plain login page.
- **Queue view:** pending submissions, oldest first. Each expands to full payload; actions are **Publish** (creates/updates the Find), **Edit then publish**, **Reject**.
- **Content editing:** list of all Finds with edit forms; archive control; image management (attach, reorder, replace with annotated versions).
- Publishing a `new_find` submission maps payload → new `finds` row; publishing an `update` shows the diff against the current Find for the curator to apply.

- [ ] Verify: log in as each curator; publish one of your seed Finds from a real submission you made yourself in Stage 5; confirm it appears publicly; reject a junk submission and confirm nothing appears.

---

## Stage 8: Launch

- [ ] Enter the remaining seed Finds through the submission form + admin queue (this doubles as UAT).
- [ ] Add the custom domain: **Vercel → Project → Settings → Domains → Add**, then set the DNS records Vercel shows you at your registrar (usually a CNAME for `www` and A/ALIAS for the apex). Wait for the tick.
- [ ] Phone pass: every page on a real phone, on mobile data, because that is the crew bus.
- [ ] Confirm the cron has run at least once on the domain-era deployment (Vercel cron logs).
- [ ] Write the WhatsApp message. Per the brief, the ask is **"stick your finds in here"** with the link going straight to the submission form, not the homepage.

---

## Phase 2 backlog (weeks after, in brief order)

1. Ratings + text reviews: score plus optional text, **text only, no images**, unmoderated like Confirm (device limit + rate limit), never expires, kept visually and semantically separate from Confirm.
2. Annotated Google Earth direction images (curator workflow only).
3. Stale-Find flagging: a Find whose `last_confirmed_at` is older than a threshold (suggest 6 months) gets a stale badge on the page and rises to the top of a curator queue view.

**Binding out-of-scope list (from the brief, restated so it survives into every session):** search, public user accounts, notifications, map views, feeds, monetisation of any kind, maps APIs.

---

## Standing risks to re-check monthly

| Check | How |
|---|---|
| Supabase project still active | Dashboard shows project not paused; cron logs green |
| Storage usage | Supabase → Settings → Usage; should be tens of MB, not hundreds |
| Free-tier terms drift | Supabase pricing page and Vercel cron docs; both changed within the last year, so recheck before relying on numbers in this guide |
| Submission queue age | Oldest pending item under a week |
