import {useDraggable} from '@dnd-kit/core'
import TeamLogo from '@/components/TeamLogo.tsx'
import type {TeamInfo} from '@/lib/teamGrouping.ts'

type TeamInfoCardProps = {
    info: TeamInfo
    showTeamNames?: boolean
    disabled?: boolean
}

export function TeamInfoCardView({info, showTeamNames = true, dragOverlay = false}: TeamInfoCardProps & {dragOverlay?: boolean}) {
    const verbose = false;

    return (
        <div className={dragOverlay ? 'team-info-card team-info-card-drag-overlay' : 'team-info-card'}>
            <div className='team-logo-and-name font-normal'>
                {/* light crests in every theme: the cards stay pale on Aurora (--team-card-bg), where the
                    white-outlined dark crests wash out. Pass logoDark={info.logoDark} if the cards go dark. */}
                <TeamLogo logo={info.logo} size='2x' alt='logo' loading='eager'/>
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

export function TeamInfoCard({info, showTeamNames = true, disabled = false}: TeamInfoCardProps) {
    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({id: info.teamAbbrev, disabled})

    return (
        // the moving visual is the DndContext's <DragOverlay>; the source card stays put (just
        // dimmed) so it can't translate out of the bucket and stretch its scroll region
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                opacity: isDragging ? 0.4 : 1,
                cursor: disabled ? 'default' : 'grab',
                touchAction: 'none',
            }}
        >
            <TeamInfoCardView info={info} showTeamNames={showTeamNames}/>
        </div>
    );
}
