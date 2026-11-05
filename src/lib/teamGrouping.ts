export type TeamConferenceGroup = {
    conferenceName: string
    divisions: TeamDivisionGroup[]
}

export type TeamInfo = {
    teamAbbrev: string
    teamName: string
    teamCommonName: string
    logo: string
    // the dark-background crest, for Aurora; null when the NHL has no dark version of it
    logoDark?: string | null
    conferenceName?: string
    conferenceAbbrev?: string
    divisionName: string
    divisionAbbrev: string
}
export type TeamDivisionGroup = {
    divisionName: string
    teams: TeamInfo[]
}

/**
 * Group the given collection of TeamInfo objects into a hierarchy like:
 *
 * TeamConferenceGroup
 *     TeamDivisionGroup
 *         TeamInfo
 *         TeamInfo
 *         ..
 *         TeamInfo
 *
 * Note that some old seasons didn't have conferences at all, in which case
 * we group things into a dummy TeamConferenceGroup with the conferenceName 'NA'.
 *
 * All items at the same hierarchy level are arbitrarily sorted alphabetically by name.
 */
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

export type Conference = {
    divisions: Map<string, Division>;
}
export type Division = {
    teams: Array<TeamInfo>;
}