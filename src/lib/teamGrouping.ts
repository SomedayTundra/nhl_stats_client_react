import type {TeamInfo} from '@/state/types'

export type TeamDivisionGroup = {
    divisionName: string
    teams: TeamInfo[]
}

export type TeamConferenceGroup = {
    conferenceName: string
    divisions: TeamDivisionGroup[]
}

export function groupTeamsByConferenceAndDivision(teams: TeamInfo[]): TeamConferenceGroup[] {
    const conferenceMap = new Map<string, Map<string, TeamInfo[]>>()

    for (const team of teams) {
        const conferenceName = team.conferenceName ?? 'NA'
        let divisionMap = conferenceMap.get(conferenceName)
        if (!divisionMap) {
            divisionMap = new Map()
            conferenceMap.set(conferenceName, divisionMap)
        }

        let divisionTeams = divisionMap.get(team.divisionName)
        if (!divisionTeams) {
            divisionTeams = []
            divisionMap.set(team.divisionName, divisionTeams)
        }

        divisionTeams.push(team)
    }

    return Array.from(conferenceMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([conferenceName, divisionMap]) => ({
            conferenceName,
            divisions: Array.from(divisionMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([divisionName, divisionTeams]) => ({
                    divisionName,
                    teams: [...divisionTeams].sort((a, b) => a.teamName.localeCompare(b.teamName)),
                })),
        }))
}
