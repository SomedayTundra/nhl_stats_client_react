import nhlTimeline from '@/assets/nhl_timeline.json'

// each entry in nhl_timeline.json describes an NHL era: `seasonId` is the season we've farmed
// data for (and pass to the backend as the season_id query param), `name` is what the
// EraSelect combo box shows, and `description` is the note rendered beside it
export type SeasonEntry = {
    seasonId: string
    name: string
    description: string
}

// object keys are numeric-string seasonIds, so Object.values walks them oldest-to-newest
export const seasonEntries = Object.values(nhlTimeline as Record<string, SeasonEntry>)

// same eras, newest-first - for pickers that surface recent seasons at the top. Kept separate
// rather than reversing seasonEntries in place: defaultSeasonOption and seasonEntriesById both
// rely on the oldest-first order.
export const seasonEntriesNewestFirst: SeasonEntry[] = [...seasonEntries].reverse()

// a SeasonOption is one of the timeline seasonIds, e.g. '19671968'
export type SeasonOption = string

export const seasonOptions: SeasonOption[] = seasonEntries.map((entry) => entry.seasonId)

const seasonEntriesById = new Map(seasonEntries.map((entry) => [entry.seasonId, entry]))

// the newest era is the default selection
export const defaultSeasonOption: SeasonOption = seasonOptions[seasonOptions.length - 1]

export function getSeasonEntry(season: SeasonOption): SeasonEntry | undefined {
    return seasonEntriesById.get(season)
}

export function isSeasonOption(value: string): value is SeasonOption {
    return seasonEntriesById.has(value)
}
