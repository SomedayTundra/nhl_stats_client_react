import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import type {SeasonOption} from '@/lib/seasonOption.ts'
import type {TeamInfo} from '@/state/types'

export function useTeamInfo(season: SeasonOption = 'current') {
    return useQuery<TeamInfo[]>({
        queryKey: ['teamInfo', season],
        queryFn: () => apiFetch<TeamInfo[]>(
            season === 'current' ? '/nhl_team_info/' : `/nhl_team_info/?season_id=${season}`
        ),
    })
}
