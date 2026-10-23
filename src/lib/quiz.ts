/**
 * For the quiz page, we let the user manually choose how many teams they want to be asked to place.
 *
 * The number of teams has varied over the years, from as few as 6 to as many as 32.
 *
 * There's no real "fun" reason to ask the user to place, say, 16 teams, versus 17 teams,
 * in a 32-team season.
 *
 * Instead, we take the total number of teams, and just crudely chop it up into four choices:
 * all the teams, 3/4ths of the teams, half the teams, or 1/4th of the teams.
 */
export const teamCountFractions = ['all', 'threeQuarters', 'half', 'quarter'] as const

export type TeamCountFraction = typeof teamCountFractions[number]

const teamCountFractionMultipliers: Record<TeamCountFraction, number> = {
    all: 1,
    threeQuarters: 0.75,
    half: 0.5,
    quarter: 0.25,
}

/**
 * Type predicate to determine if a given value matches one of our teamCountFraction values.
 *
 * The Quiz page persists a fraction value to local storage, where any old version of this
 * app, or some other page entirely, could have written a value that doesn't match.
 *
 * This function is used by the Quiz to fallback to a known-good value in such a case.
 */
export function isTeamCountFraction(value: string): value is TeamCountFraction {
    return (teamCountFractions as readonly string[]).includes(value)
}

/**
 * Given a fraction and a number of teams, gives back a number-of-teams that's "close enough."
 */
export function teamCountForFraction(fraction: TeamCountFraction, totalTeams: number): number {
    return Math.round(totalTeams * teamCountFractionMultipliers[fraction])
}

// a team is only considered "placed" when dropped on the division droppable whose id matches its
// own conference/division - any other drop target (or a miss) leaves it unplaced
export function divisionDroppableId(conferenceName: string, divisionName: string): string {
    return `division:${conferenceName}:${divisionName}`
}