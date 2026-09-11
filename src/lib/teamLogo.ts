import {API_BASE_URL} from '@/lib/apiConfig.ts'

/**
 * URL for a team logo. Pass a `size` to get the backend's pre-rasterized PNG (a clean
 * lanczos3 downscale) instead of the raw SVG, which the browser otherwise squashes from
 * 960x640 down to display size in a single pass — scratchy on the detailed crests.
 * The backend falls back to the SVG if that PNG wasn't generated.
 */
export function getTeamLogoUrl(logoFilename: string, size?: '1x' | '2x'): string {
    const sizeParam = size ? `&size=${size}` : ''
    return `${API_BASE_URL}/nhl_team_info/logo?logo_filename=${logoFilename}${sizeParam}`
}
