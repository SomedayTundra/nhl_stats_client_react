// Turns the NHL playoff-bracket payload (served by our GET /api/playoffs/{year}) into the
// two-sided, column-per-round shape PlayoffBracket renders.
//
// The payload is a flat list of series, each tagged with a playoffRound number - it carries no
// bracket tree and no reliable conference labels (1995, for instance, titles one semifinal
// "Eastern Conference Finals" and its mirror just "Conference Finals"). So we rebuild the tree
// ourselves, from the final backwards: a series in round N+1 is fed by whichever round-N series
// the same team won. That works for every era the season picker offers, including the 2-round
// Original Six brackets and the 1970s formats where some teams got a bye into a later round.

export type NhlBracketTeam = {
    id: number
    abbrev: string
    name?: {default?: string}
    commonName?: {default?: string}
    logo?: string
}

export type NhlBracketSeries = {
    playoffRound: number
    seriesLetter?: string
    seriesTitle?: string
    // the NHL's own artwork for this series; on the final it's the Stanley Cup shield, stamped
    // with the year for recent seasons
    seriesLogo?: string
    topSeedTeam?: NhlBracketTeam
    bottomSeedTeam?: NhlBracketTeam
    topSeedWins?: number
    bottomSeedWins?: number
    winningTeamId?: number
    // added by our backend for a level, still-being-played series (see nhl_playoffs.py)
    lastGameWinnerTeamId?: number
}

export type NhlBracketPayload = {
    series?: NhlBracketSeries[]
}

export type BracketTeamView = {
    id: number
    commonName: string
    // filename for our own /nhl_team_info/logo endpoint (era-correct: the payload points at the
    // crest the team wore that season), plus the NHL's own URL to fall back to if we don't have it
    logoFilename: string
    logoFallbackUrl: string
    wins: number
    losses: number
    won: boolean
}

export type BracketSeriesView = {
    key: string
    title: string
    top: BracketTeamView
    bottom: BracketTeamView
    // exactly one team carries the series record - the other's would be the same two numbers
    // reversed. See recordHolder() for how it's picked.
    recordTeam: 'top' | 'bottom'
}

// one position in a round's column. A 'bye' is a team that reached the next round without playing
// this one; 'empty' holds that bye's place in the columns further out so the rows above and below
// it stay lined up with their connectors.
export type BracketSlot =
    | {kind: 'series'; key: string; series: BracketSeriesView}
    | {kind: 'bye'; key: string; teamName: string}
    | {kind: 'empty'; key: string}

export type BracketColumn = {
    label: string
    slots: BracketSlot[]
}

export type BracketSideView = {
    // outermost round first; the last column is the one series that feeds the final
    columns: BracketColumn[]
}

// 'left' and 'right' are just which half of the page a side is drawn on. Which conference ends up
// where falls out of the data (the final's top seed leads the left half), and pre-1974 brackets
// have no conferences at all, so naming them east/west would be wrong as often as not.
export type BracketView = {
    finalTitle: string
    // the NHL's Stanley Cup shield for this season, '' if the payload didn't carry one
    finalLogoUrl: string
    final: BracketSeriesView
    left: BracketSideView
    right: BracketSideView
}

function teamView(team: NhlBracketTeam, wins: number, opponentWins: number, won: boolean): BracketTeamView {
    const logoUrl = team.logo ?? ''
    return {
        id: team.id,
        commonName: team.commonName?.default ?? team.name?.default ?? team.abbrev,
        logoFilename: logoUrl.split('/').pop() ?? '',
        logoFallbackUrl: logoUrl,
        wins,
        losses: opponentWins,
        won,
    }
}

// Which team the series record is shown against, in priority order: the team that won the series;
// failing that (it's still being played) the team currently ahead; failing that (it's level) the
// team that took the most recent game. A series where nothing has been played yet falls back to
// the top seed, where the record is 0-0 either way.
function recordHolder(
    series: NhlBracketSeries,
    top: NhlBracketTeam,
    bottom: NhlBracketTeam,
    topWins: number,
    bottomWins: number,
): 'top' | 'bottom' {
    if (series.winningTeamId === top.id) {
        return 'top'
    }
    if (series.winningTeamId === bottom.id) {
        return 'bottom'
    }
    if (topWins !== bottomWins) {
        return topWins > bottomWins ? 'top' : 'bottom'
    }
    if (series.lastGameWinnerTeamId === bottom.id) {
        return 'bottom'
    }
    return 'top'
}

function seriesView(series: NhlBracketSeries, index: number): BracketSeriesView {
    // both teams are known to exist - callers filter incomplete series out first
    const top = series.topSeedTeam as NhlBracketTeam
    const bottom = series.bottomSeedTeam as NhlBracketTeam
    const topWins = series.topSeedWins ?? 0
    const bottomWins = series.bottomSeedWins ?? 0
    // only the payload's own winningTeamId marks a series as won, so a series still being played
    // doesn't crown whoever happens to be ahead
    const decidedBy = series.winningTeamId
    return {
        key: series.seriesLetter ?? `r${series.playoffRound}s${index}`,
        title: series.seriesTitle ?? `Round ${series.playoffRound}`,
        top: teamView(top, topWins, bottomWins, decidedBy === top.id),
        bottom: teamView(bottom, bottomWins, topWins, decidedBy === bottom.id),
        recordTeam: recordHolder(series, top, bottom, topWins, bottomWins),
    }
}

// who won a series. winningTeamId is set on every completed series we've seen, but fall back to
// the win counts so a bracket still resolves without it.
function winnerId(series: NhlBracketSeries): number | undefined {
    if (series.winningTeamId !== undefined) {
        return series.winningTeamId
    }
    const topWins = series.topSeedWins ?? 0
    const bottomWins = series.bottomSeedWins ?? 0
    if (topWins === bottomWins) {
        return undefined
    }
    return topWins > bottomWins ? series.topSeedTeam?.id : series.bottomSeedTeam?.id
}

export function buildBracketView(payload: NhlBracketPayload | undefined): BracketView | null {
    // a series missing either team is one that hasn't been set yet (an in-progress bracket)
    const played = (payload?.series ?? []).filter((s) => s.topSeedTeam && s.bottomSeedTeam)
    if (played.length === 0) {
        return null
    }

    const byRound = new Map<number, NhlBracketSeries[]>()
    for (const series of played) {
        const bucket = byRound.get(series.playoffRound)
        if (bucket === undefined) {
            byRound.set(series.playoffRound, [series])
        } else {
            bucket.push(series)
        }
    }

    const roundNumbers = [...byRound.keys()].sort((a, b) => a - b)
    const firstRound = roundNumbers[0]
    const lastRound = roundNumbers[roundNumbers.length - 1]

    // the final is the lone series of the deepest round; without one there's no bracket to draw
    const finalCandidates = byRound.get(lastRound) ?? []
    if (finalCandidates.length !== 1) {
        return null
    }
    const finalSeries = finalCandidates[0]
    const final = seriesView(finalSeries, 0)

    // the round-N series that `teamId` won on its way into round N+1, if it played one
    const feederFor = (teamId: number, round: number): BracketSeriesView | null => {
        const candidates = byRound.get(round) ?? []
        const index = candidates.findIndex((s) => winnerId(s) === teamId)
        return index === -1 ? null : seriesView(candidates[index], index)
    }

    const slotFor = (team: BracketTeamView, round: number): BracketSlot => {
        const feeder = feederFor(team.id, round)
        return feeder === null
            ? {kind: 'bye', key: `bye-${round}-${team.id}`, teamName: team.commonName}
            : {kind: 'series', key: feeder.key, series: feeder}
    }

    // walk inward-out from the series feeding the final, expanding each slot into the two slots
    // that fed it, so every column stays in parent order (which is what lines the connectors up)
    const buildSide = (finalist: BracketTeamView): BracketSideView => {
        const columns: BracketColumn[] = []
        let level: BracketSlot[] = [slotFor(finalist, lastRound - 1)]

        for (let round = lastRound - 1; round >= firstRound; round--) {
            const label = level.find((slot) => slot.kind === 'series')?.series.title ?? ''
            columns.unshift({label, slots: level})

            level = level.flatMap((slot, slotIndex): BracketSlot[] => {
                if (slot.kind !== 'series') {
                    // nothing fed a bye, but its place still has to be held open out here
                    return [
                        {kind: 'empty', key: `${slot.key}-a${round}`},
                        {kind: 'empty', key: `${slot.key}-b${round}`},
                    ]
                }
                return [
                    slotFor(slot.series.top, round - 1),
                    slotFor(slot.series.bottom, round - 1),
                ].map((fed, i) =>
                    // de-dupe keys: a bye slot's key is only unique within its own parent
                    fed.kind === 'bye' ? {...fed, key: `${fed.key}-${slotIndex}-${i}`} : fed,
                )
            })
        }

        return {columns}
    }

    return {
        finalTitle: final.title,
        finalLogoUrl: finalSeries.seriesLogo ?? '',
        final,
        left: buildSide(final.top),
        right: buildSide(final.bottom),
    }
}
