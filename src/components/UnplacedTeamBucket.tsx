import {useDroppable} from '@dnd-kit/core'
import {TeamInfoCard} from '@/components/TeamInfoCard.tsx'
import type {TeamInfo} from '@/state/types'

export const UNPLACED_TEAM_BUCKET_DROPPABLE_ID = 'unplaced-team-bucket'

type UnplacedTeamBucketProps = {
    teams: TeamInfo[]
    unplacedAbbrevs: Set<string>
    showTeamNames: boolean
}

export function UnplacedTeamBucket({teams, unplacedAbbrevs, showTeamNames}: UnplacedTeamBucketProps) {
    const {setNodeRef, isOver} = useDroppable({id: UNPLACED_TEAM_BUCKET_DROPPABLE_ID})
    const unplacedTeams = teams.filter((team) => unplacedAbbrevs.has(team.teamAbbrev))

    return (
        <div className='unplaced-team-bucket-container h-full'>
            <div className='unplaced-team-bucket-content h-full flex flex-col'>
                <h1 className='unplaced-team-bucket-header'>DRAG TEAMS INTO THE CORRECT DIVISION</h1>
                <div
                    ref={setNodeRef}
                    className={`unplaced-team-bucket-drop-zone flex-1 min-h-0${isOver ? ' unplaced-team-bucket-drop-zone-drag-over' : ''}`}
                >
                    {unplacedTeams.length === 0
                        ? <p>...no teams in the bucket...</p>
                        : unplacedTeams.map((team) => <TeamInfoCard key={team.teamAbbrev} info={team} showTeamNames={showTeamNames}/>)
                    }
                </div>
            </div>
        </div>
    );
}
