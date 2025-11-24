## Overview
Next.js 16 (App Router) starter using Tailwind CSS v4, shadcn/ui tokens, and Sentry already wired for server/edge/client. GA4 is opt-in via `@next/third-parties/google`.

## Use as a GitHub template
- Click **Use this template** on GitHub to create a new repo.
- After cloning, copy `.env.example` to `.env.local` and fill required keys.
- Remove any unneeded sample configs; Sentry/GA4 stay inactive until env vars are provided.

## Prerequisites
- Node 20+, Bun (preferred package manager)
- Copy `.env.example` to `.env.local` and fill in monitoring/analytics keys:
  - `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - Optional sampling: `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`

## Scripts
- `bun dev` — start dev server
- `bun build` — production build
- `bun start` — serve built app
- `bun lint` — ESLint

## Notes
- Sentry config lives in `sentry.*.config.ts` with shared options in `config/sentry.ts`; instrumentation auto-loads via `instrumentation.ts`.
- GA4 loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set; see `app/layout.tsx`.
- UI tokens and Tailwind globals are in `app/globals.css`; utility helpers in `lib/utils.ts`.
