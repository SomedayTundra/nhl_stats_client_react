// Vercel Cron target (see "crons" in vercel.json): starts the server repo's daily farm workflow via
// workflow_dispatch. GitHub's own `schedule` trigger is best-effort and was routinely firing 4-8
// hours late; a dispatched run starts within a minute or so. farm.yml keeps its schedule as a
// later fallback, which is a no-op once this run has farmed the day.
//
// Env (Vercel project, Production):
//   CRON_SECRET          - Vercel sends it as `Authorization: Bearer <secret>` on cron calls;
//                          anything else gets a 401, so the URL can't be used to spam dispatches
//   FARM_DISPATCH_TOKEN  - fine-grained GitHub PAT, nhl_stats_server_fastapi only, Actions: read/write

const DISPATCH_URL =
  'https://api.github.com/repos/SomedayTundra/nhl_stats_server_fastapi/actions/workflows/farm.yml/dispatches'

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const token = process.env.FARM_DISPATCH_TOKEN
  if (!token) {
    return Response.json({ ok: false, error: 'FARM_DISPATCH_TOKEN is not set' }, { status: 500 })
  }

  const response = await fetch(DISPATCH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'nhl-stats-client-vercel-cron',
    },
    body: JSON.stringify({
      ref: 'main',
      // recorded by update_mongodb.py in farm_runs, so a run says where it came from
      inputs: {
        triggered_by: `vercel-cron (${process.env.VERCEL_ENV ?? 'unknown env'}, ${process.env.VERCEL_REGION ?? 'unknown region'})`,
      },
    }),
  })

  // GitHub answers a successful dispatch with 204 No Content
  if (response.status === 204) {
    return Response.json({ ok: true })
  }

  const detail = await response.text()
  console.error(`farm dispatch failed: ${response.status} ${detail}`)
  return Response.json({ ok: false, githubStatus: response.status, detail }, { status: 502 })
}
