import type * as React from 'react'
import {API_BASE_URL} from '@/lib/apiConfig.ts'


/**
 * Build a URL for a team logo, suitable for use as the 'src' of <img> elements.
 * @param logoFilename the filename, generally gleaned from TeamInfo.logo
 * @param size 1x or 2x to get various nicely-scaled PNG versions of the source SVG logos that the NHL API handed us
 */
export function getTeamLogoUrl(logoFilename: string, size?: '1x' | '2x'): string {
    const sizeParam = size ? `&size=${size}` : ''
    return `${API_BASE_URL}/nhl_team_info/logo?logo_filename=${logoFilename}${sizeParam}`
}

/**
 * The crest to show on the current theme: the dark-background version (`logoDark`, from the
 * backend's `localLogoDark`) on a dark theme when there is one, else the light one. A few
 * historical crests have no dark version, and those come back as null.
 */
export function themedLogoFilename(logo: string, logoDark: string | null | undefined, darkTheme: boolean): string {
    return darkTheme && logoDark ? logoDark : logo
}

export type TeamLogoSourceOptions = {
    logo: string
    logoDark?: string | null
    darkTheme: boolean
    size?: '1x' | '2x'
    // the NHL's own URLs, for a crest our backend doesn't have on disk (the playoff bracket's)
    fallbackUrl?: string
    darkFallbackUrl?: string
}

/**
 * Every URL worth trying for a logo, best first. On a dark theme that's our dark crest, the NHL's
 * dark crest, then the light ones; on a light theme just the light ones. Feed the rest of the list
 * to handleLogoError as each one fails.
 */
export function teamLogoSources({logo, logoDark, darkTheme, size, fallbackUrl, darkFallbackUrl}: TeamLogoSourceOptions): string[] {
    const sources: string[] = []
    if (darkTheme) {
        if (logoDark) sources.push(getTeamLogoUrl(logoDark, size))
        if (darkFallbackUrl) sources.push(darkFallbackUrl)
    }
    if (logo) sources.push(getTeamLogoUrl(logo, size))
    if (fallbackUrl) sources.push(fallbackUrl)
    return sources.filter((source, index) => sources.indexOf(source) === index)
}

/** onError for a logo <img>: moves on to the next of `fallbacks` each time the current one fails. */
export function handleLogoError(event: React.SyntheticEvent<HTMLImageElement>, fallbacks: string[]) {
    const image = event.currentTarget
    const step = Number(image.dataset.logoFallback ?? 0)
    if (step >= fallbacks.length) return
    image.dataset.logoFallback = String(step + 1)
    image.src = fallbacks[step]
}
