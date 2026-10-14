# Design: CS-1 Walking skeleton

**Author:** Zahra · **Date:** 2026-10-14 · **Ticket:** CS-1 · **Status:** draft

## Problem

Today CoachSlot exists only on paper: we have user stories, an ERD and three ADRs, but no running
app, no database, no automatic checks and no deploy. Because of that, every future feature would
have to solve setup, deployment and debugging at the same time as its own logic, and the hardest
bugs (the ones *between* the web app, the API, the database and the hosting) would show up late.
CS-1 builds an empty but real app through every layer. It is solved when all 7 acceptance criteria
pass: the website shows "CoachSlot" (AC1), `GET /health` reports the API and the database (AC2),
errors use one format (AC3), every response and log line carries a request id (AC4), the Week 1
tables come from a Drizzle migration (AC5), CI blocks a red PR (AC6), and a merge to `main` deploys
both apps (AC7).

## Decisions

### Decision 1: shared code in the monorepo

Situation: 1 developer, 2 apps (`apps/api`, `apps/web`). In CS-1 the web page only shows "CoachSlot",
so it shares no code with the API yet. The ticket already chose a pnpm monorepo.

**Option A: `packages/shared` now**
- **+** one ready place for shared types (e.g. the error format)
- **−** one more package to set up and keep working, for code nobody imports yet

**Option B: only `apps/api` and `apps/web`; add `packages/shared` later**
- **+** less setup this week; nothing unused to maintain
- **−** later we move some code from `apps/api` into `packages/shared` and fix the imports

**Choice:** B

**Why:** nothing is shared in CS-1, and in a pnpm monorepo adding a package later is just a new folder.

**What we give up:** a small move of code later.

**Revisit when:** the web app first needs a type from the API (probably the login forms in Week 3).

```
coachslot/
  apps/
    api/              NestJS + Drizzle schema and migrations
    web/              Next.js
  docs/               ADRs, ERD, design docs
  .github/            templates (CI workflow added on Day 5)
  package.json
  pnpm-workspace.yaml
```

Drizzle lives in `apps/api`, because only the API talks to the database.

### Decision 2: hosting for the API and the database

Situation: 1 developer, a learning project that must stay live for ~20 weeks, almost no users,
**$0 budget**. The database must keep its data for the whole program. The web app goes on Vercel (given).

**Option A: Railway (Hobby plan), API and Postgres together**
- **+** API and Postgres in one project; the database doesn't expire and the API doesn't sleep
- **+** deploys when `main` changes; health check on `/health`; a pre-deploy step can run migrations
- **−** costs about $5/month (more if usage grows), which breaks the $0 budget

**Option B: Render free web service for the API + Neon free plan for Postgres**
- **+** $0 for both
- **+** Neon's free database doesn't expire (Render's own free database is deleted after 30 days
  plus a 14-day grace period, around Week 6, so we don't use it)
- **−** the API sleeps after 15 min without traffic; the first request can wait ~1 minute
- **−** two services and two dashboards instead of one; Neon's free plan has limits
  (1 GB storage, 100 compute-hours a month, the database pauses after 5 min idle)

**Choice:** B

**Why:** the budget is $0, and B is the only option that costs $0 **and** keeps the data for 20 weeks.
Almost no users means a slow first request after sleep doesn't hurt anyone yet.

**What we give up:** a ~1 minute wake-up after idle, one more service to set up, and free-plan limits I must watch.

**Revisit when:** real gym users start using it (the wake-up becomes a real problem), or we get close
to Neon's 1 GB / 100 compute-hours limit, or either free plan changes its rules.

**Secrets:** `DATABASE_URL` (Neon's connection string) lives in Render's environment variables in
production, and in a local `.env` (in `.gitignore`) on my laptop. Never in the repo.

**Migrations:** Render's pre-deploy command may not be available on free instances, so the API's
start command runs the Drizzle migrate command first, then starts the API.
If the migration fails, the new version doesn't start and the deploy fails.
Drizzle skips migrations that already ran, so running it on every start is safe.

### Decision 3: one error format

Situation: in CS-1 the API can produce only a few errors: an unknown route (404) and an unexpected
crash (500). Login and forms come later.

Codes this week:

| HTTP | code | when |
|------|------|------|
| 404 | `NOT_FOUND` | the route or the record doesn't exist |
| 500 | `INTERNAL_ERROR` | any error we didn't expect |

Later: `VALIDATION_FAILED` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `CONFLICT` (409).

**Option A: one global exception filter for the whole API**
- **+** every error leaves the API through one place, so the shape can't drift
- **+** one place to hide internal details on a 500 and to log the full error
- **−** one more NestJS concept to learn; our own errors need a small exception class that carries a `code`

**Option B: each route builds its own error JSON**
- **+** nothing new to learn for one or two routes
- **−** easy to forget or to spell differently, so shapes drift
- **−** an unknown route never reaches any route code, so B can't produce the 404 in AC3 at all

**Choice:** A

**Why:** the 404 for an unknown route and unexpected crashes never pass through our route code.
Only a central filter can turn them into our format, and AC3 requires it.

**What we give up:** time to learn exception filters, and a small mapping from exceptions to codes.

**Revisit when:** we add a second transport (e.g. WebSockets) that needs its own error handling.

**Rule for 500s:** the client sees only a generic message and the requestId:
```json
{ "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong.", "requestId": "..." } }
```
The real error (stack trace, SQL, connection details) goes to the logs only, never to the client,
because it can leak secrets and how the system is built.

**`/health` is the one exception.** It's a status report, not an error, so it always returns its own body:
`200` with `{ "api": "ok", "database": "ok" }`, or `503` with `{ "api": "ok", "database": "down" }`.
It still has the `x-request-id` header (Decision 4).

### Decision 4: request ids

Situation: one API today, a web app calling it soon, and logs on Render that I search when
something breaks. I need to find every log line for one request quickly.

**Option A: the API always creates a new id**
- **+** simplest; the id format is always ours
- **−** if the web app (or a proxy) already has an id for the same click, we lose the link between them

**Option B: reuse the caller's `x-request-id` if it's valid; otherwise create a new one**
- **+** one id can follow a user's click from the web app into the API
- **+** tests and curl can send a known id and then search the logs for it
- **−** a caller could send a huge or strange value, so we must check it (at most 64 characters,
  only letters, numbers and dashes) and replace it if it's bad

**Choice:** B, with that check

**Why:** it costs only one check, and it makes debugging across web → API possible later.

**What we give up:** a few lines of validation, and trusting a value the client sent (after checking it).

How it works:
1. Middleware runs first on every request (even unknown routes). It takes or creates the id
   (a random UUID) and sets the `x-request-id` response header.
2. The logger adds the id to every log line for that request automatically, so no function has
   to pass it by hand. Candidates: `nestjs-pino`, or Node's `AsyncLocalStorage`.
   (I'll check both in the docs and choose in the AC4 issue.)
3. Logs are JSON lines with a `requestId` field, so I can search for one id.
4. The exception filter (Decision 3) reads the same id into the error's `requestId`.

**Revisit when:** we have more than one backend service. Then use the standard `traceparent` header
(OpenTelemetry) instead of our own.

## Data / API changes

| What | After CS-1 |
|---|---|
| Tables | The Week 1 ERD tables, created by the first Drizzle migration: `users`, `sessions`, `gyms`, `memberships`, `session_types`, `coach_session_types`, `working_hours`, `time_off`, `bookings`, `audit_entries`, including the partial unique index on `bookings` that stops double-booking |
| Endpoints | `GET /health` only. Every other path returns `404` in our error format |
| Response headers | `x-request-id` on every response |
| Web pages | `/` shows "CoachSlot" |

## Risks

| Risk | What I'll do |
|---|---|
| A secret (`DATABASE_URL`) is committed to git | `.env` in `.gitignore` from the first commit; secrets only in Render / Vercel / GitHub settings; check `git diff` before each commit |
| A migration fails on deploy | Run every migration locally and in CI (AC6) before merging; a failed migration stops the new version from starting, so I see it in the Render deploy log |
| The free API sleeps, so the first request (and Render's health check) waits ~1 minute | Accept it for now (no real users); open the API URL before a demo; revisit when real users come |
| We hit Neon's free limits (1 GB, 100 compute-hours a month) | Check Neon's usage page once a week during the weekly review |
| Migrations run on every start, including after sleep, so wake-up gets a bit slower | Accept it: Drizzle skips migrations that already ran; revisit if wake-up gets much slower |
| A free plan changes its rules | The "Revisit when" in Decision 2; the data lives in plain Postgres, so I can move it with `pg_dump` |

## Test plan

| AC | How I'll prove it | Automatic or by hand? |
|---|---|---|
| AC1 | Open the Vercel URL and see "CoachSlot" | By hand |
| AC2 | A test calls `GET /health` and expects `200` with `api: ok` and `database: ok`; then `curl` the live URL | Automatic + by hand |
| AC3 | A test calls `GET /does-not-exist` and expects `404` with `code: NOT_FOUND` and a `requestId` | Automatic |
| AC4 | A test checks the `x-request-id` header (a new one, and a valid one I send is reused); then `curl` with a known id and find it in the Render logs | Automatic + by hand |
| AC5 | CI runs the migration on an empty Postgres and the tests pass; I check the tables exist in Neon | Automatic + by hand |
| AC6 | Open a PR with a lint error on purpose: CI goes red and the merge button is blocked; fix it and CI goes green | By hand (once) |
| AC7 | Merge a tiny change to `main` and see both Vercel and Render deploy it on their own | By hand (once) |
