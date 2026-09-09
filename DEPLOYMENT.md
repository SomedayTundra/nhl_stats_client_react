# Deployment

This app is a static SPA: `npm run build` → `dist/` → S3 + CloudFront. There is no server here.

- **API base URL** comes from `VITE_API_BASE_URL` at build time (`src/lib/apiConfig.ts`).
  `.env.production` sets the deployed value; without it the app talks to `http://localhost:8000/api`.
- **SPA routing** (TanStack Router, clean URLs) needs the host to serve `/index.html` for unknown
  paths — configured as CloudFront custom error responses, not in this repo.
- **CI**: `.github/workflows/deploy.yml` builds and publishes on push to `main`, gated by the
  `DEPLOY_ENABLED` repo variable. Its header comment lists the required variables/secrets.

The full end-to-end runbook (Lightsail, MongoDB, DNS, CloudFront, IAM) lives in the server repo:
`nhl_stats_server_fastapi/DEPLOYMENT.md`.
