import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import {defaultSeasonOption, type SeasonOption} from '@/lib/seasonOption.ts'
import type {TeamInfo} from '@/state/types'

export function useTeamInfo(season: SeasonOption = defaultSeasonOption) {
    return useQuery<TeamInfo[]>({
        queryKey: ['teamInfo', season],
        queryFn: async () => {
            const teams = await apiFetch<TeamInfo[]>(`/nhl_team_info/?season_id=${season}`)
            // some team data has no conference info; default it so downstream grouping is stable
            return teams.map((team) => ({
                ...team,
                conferenceName: team.conferenceName ?? 'NA',
                conferenceAbbrev: team.conferenceAbbrev ?? 'NA',
            }))
        },
    })
}
