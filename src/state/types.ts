export type DateState = {
    date: Date;
    setDate: (date: Date) => void;
}

export type TeamInfo = {
    teamAbbrev: string
    teamName: string
    teamCommonName: string
    logo: string
    conferenceName?: string
    conferenceAbbrev?: string
    divisionName: string
    divisionAbbrev: string
}


export type TeamStatEntry = {
    key?: string,
    date: string,
    teamName: string,
    teamCommonName: string,
    teamAbbrev: string,
    logo: string,
    wins: number,
    losses: number,
    otLosses: number,
    points: number,
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


// one season's date span, as served by GET /api/season_info (dates are yyyy-MM-dd strings).
// l10OtAndTieOverlap is true for a season where some team's last-10 window has ever had a
// non-zero OT loss and a non-zero tie at once (only possible 1999-2000 through 2003-04); absent
// for a season the backend hasn't tagged, which is equivalent to false
export type SeasonInfo = {
    seasonId: number
    startDate: string
    endDate: string
    l10OtAndTieOverlap?: boolean
}


export type LeagueInfo = {
    conferences: Map<string, Conference>;
}

export type Conference = {
    divisions: Map<string, Division>;
}

export type Division = {
    teams: Array<TeamInfo>;
}
