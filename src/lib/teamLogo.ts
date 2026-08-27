import {API_BASE_URL} from '@/lib/apiConfig.ts'

export function getTeamLogoUrl(logoFilename: string): string {
    return `${API_BASE_URL}/nhl_team_info/logo?logo_filename=${logoFilename}`
}
