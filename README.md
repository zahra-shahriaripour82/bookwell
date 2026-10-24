# CoachSlot

CoachSlot lets clients of small gyms book 1-to-1 sessions with a coach online, while the owner and coaches always see the same accurate schedule.

## Live

| Part    | URL |
|---------|-----|
| Website | https://coachslot-web.onrender.com |
| API     | https://bookwell-d8bi.onrender.com/ |
| Health  | https://bookwell-d8bi.onrender.com/health |

> Free hosting sleeps when unused. The first visit can take about a minute.

## Tech stack

- **Web:** Next.js (React), the page clients and coaches see
- **API:** NestJS (TypeScript), the backend with logging, request ids and error handling
- **Database:** PostgreSQL 17 (local: Docker Compose, production: Neon)
- **ORM / migrations:** Drizzle ORM + drizzle-kit, which create and update the tables
- **CI:** GitHub Actions: lint, typecheck, migrations, build and tests on every PR
- **Hosting:** Render (one web service for the API, one for the website)
- **Package manager:** pnpm workspace (monorepo)

## Project structure

```
apps/
  api/    NestJS API, Drizzle schema and migrations, tests
  web/    Next.js website
docs/     product brief, quality attributes, modules, ADRs, design docs
db/       Week 1 raw SQL schema
```

## Run it locally

Requirements: Node 24, pnpm 12, Docker.

1. Copy the env files and set your own local password:
   `cp .env.example .env`, then create `apps/api/.env` with
   `DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>` (the same values as in `.env`)
2. Start the database: `docker compose up -d`
3. Install packages: `pnpm install`
4. Create the tables: `pnpm --filter api exec drizzle-kit migrate`
5. Start the API: `pnpm --filter api start:dev`
6. Check it works: open `http://localhost:3001/health` and expect `{"api":"ok","database":"ok"}`

To start the website: `pnpm --filter web dev`, then open `http://localhost:3000`.

## Tests and checks

These are the same checks CI runs.

- Lint: `pnpm --filter api lint` and `pnpm --filter web lint`
- Typecheck: `pnpm --filter api exec tsc --noEmit`
- Unit tests: `pnpm --filter api test`
- E2E tests: `pnpm --filter api test:e2e` (needs the local database running)

## How deploy works

Every pull request runs CI on GitHub Actions. When a PR is merged into `main`, CI runs again, and if it passes, it calls Render's deploy hooks. Render then rebuilds the API and the website. When the API starts, it first runs the database migrations on Neon, then starts the server. Render checks `/health` before it sends traffic to the new version.

## Docs

- [Product](docs/01-product.md)
- [Quality attributes](docs/02-quality-attributes.md)
- [Modules](docs/03-modules.md)
- [ADRs](docs/adr/)
- [Design: CS-1 walking skeleton](docs/design/cs-1-walking-skeleton.md)
- [User stories](docs/user-stories.md)

## Progress

### Week 1
- Requirements
- ERD
- ADRs
- Raw SQL schema

### Week 2 (CS-1 walking skeleton)
- Monorepo with NestJS API and Next.js website
- API connected to Postgres with Drizzle, and the Week 1 tables created by a migration
- `/health` endpoint that checks the database
- Error handling with one error format and request ids in the logs
- CI on GitHub Actions with a real Postgres
- API and website deployed on Render, with Neon as the production database
