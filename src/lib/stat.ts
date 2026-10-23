export const statNames = ['points', 'wins', 'losses', 'otLosses', 'goalsFor', 'goalsAgainst', 'goalDiff', 'winPctg', 'pointPctg'] as const
export type StatType = typeof statNames[number]

// given a StatType, return a UI-usable label
export function statToLabel(stat: StatType): string {
    let label: string
    switch (stat) {
        case 'points':
            label = 'Points'
            break
        case 'wins':
            label = 'Wins'
            break
        case 'losses':
            label = 'Losses'
            break
        case 'otLosses':
            label = 'OT Losses'
            break
        case 'goalsFor':
            label = 'Goals For'
            break
        case 'goalsAgainst':
            label = 'Goals Against'
            break
        case 'goalDiff':
            label = 'Goal Diff'
            break
        case 'winPctg':
            label = 'Win %'
            break
        case 'pointPctg':
            label = 'Points %'
            break
        default:
            label = stat
            break
    }
    return label
}

export function showStatAsPercent(stat: StatType) {
    let showAsPercent = false
    switch (stat) {
        case 'winPctg':
        case 'pointPctg':
            showAsPercent = true
            break
    }
    return showAsPercent
}

// is the given string one of our stat choices? if so, use 'is' so callers can subsequently use it as such without any extra effort
export function isStatType(stat: string): stat is StatType {
    return (statNames as readonly string[]).includes(stat)
}