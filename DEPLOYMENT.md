# Deployment

This app is a static SPA hosted on **Vercel** at https://nhl.somedaytundra.com. There is no server
here, apart from one cron-only Vercel Function (below). `www.somedaytundra.com` and the apex belong
to the SomedayTundra dashboard (separate repo and Vercel project), which redirects this app's old
`www` paths (`/nhl_standings` and the rest) here.

- **CD** is Vercel's GitHub integration: every push to `main` builds (`npm run build` → `dist/`)
  and goes live; every PR/branch gets a preview URL. Nothing in this repo publishes.
- **CI**: `.github/workflows/ci.yml` runs the build (type check included) on pushes and PRs.
- **API base URL** comes from `VITE_API_BASE_URL` at build time (`src/lib/apiConfig.ts`).
  `.env.production` sets `https://api.somedaytundra.com/api`; a Vercel project env var of the same
  name overrides it. Previews call the production API, which allows them via its
  `CORS_ALLOW_ORIGIN_REGEX`.
- **Sign-in**: `VITE_CLERK_PUBLISHABLE_KEY`, set per environment in the Vercel project. Production
  gets the Clerk production instance's `pk_live_…` key, the same one the dashboard uses, so both
  apps share one session across `somedaytundra.com` subdomains. Preview gets the development
  `pk_test_…` key, because a live key only works on `somedaytundra.com` hosts. It's baked in at
  build time: redeploy after changing it. Without it the app runs signed out.
- **Domain**: connected from the Vercel team's **Domains** page (`somedaytundra.com` → Connect), with
  `CNAME nhl` in Route 53. DNS stays in Route 53.
- **SPA routing** (TanStack Router, clean URLs): `vercel.json` rewrites every path except `/api/*`
  to `/index.html`.
- **Daily farm trigger**: a Vercel Cron Job (`crons` in `vercel.json`, 11:00 UTC; on the Hobby plan
  it fires sometime within that hour) calls `api/trigger-farm.ts`, which starts the server repo's
  `farm.yml` via `workflow_dispatch`. GitHub's own schedule was running hours late; it's now just a
  fallback. Crons only run on the production deployment. Needs two Vercel env vars (Production):
  - `CRON_SECRET`: any long random string. Vercel sends it on cron calls, and the function
    rejects calls without it.
  - `FARM_DISPATCH_TOKEN`: a fine-grained GitHub PAT, repository access limited to
    `nhl_stats_server_fastapi`, permission **Actions: Read and write**.

  To test it by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://nhl.somedaytundra.com/api/trigger-farm`
  (PowerShell: `curl.exe -H "Authorization: Bearer $env:CRON_SECRET" …`) should return
  `{"ok":true}`, and a new run should appear under the server repo's Actions tab.

The full end-to-end runbook (Fly.io, MongoDB Atlas, Route 53 DNS, secrets) lives in the server
repo: `nhl_stats_server_fastapi/DEPLOYMENT.md`.
