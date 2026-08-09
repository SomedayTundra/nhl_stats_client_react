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
    // rendered in `unplacedAbbrevs`'s own (insertion) order rather than `teams`' original order,
    // so a round's shuffled team set actually looks shuffled in the bucket instead of reverting
    // to whatever order the API returned them in
    const teamByAbbrev = new Map(teams.map((team) => [team.teamAbbrev, team]))
    const unplacedTeams = Array.from(unplacedAbbrevs, (abbrev) => teamByAbbrev.get(abbrev))
        .filter((team): team is TeamInfo => team !== undefined)

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
