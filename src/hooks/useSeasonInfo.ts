import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'

import type {SeasonInfo} from '@/lib/season.ts'

// GET /api/season_info
//
// Returns a SeasonInfo containing the seasonId, and that season's start/end dates
//
// If you pass no seasonId, you get the season currently in progress, or the most-recently-completed one,
// if 'today' falls between seasons.
//
// Season date spans never change once set, so this is cached indefinitely ("Infinity").
//
export function useSeasonInfo(seasonId?: string) {
    // if no seasonId is passed in, we use
    return useQuery<SeasonInfo>({
        //
        // queryKey
        //
        // e.g. ['seasonInfo', '19971998']
        //      ..or..
        //      ['seasonInfo', 'current']
        //
        queryKey: ['seasonInfo', seasonId ?? 'current'],
        queryFn: ({signal}) => apiFetch<SeasonInfo>(
            `/season_info/${seasonId ? `?season_id=${seasonId}` : ''}`,
            {signal},
        ),
        staleTime: Infinity,
    })
}
