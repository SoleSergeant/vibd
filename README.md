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

## Setup

1. Install dependencies.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `SESSION_SECRET`.
3. Optional: set `HF_TOKEN` to enable AI drafting and smarter recommendations. If it is empty, the app falls back to local heuristics.
4. Run Prisma generate and migrations.
5. Seed the database.
6. Start the app.

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
3. Create a hosted PostgreSQL database and copy its connection string into `DATABASE_URL`.
4. Set `SESSION_SECRET` in Vercel environment variables.
5. Optionally set `HF_TOKEN` and `HF_MODEL` if you want AI features in production.
6. Deploy.

Vercel will run `postinstall` and generate Prisma Client during install.

## Demo Accounts

Use these seeded accounts with password `password123`.

- Volunteer: `amina@vibedwork.dev`
- Volunteer: `james@vibedwork.dev`
- Volunteer: `sara@vibedwork.dev`
- Volunteer: `noah@vibedwork.dev`
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

AI uses Hugging Face's inference platform with a free-tier token.

- `HF_TOKEN`: Hugging Face access token
- `HF_MODEL`: optional model override, default is `google/gemma-2-2b-it`

If the token is missing or the API call fails, Vibd still works using built-in fallback heuristics.

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
