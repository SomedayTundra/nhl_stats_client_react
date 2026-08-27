// 'current' asks the backend for the latest season (its default when no season_id is given);
// any other value is passed through as the season_id query param verbatim
export type SeasonOption = 'current' | '19891990'

export const seasonLabels: Record<SeasonOption, string> = {
    current: 'Current season',
    '19891990': '1989-1990',
}

export const seasonOptions = Object.keys(seasonLabels) as SeasonOption[]

export function isSeasonOption(value: string): value is SeasonOption {
    return (seasonOptions as string[]).includes(value)
}
