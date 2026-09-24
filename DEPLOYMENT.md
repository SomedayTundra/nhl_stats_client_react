# Deployment

This app is a static SPA hosted on **Vercel** at https://www.somedaytundra.com (the apex
`somedaytundra.com` redirects there). There is no server here.

- **CD** is Vercel's GitHub integration: every push to `main` builds (`npm run build` → `dist/`)
  and goes live; every PR/branch gets a preview URL. Nothing in this repo publishes.
- **CI**: `.github/workflows/ci.yml` runs the build (type check included) on pushes and PRs.
- **API base URL** comes from `VITE_API_BASE_URL` at build time (`src/lib/apiConfig.ts`).
  `.env.production` sets `https://api.somedaytundra.com/api`; a Vercel project env var of the same
  name overrides it. Previews call the production API, which allows them via its
  `CORS_ALLOW_ORIGIN_REGEX`.
- **SPA routing** (TanStack Router, clean URLs): `vercel.json` rewrites every path to `/index.html`.

The full end-to-end runbook (Fly.io, MongoDB Atlas, Route 53 DNS, secrets) lives in the server
repo: `nhl_stats_server_fastapi/DEPLOYMENT.md`.
