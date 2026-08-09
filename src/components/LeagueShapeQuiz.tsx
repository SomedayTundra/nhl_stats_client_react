'use client'

import * as React from 'react'
import {useQuery} from '@tanstack/react-query'
import {DndContext, DragOverlay, type DragEndEvent, type DragStartEvent} from '@dnd-kit/core'
import {UnplacedTeamBucket, UNPLACED_TEAM_BUCKET_DROPPABLE_ID} from '@/components/UnplacedTeamBucket.tsx'
import {LeagueBoard, divisionDroppableId} from '@/components/LeagueBoard.tsx'
import {TeamInfoCardView} from '@/components/TeamInfoCard.tsx'
import QuizToolbar from '@/components/QuizToolbar.tsx'
import type {TeamInfo} from '@/state/types'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

const SERVER = 'localhost:8000'

export default function LeagueShapeQuiz() {
    const {data: teams, isPending, error} = useQuery<TeamInfo[]>({
        queryKey: ['leagueInfo'],
        queryFn: async () => {
            const response = await fetch(`http://${SERVER}/api/nhl_team_info/`)
            if (!response.ok) {
                throw new Error(`An error occurred: ${response.statusText}`)
            }
            return (await response.json()) as TeamInfo[]
        }
    })

    // teams the player has dragged out of the league board and into the bucket; everything else
    // renders in its correct conference/division on the board
    const [unplacedAbbrevs, setUnplacedAbbrevs] = React.useState<Set<string>>(new Set())
    const [activeTeamAbbrev, setActiveTeamAbbrev] = React.useState<string | null>(null)
    const [showTeamNames, setShowTeamNames] = useLocalStorageState<boolean>('nhlStats.quiz.showTeamNames', true)

    function handleDragStart(event: DragStartEvent) {
        setActiveTeamAbbrev(String(event.active.id))
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveTeamAbbrev(null)

        const {active, over} = event
        if (!over) return
        const abbrev = String(active.id)
        const overId = String(over.id)

        if (overId === UNPLACED_TEAM_BUCKET_DROPPABLE_ID) {
            setUnplacedAbbrevs((current) => new Set(current).add(abbrev))
            return
        }

        // dropping on the board only places the team if it lands on its own conference/division's
        // drop zone - any other division (or missing the board entirely) sends it back to the bucket
        const team = teams?.find((candidate) => candidate.teamAbbrev === abbrev)
        const isCorrectSlot = team !== undefined && overId === divisionDroppableId(team.conferenceName, team.divisionName)

        setUnplacedAbbrevs((current) => {
            const next = new Set(current)
            if (isCorrectSlot) {
                next.delete(abbrev)
            } else {
                next.add(abbrev)
            }
            return next
        })
    }

    const activeTeam = teams?.find((team) => team.teamAbbrev === activeTeamAbbrev) ?? null

    return (
        <div className='h-full min-h-0 flex flex-col'>
            <QuizToolbar showTeamNames={showTeamNames} onShowTeamNamesChange={setShowTeamNames}/>
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className='flex flex-row flex-1 min-h-0'>
                    <div className='w-1/3 align-top justify-end mx-4 min-h-0 overflow-hidden [container-type:size]'>
                        <UnplacedTeamBucket teams={teams ?? []} unplacedAbbrevs={unplacedAbbrevs} showTeamNames={showTeamNames}/>
                    </div>
                    <div className='w-2/3 align-top justify-start mx-4 min-h-0 overflow-hidden [container-type:size]'>
                        <LeagueBoard teams={teams ?? []} unplacedAbbrevs={unplacedAbbrevs} showTeamNames={showTeamNames} isPending={isPending} error={error}/>
                    </div>
                </div>
                <DragOverlay>
                    {activeTeam ? <TeamInfoCardView info={activeTeam} showTeamNames={showTeamNames} dragOverlay/> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
