import {useDraggable} from '@dnd-kit/core'
import {CSS} from '@dnd-kit/utilities'
import type {TeamInfo} from '@/state/types';

type TeamInfoCardProps = {
    info: TeamInfo
    showTeamNames?: boolean
}

const BASE_URL = 'http://localhost:8000/api'

export function TeamInfoCardView({info, showTeamNames = true, dragOverlay = false}: TeamInfoCardProps & {dragOverlay?: boolean}) {
    const verbose = false;

    const logoURL = `${BASE_URL}/nhl_team_info/logo?logo_filename=${info.logo}`

    return (
        <div className={dragOverlay ? 'team-info-card team-info-card-drag-overlay' : 'team-info-card'}>
            <div className='team-logo-and-name font-normal'>
                <img src={logoURL} alt='logo' loading='eager'/>
                {showTeamNames && <span className='team-name-label'>{info.teamName}</span>}
            </div>
            {verbose &&
                <div className='team-conf-and-division'>
                  <p>{info.conferenceName} Conference</p>
                  <p>{info.divisionName} Division</p>
                </div>
            }
        </div>
    );
}

export function TeamInfoCard({info, showTeamNames = true}: TeamInfoCardProps) {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({id: info.teamAbbrev})

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                transform: CSS.Translate.toString(transform),
                opacity: isDragging ? 0.4 : 1,
                cursor: 'grab',
                touchAction: 'none',
            }}
        >
            <TeamInfoCardView info={info} showTeamNames={showTeamNames}/>
        </div>
    );
}
