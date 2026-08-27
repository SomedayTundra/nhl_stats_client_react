export type DateState = {
    date: Date;
    setDate: (date: Date) => void;
}

export type TeamInfo = {
    teamAbbrev: string
    teamName: string
    teamCommonName: string
    logo: string
    conferenceName: string
    conferenceAbbrev: string
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
