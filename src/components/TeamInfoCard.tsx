import type {TeamInfo} from '@/state/types';
import {useQuery} from '@tanstack/react-query'

type TeamInfoCardProps = {
    info: TeamInfo
}

const BASE_URL = 'http://localhost:8000/api'

export function TeamInfoCard({info}: TeamInfoCardProps) {
    const verbose = false;

    const {data: imageURL} = useQuery({
        queryKey: [info.teamAbbrev],
        queryFn: async () => {
            const fetchURL = `${BASE_URL}/nhl_team_info/logo?logo_filename=${info.logo}`
            const response = await fetch(fetchURL)
            const imageBlob = await response.blob()
            const imageObjectURL = URL.createObjectURL(imageBlob)
            return (imageObjectURL)
        },
    })

    return (
        <div key={info.teamAbbrev} className='team-info-card'>
            <div className='team-logo-and-name text-sm font-normal'><img src={imageURL} alt='logo'/>{info.teamName}</div>
            {verbose &&
                <div className='team-conf-and-division'>
                  <p>{info.conferenceName} Conference</p>
                  <p>{info.divisionName} Division</p>
                </div>
            }
        </div>
    );
}

