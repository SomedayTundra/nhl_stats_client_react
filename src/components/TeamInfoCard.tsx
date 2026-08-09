import type {TeamInfo} from '@/state/types';

type TeamInfoCardProps = {
    info: TeamInfo
}

const BASE_URL = 'http://localhost:8000/api'

export function TeamInfoCard({info}: TeamInfoCardProps) {
    const verbose = false;

    const logoURL = `${BASE_URL}/nhl_team_info/logo?logo_filename=${info.logo}`

    return (
        <div key={info.teamAbbrev} className='team-info-card'>
            <div className='team-logo-and-name font-normal'><img src={logoURL} alt='logo' loading='eager'/>{info.teamName}</div>
            {verbose &&
                <div className='team-conf-and-division'>
                  <p>{info.conferenceName} Conference</p>
                  <p>{info.divisionName} Division</p>
                </div>
            }
        </div>
    );
}

