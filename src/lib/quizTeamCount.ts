// the League Shape Quiz's "number of teams" control is chosen as a fraction of however many
// teams the selected season actually has, rather than as a fixed count - so switching seasons
// (and therefore the total team count) rescales every choice. Shared by QuizToolbar (which owns
// the control) and LeagueShapeQuiz (which needs the fraction -> count math for "Randomize & Go").

export const teamCountFractions = ['all', 'threeQuarters', 'half', 'quarter'] as const

export type TeamCountFraction = typeof teamCountFractions[number]

const teamCountFractionMultipliers: Record<TeamCountFraction, number> = {
    all: 1,
    threeQuarters: 0.75,
    half: 0.5,
    quarter: 0.25,
}

export function isTeamCountFraction(value: string): value is TeamCountFraction {
    return (teamCountFractions as readonly string[]).includes(value)
}

export function teamCountForFraction(fraction: TeamCountFraction, totalTeams: number): number {
    return Math.round(totalTeams * teamCountFractionMultipliers[fraction])
}
