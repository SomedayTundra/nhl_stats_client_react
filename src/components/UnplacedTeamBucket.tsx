import {useDroppable} from '@dnd-kit/core'
import {TeamInfoCard} from '@/components/TeamInfoCard.tsx'
import {QuizResults} from '@/components/QuizResults.tsx'
import {QuizScoreboard} from '@/components/QuizScoreboard.tsx'
import type {TeamInfo} from '@/state/types'

export const UNPLACED_TEAM_BUCKET_DROPPABLE_ID = 'unplaced-team-bucket'

export type QuizResultsSummary = {
    teamsSorted: number
    correctGuesses: number
    incorrectGuesses: number
    era: string
    totalTeams: number
    showTeamNames: boolean
}

type UnplacedTeamBucketProps = {
    teams: TeamInfo[]
    unplacedAbbrevs: Set<string>
    showTeamNames: boolean
    correctGuesses: number
    incorrectGuesses: number
    // a snapshot of the round that just finished: while set, it's shown below the header/scoreboard
    // band instead of the drop zone, and it survives any control fiddling until the next "Go!"
    results: QuizResultsSummary | null
}

export function UnplacedTeamBucket({teams, unplacedAbbrevs, showTeamNames, correctGuesses, incorrectGuesses, results}: UnplacedTeamBucketProps) {
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
                {/* header and scoreboard band are always shown */}
                <div className='unplaced-team-bucket-heading'>
                    <h1 className='unplaced-team-bucket-header'>DRAG TEAMS INTO THE CORRECT DIVISION</h1>
                    <div className='unplaced-team-bucket-scoreboard'>
                        <QuizScoreboard correctGuesses={correctGuesses} incorrectGuesses={incorrectGuesses}/>
                    </div>
                </div>
                {results
                    ? <QuizResults {...results}/>
                    : <div
                        ref={setNodeRef}
                        className={`unplaced-team-bucket-drop-zone flex-1 min-h-0${isOver ? ' unplaced-team-bucket-drop-zone-drag-over' : ''}`}
                    >
                        {unplacedTeams.length === 0
                            ? <p>...no teams in the bucket...</p>
                            : unplacedTeams.map((team) => <TeamInfoCard key={team.teamAbbrev} info={team} showTeamNames={showTeamNames}/>)
                        }
                    </div>
                }
            </div>
        </div>
    );
}
