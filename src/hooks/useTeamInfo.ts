import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import {defaultSeasonId, type SeasonId} from '@/lib/seasonId.ts'

import type {TeamInfo} from '@/lib/teamGrouping.ts'

// `keepPrevious: true` keeps the previous season's teams up (flagged by isPlaceholderData) while a
// newly picked season's load, so a control built from them keeps its shape instead of flashing a
// loading state
export function useTeamInfo(season: SeasonId = defaultSeasonId, options: {keepPrevious?: boolean} = {}) {
    return useQuery<TeamInfo[]>({
        placeholderData: options.keepPrevious ? keepPreviousData : undefined,
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
        // an uncached season has no team_data yet; the standings fetch farms it in the background,
        // so keep polling until the teams show up (cached seasons return non-empty and never poll)
        refetchInterval: (query) => ((query.state.data?.length ?? 0) === 0 ? 4000 : false),
    })
}
