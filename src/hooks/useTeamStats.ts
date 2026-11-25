import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import {formatDateForApi} from '@/lib/date.ts'

import type {TeamStatEntry} from '@/lib/teamStats.ts'

// seasonId is optional; when given it's passed through to the backend, which will farm that season
// on demand (a slow request) if it has nothing cached for it. `enabled: false` holds off fetching;
// the previous key's data stays up as placeholder meanwhile (keepPreviousData)
export function useTeamStats(fromDate: Date, toDate: Date, seasonId?: string, options: {enabled?: boolean} = {}) {
    const start = formatDateForApi(fromDate)
    const end = formatDateForApi(toDate)

    return useQuery<TeamStatEntry[]>({
        queryKey: ['teamStats', start, end, seasonId ?? null],
        queryFn: ({signal}) => apiFetch<TeamStatEntry[]>(
            `/nhl_standings/?start_date=${start}&end_date=${end}${seasonId ? `&season_id=${seasonId}` : ''}`,
            {signal},
        ),
        placeholderData: keepPreviousData,
        enabled: options.enabled ?? true,
    })
}
