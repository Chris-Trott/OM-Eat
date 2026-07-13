# CLAUDE.md — OMEat

Standing context for Claude Code. Read this before any task in this repo. Where this file and an ad hoc instruction conflict on scope, flag it rather than silently complying: scope creep is a named project risk.

## What this is

OMEat is a small, permanent, low-traffic reference site where BA Euroflyer crew at London Gatwick record what to eat at each destination during a turnaround. "Ops Manual E" plus "eat". A curated guide fed by a submission queue. It is not a feed, not a social network, not a business.

Audience: ~280 pilots. Expected content: 10 to 15 destinations, one or two Finds each, ~50 images ever. **Resolve every scaling or architecture decision in favour of the simplest option that works at this size.** If a solution mentions queues, caching layers, or search infrastructure, it is wrong.

## Tone

The joke is the marketing: the site speaks in the deadpan register of a genuine airline operations manual, about pastries. Homepage copy, headings, form confirmations and error messages all keep a straight face. Never explain the joke in the UI.

## Glossary (use these exact words in code, database, and UI)

- **Find**: one specific thing to eat, at one specific place, at one destination. The atom of content. Not a restaurant, not a city.
- **Destination**: an airport BAEF serves from LGW. Has a page collecting its Finds.
- **Confirm**: one-tap 👍 meaning "this information is correct". A statement about **accuracy**. Refreshes `last_confirmed_at`.
- **Rating** (Phase 2): score plus optional text about **quality**. Never expires.
- **Confirm and Rating are never merged into one control.** This is a hard rule; the freshness signal dies otherwise.
- **Submission**: a proposed new Find or a correction. Enters the queue; never appears publicly until a curator publishes it.
- **Curator**: authenticated admin. Two accounts exist. There are no other user accounts of any kind.

## Stack

- Next.js, App Router, TypeScript, Tailwind. Deployed on Vercel Hobby.
- Supabase (free tier): Postgres, Auth (curators only), Storage (`find-images` bucket).
- `@supabase/supabase-js` v2 with `@supabase/ssr` for server/client split.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only, never in client bundles), `CRON_SECRET`.
- Schema lives in `supabase/migrations/`; never change schema outside a migration.

## Free-tier constraints (treat as invariants)

1. Supabase free projects pause after ~7 days without database activity. `/api/cron/keepalive` (Vercel cron, daily, `Authorization: Bearer CRON_SECRET` checked) performs a trivial select to prevent this. Never remove or break this route.
2. Vercel Hobby crons run at most once per day and only on production. Do not add cron expressions more frequent than daily; the deploy will fail.
3. Storage is 1 GB total. **Image compression on upload is a requirement, not an optimisation**: client-side compress to ≤1600 px long edge, target under ~300 KB. The bucket also enforces a 1 MB cap.
4. No paid APIs of any kind. **No maps API, no API keys with billing attached.** Directions are text plus curator-annotated images; landside Finds may carry a single plain `maps_url` link pasted by the submitter.

## Data model

Tables: `destinations`, `finds`, `find_images`, `submissions`, `confirms`.

Key `finds` fields: dish, place, destination_id, **airside (boolean, not null; the single most important field on the site, rendered as a hard prominent badge)**, terminal_area, walking_time, cost + currency, payment method, opening_hours, directions (free text, primary mechanism for airside), maps_url (landside only, nullable), submitter_display (optional, stored only as "First name + last initial", never more), status, confirm_count, last_confirmed_at.

Freshness display format, exactly: `Confirmed by 12 crew, last on 3 June 2026.`

## Security and trust model

- **Public read everywhere. No login to read anything.**
- Rule: *moderated writes are open; unmoderated writes need a check.*
  - Submissions and Update details: open, no password, always queued. Honeypot field checked server-side; silently drop on trip. Rate limit by IP.
  - Confirm: unmoderated, writes live. One confirm per device per Find (`localStorage` client-side, hashed device token server-side) plus rate limiting. Proportionate, honest-system security; do not gold-plate.
  - There is deliberately **no shared crew password**. Do not add one.
- All public writes go through **server route handlers using the service role key**. Anon key has no insert/update/delete policies anywhere. RLS is enabled on every table.
- Reviews (Phase 2) are **text only. Never allow image upload on any unmoderated path.** Images reach the site only via the moderated submission → curator publish flow.
- `/admin` is unlinked from the public site and auth-walled (Supabase email auth, curator accounts created manually, public sign-up disabled).

## Out of scope, permanently (binding)

Search. User accounts beyond the two curators. Notifications. Map views or map applications. Feeds or anything social beyond Confirm/Ratings. Ads, monetisation, analytics beyond what Vercel provides by default, cookie consent banners (nothing requiring one may be added).

If a requested feature belongs to this list, say so and stop.

## Conventions

- Keep it boring: server components by default, client components only where interaction demands (Confirm button, forms, image compression).
- Small files, no premature abstraction. This codebase should be readable by its owner, a pilot who debugs it between flights.
- Mobile first: the primary device is a phone on a crew bus. Test narrow viewports first.
- Prefer database constraints and Postgres triggers (e.g. confirm_count maintenance) over application-side bookkeeping.
- Copy in UK English, ops-manual register.
