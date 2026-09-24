import nhlTimeline from '@/assets/nhl_timeline.json'

/**
 * I built nhl_timeline.json by hand, basing it on the wiki page
 * <a href="https://en.wikipedia.org/wiki/Timeline_of_the_National_Hockey_League">
 *     Timeline of the National Hockey League
 * </a>.
 *
 * Each entry therein describes what we call an "NHL era":
 * - seasonId is a season we've farmed data for, and that can be used to hit any API endpoint with a season_id param
 * - name is the name of the era, as would appear in a combo box
 * - description is a string that provides some flavor text about what that era is an era at all
 */
export type SeasonEntry = {
    seasonId: string
    name: string
    description: string
}

// a SeasonId is one of the valid timeline seasonIds, e.g. '19671968', where the form
// is "{seasonStartYear}{seasonEndYear}"
export type SeasonId = string

// object keys are numeric-string seasonIds, so Object.values walks them oldest-to-newest, so we reverse that;
// all of our use-cases like things newest-first
export const seasonEntries = Object.values(nhlTimeline as Record<string, SeasonEntry>).reverse()

// convenience array: all the valid seasonId strings, newest-first
export const validSeasonIds: SeasonId[] = seasonEntries.map((entry) => entry.seasonId)

// the newest(first, after we reversed the Object.values results, above) era is the default selection
export const defaultSeasonId: SeasonId = validSeasonIds[0]

// convenience map of SeasonEntry objects, keyed by seasonId
const seasonEntriesById = new Map(seasonEntries.map((entry) => [entry.seasonId, entry]))

/**
 * Given a seasonId, return the corresponsing SeasonEntry
 */
export function getSeasonEntry(season: SeasonId): SeasonEntry | undefined {
    return seasonEntriesById.get(season)
}

/**
 * Type predicate to determine if a given value matches one of our seasonId values.
 *
 * The Quiz page persists a SeasonId to local storage,
 * where any old version of this app, or some other page entirely, could have
 * written a value that doesn't match.
 *
 * This function is used by the Quiz to fallback to a known-good value in such a case.
 */
export function isValidSeasonId(value: string): value is SeasonId {
    return seasonEntriesById.has(value)
}
