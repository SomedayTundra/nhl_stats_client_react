export type TeamStatEntry = {
    key?: string,
    date: string,
    teamName: string,
    teamCommonName: string,
    teamAbbrev: string,
    logo: string,
    chartLineColor?: string | null,
    gamesPlayed: number,
    winPctg: number,
    wins: number,
    losses: number,
    otLosses: number,
    points: number,
    pointPctg: number,
    goalsFor: number,
    goalsAgainst: number,
    goalDiff: number,

    // tallies over the last 10 games played as of `date`. Absent/null against a backend that
    // predates these fields, or for a day farmed before it captured them, so the table shows a
    // placeholder instead of a bogus zero
    l10Wins?: number | null,
    l10Losses?: number | null,
    l10OtLosses?: number | null,
    l10Ties?: number | null,
    l10GoalsFor?: number | null,
    l10GoalsAgainst?: number | null,
    l10GoalDiff?: number | null,
}