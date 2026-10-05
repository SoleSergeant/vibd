# Vibd

Vibd is an MVP web platform for volunteers and early-career talent to prove skills through real work, while organizations discover and hire from verified impact history.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Simple role-based auth with signed cookies
- Hugging Face Inference for optional AI features
- OpenAI Responses API for the volunteer job chatbot

## Setup

1. Install dependencies.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `SESSION_SECRET`.
3. Optional: set `HF_TOKEN` to enable AI recommendations, skill matching, impact CV generation, and message drafting. If it is empty, the app falls back to local heuristics.
4. Optional: set `OPENAI_API_KEY` and `OPENAI_MODEL` to enable the volunteer job chatbot. Vibd uses OpenAI's Responses API for this feature. If the key is empty, the chatbot falls back to a built-in job coach response.
5. Run Prisma generate and migrations.
6. Seed the database.
7. Start the app.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Deploy

The simplest production path is:

1. Push the repo to GitHub.
2. Import the GitHub repo into Vercel.
3. In the Vercel project, open **Storage** and connect a **Neon** Postgres database (Production and Preview, no custom prefix). It provides `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct), which is what Prisma reads.
4. Set `SESSION_SECRET` in Vercel environment variables to a long random string (32+ characters, e.g. `openssl rand -base64 48`). The app refuses to start in production without it.
5. Optionally set `HF_TOKEN` and `HF_MODEL` if you want AI features in production.
6. Optionally set `OPENAI_API_KEY` and `OPENAI_MODEL` if you want the OpenAI-powered chatbot in production.
7. Deploy.

On Vercel the `vercel-build` script runs `prisma migrate deploy`, then seeds the demo data **only if the database has no users yet**, then builds the app. Preview and Production deployments share the same database, so migrations from a preview branch apply to it too.

Vercel will run `postinstall` and generate Prisma Client during install.

## Verifying Organizations

Organizations must be verified before they can message volunteers. Verify (or revoke) an account from the command line:

```bash
npm run org:verify -- hello@citykind.org
npm run org:verify -- hello@citykind.org --revoke
```

## Demo Accounts

Use these seeded accounts with password `password123`.

- Volunteer: `amina@vibedwork.dev`
- Volunteer: `james@vibedwork.dev`
- Volunteer: `sara@vibedwork.dev`
- Volunteer: `noah@vibedwork.dev`
- Volunteer: `maya@vibedwork.dev` - strongest demo account
- Organization: `hello@citykind.org`
- Organization: `ops@northstarstudio.co`

## What Works in This MVP

- Sign up and sign in with role selection
- Volunteer dashboard, profile, portfolio, and inbox
- Organization dashboard, task creation, task editing, review, shortlist, discovery, and inbox
- Workboard and leaderboard
- Submission review with acceptance, ratings, and portfolio updates
- Direct outreach and invite threads between verified organizations and volunteers
- AI outreach suggestions and AI-ranked task recommendations

## AI Setup

AI uses Hugging Face's inference platform for recommendations, matching, impact CVs, and message drafting.

- `HF_TOKEN`: Hugging Face access token
- `HF_MODEL`: optional model override, default is `google/gemma-2-2b-it`

The volunteer job chatbot uses OpenAI's Responses API.

- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: optional model override, default is `gpt-5.1`

If either provider key is missing or the API call fails, Vibd still works using built-in fallback heuristics.

## Mocked vs Production-Ready

### Mocked

- The auth system uses a simple signed cookie instead of NextAuth.
- File attachments are URL fields rather than full upload storage.
- Discovery, ranking, leaderboard logic, and AI fallbacks are intentionally simple.
- Seed data is demo content and can be reset with Prisma seed.

### Production-ready direction

- Replace the cookie auth with NextAuth or a stronger auth provider.
- Add file uploads and object storage for submissions.
- Add moderation, spam protection, and stricter organization verification.
- Recompute rankings and leaderboards on a scheduled job or database trigger.
- Add notifications, audit logging, and richer task workflow states.
