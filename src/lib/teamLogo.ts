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
