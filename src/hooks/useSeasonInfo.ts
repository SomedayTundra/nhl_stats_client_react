import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import {formatDateForApi} from '@/lib/date.ts'
import {seasonStartYear} from '@/lib/season.ts'
import type {SeasonInfo} from '@/state/types'

// GET /api/season_info -> the season's start/end dates. Pass no seasonId to get the season
// currently in progress (or the upcoming one, if today falls between seasons). Season date spans
// never change once set, so this is cached indefinitely.
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

// the seasonId of the latest season that has actually started as of today: the season the backend
// reports if today has reached its startDate, otherwise the previous one. Between seasons the
// backend reports the *upcoming* season, which hasn't been played yet (no data, shouldn't be
// offered), so we back off to the one before it. This is both the default SeasonSelect value and
// the newest entry the picker should list. Returns '' until the lookup resolves.
export function useLatestSeasonId(): string {
    const {data: season} = useSeasonInfo()
    if (!season) {
        return ''
    }
    const today = formatDateForApi(new Date())
    if (today >= season.startDate) {
        return String(season.seasonId)
    }
    const prevStartYear = seasonStartYear(season.seasonId) - 1
    return `${prevStartYear}${prevStartYear + 1}`
}
