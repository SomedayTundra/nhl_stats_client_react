import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'

// one run of the server's update_mongodb.py farm script, as served by GET /api/farm_runs (the server leaves out the
// machine name and OS login of whoever ran it, and trims an error status to just the exception type)
export interface FarmRun {
    startedAt: string
    endedAt: string | null
    durationS: number | null
    // "success", or "error: <ExceptionType>"
    status: string | null
    // "scheduled", "dispatch" or "manual"
    trigger: string | null
    triggeredBy: string | null
    // null means the run farmed the current season
    seasonArg: number | null
    githubActor: string | null
    githubRunId: string | null
    githubRunUrl: string | null
}

export interface FarmRuns {
    // how many runs the server keeps (its FARM_RUNS_TO_KEEP)
    farmRunsToKeep: number
    // newest first
    runs: FarmRun[]
}

// GET /api/farm_runs -> every farm run the server has kept, newest first
export function useFarmRuns() {
    return useQuery<FarmRuns>({
        queryKey: ['farmRuns'],
        queryFn: ({signal}) => apiFetch<FarmRuns>('/farm_runs/', {signal}),
        staleTime: 60 * 1000,
    })
}
