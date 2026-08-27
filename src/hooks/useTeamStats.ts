import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import {formatDateForApi} from '@/lib/date.ts'
import type {TeamStatEntry} from '@/state/types'

export function useTeamStats(fromDate: Date, toDate: Date) {
    const start = formatDateForApi(fromDate)
    const end = formatDateForApi(toDate)

    return useQuery<TeamStatEntry[]>({
        queryKey: ['teamStats', start, end],
        queryFn: ({signal}) => apiFetch<TeamStatEntry[]>(
            `/nhl_standings/?start_date=${start}&end_date=${end}`, {signal}
        ),
        placeholderData: keepPreviousData,
    })
}
