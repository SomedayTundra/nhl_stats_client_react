import type {TeamInfo} from '@state/useLeagueInfo';

type TeamInfoCardProps = {
    data: TeamInfo
}

export function TeamInfoCard({data}: TeamInfoCardProps) {
    const verbose = false;

    return (
        <div key={data.teamAbbrev} className='team-info-card'>
            <div className='team-logo-and-name'><img src={`http://localhost:8000/api/nhl_team_info/logo?logo_filename=${data.logo}`} alt='logo'/>{data.teamName}</div>
            {verbose &&
                <div className='team-conf-and-division'>
                  <p>{data.conferenceName} Conference</p>
                  <p>{data.divisionName} Division</p>
                </div>
            }
        </div>
    );
}

