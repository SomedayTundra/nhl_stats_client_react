// helpers for the per-year SeasonSelect picker (distinct from seasonId.ts, which drives the
// era-based EraSelect used on the quiz page)

// the backend has farmed data back to the 1942-43 season (server EARLIEST_SEASON_ID = 19421943)
const EARLIEST_SEASON_START_YEAR = 1942

// seasons the NHL never actually played - the backend has no season_info for these, so leave them
// out of the picker rather than offering a choice that 404s
const CANCELLED_SEASON_IDS = new Set<string>([
    '20042005', // 2004-05 lockout: entire season cancelled
])

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

// a seasonId is two consecutive years concatenated, e.g. '19421943'
export function seasonStartYear(seasonId: string | number): number {
    return Number(String(seasonId).slice(0, 4))
}

// '19421943' -> '1942-43', '19992000' -> '1999-00'
export function seasonIdToLabel(seasonId: string): string {
    return `${seasonId.slice(0, 4)}-${seasonId.slice(6, 8)}`
}

// every playable seasonId from 1942-43 through the given current season, newest first so the most
// recent season sits at the top of the picker
export function buildSeasonIds(currentSeasonId: string | number): string[] {
    const lastStartYear = seasonStartYear(currentSeasonId)
    const ids: string[] = []
    for (let startYear = lastStartYear; startYear >= EARLIEST_SEASON_START_YEAR; startYear--) {
        const id = `${startYear}${startYear + 1}`
        if (!CANCELLED_SEASON_IDS.has(id)) {
            ids.push(id)
        }
    }
    return ids
}

