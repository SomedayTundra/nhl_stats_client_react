import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import type {SeasonInfo} from '@/state/types'

// GET /api/season_info -> the season's start/end dates.
//
// Pass no seasonId to get the season currently in progress (or the most-recently-completed one,
// if today falls between seasons).
//
// Season date spans never change once set, so this is cached indefinitely.
//
export function useSeasonInfo(seasonId?: string) {
    return useQuery<SeasonInfo>({
        queryKey: ['seasonInfo', seasonId ?? 'current'],
        queryFn: ({signal}) => apiFetch<SeasonInfo>(
            `/season_info/${seasonId ? `?season_id=${seasonId}` : ''}`,
            {signal},
        ),
        staleTime: Infinity,
    })
}
