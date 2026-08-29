# Done Doer

The **worker-facing** app of the Done marketplace — one of three separate
Next.js apps (Done = customer, Doer = worker, Done Admin = internal
dashboard) that share ONE Supabase backend. Onboarding/verification,
availability, the open job pool, accept/decline, navigate, in-task
messaging, status updates with required photo proof, earnings/tips/ratings,
and Stripe Connect payouts.

## Stack

- Next.js (App Router, Turbopack, TypeScript) + Tailwind
- Supabase (Postgres, Auth, RLS, Storage, Realtime) — shared with the Done and Done Admin apps
- Stripe Connect Express (payout account onboarding only — the webhook and Checkout live in the Done app)
- Deploy: GitHub `main` → Vercel (git-linked auto-deploy)

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + Stripe keys
npm run dev
```

## Database

Schema, RLS policies, and storage bucket policies live in `supabase/migrations/`,
applied in order (`0001` → `0008`) against the SAME Supabase project used by
the Done and Done Admin apps. See `supabase/migrations/*.sql` for the task
lifecycle state machine, RLS-as-boundary patterns, the payout trust gate,
messaging, tips, Doer availability, account suspension, and rating
aggregation.

The authoritative state machine lives in `src/lib/task-state-machine.ts`
and is identical across all three apps by design. Every status-changing
write goes through `src/lib/task-transitions.ts` (atomic conditional
update + status-history log). This app only initiates the Doer-legal
transitions (accept, en route, arrived, start, complete, cancel) — the
Requester-only ones (confirm & pay, report a problem) live in the Done app.

## Availability vs. visibility

`doer_profiles.is_available` (the toggle on `/profile`) is purely a
for-your-reference signal — it never gates which tasks a Doer can see in
the job pool. Every approved, non-suspended Doer sees every open task,
always. Don't reintroduce a visibility filter keyed on availability — see
the schema comment on that column.

## Realtime

`src/lib/realtime.ts` wraps Supabase Realtime so the job pool, my-jobs
list, and messages update live — a Doer never needs to manually refresh to
see a new open task or a status change made from the Done or Admin app.

## Scripts

- `npm run dev` — local dev server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript, no emit
- `npm run build` — production build
