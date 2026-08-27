'use client'

import * as React from 'react'
import {useQuery} from '@tanstack/react-query'
import {DndContext, DragOverlay, type DragEndEvent, type DragStartEvent} from '@dnd-kit/core'
import {UnplacedTeamBucket, UNPLACED_TEAM_BUCKET_DROPPABLE_ID} from '@/components/UnplacedTeamBucket.tsx'
import {LeagueBoard, divisionDroppableId} from '@/components/LeagueBoard.tsx'
import {TeamInfoCardView} from '@/components/TeamInfoCard.tsx'
import QuizToolbar from '@/components/QuizToolbar.tsx'
import {QuizScoreboard} from '@/components/QuizScoreboard.tsx'
import {SeasonSelect} from '@/components/SeasonSelect.tsx'
import {isSeasonOption, type SeasonOption} from '@/lib/seasonOption.ts'
import {QuizResultsOverlay} from '@/components/QuizResultsOverlay.tsx'
import type {TeamInfo} from '@/state/types'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

const SERVER = 'localhost:8000'

function pickRandomTeams(allTeams: TeamInfo[], count: number): TeamInfo[] {
    const shuffled = [...allTeams]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, count)
}

export default function LeagueShapeQuiz() {
    const [season, setSeason] = useLocalStorageState<SeasonOption>('nhlStats.quiz.season', 'current', {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return typeof parsed === 'string' && isSeasonOption(parsed) ? parsed : 'current'
        },
    })

    const {data: teams, isPending, error} = useQuery<TeamInfo[]>({
        queryKey: ['leagueInfo', season],
        queryFn: async () => {
            const url = season === 'current'
                ? `http://${SERVER}/api/nhl_team_info/`
                : `http://${SERVER}/api/nhl_team_info/?season_id=${season}`
            const response = await fetch(url)
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

    const [correctGuesses, setCorrectGuesses] = React.useState(0)
    const [incorrectGuesses, setIncorrectGuesses] = React.useState(0)

    const [isRunning, setIsRunning] = React.useState(false)

    const [showWinOverlay, setShowWinOverlay] = React.useState(false)

    // how many teams the current/most recently finished round started with - used for the win
    // screen's "you correctly sorted X teams" summary, since that's a round-scoped fact rather
    // than something derivable from the (ongoing) correct/incorrect guess counters
    const [roundTeamCount, setRoundTeamCount] = React.useState(0)

    // once every team the round started with has been correctly placed, the bucket empties out -
    // end the round (re-enable Go) and celebrate
    React.useEffect(() => {
        if (isRunning && unplacedAbbrevs.size === 0) {
            setIsRunning(false)
            setShowWinOverlay(true)
        }
    }, [isRunning, unplacedAbbrevs])

    const handleDismissWinOverlay = React.useCallback(() => setShowWinOverlay(false), [])

    // switching seasons swaps out the whole team list, so any in-progress round (built from the
    // previous season's teams) no longer makes sense - clear it and require a fresh "Go!". Adjusted
    // during render (React's recommended way to reset state when a prop-like value changes) rather
    // than in an effect, so it doesn't cost an extra render pass.
    const [prevSeason, setPrevSeason] = React.useState(season)
    if (season !== prevSeason) {
        setPrevSeason(season)
        setUnplacedAbbrevs(new Set())
        setIsRunning(false)
        setCorrectGuesses(0)
        setIncorrectGuesses(0)
    }

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

        if (isCorrectSlot) {
            setCorrectGuesses((current) => current + 1)
        } else {
            setIncorrectGuesses((current) => current + 1)
        }

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

    function handleGo(teamCount: number) {
        if (!teams) return
        const chosenTeams = pickRandomTeams(teams, teamCount)
        setUnplacedAbbrevs(new Set(chosenTeams.map((team) => team.teamAbbrev)))
        setRoundTeamCount(teamCount)
        setCorrectGuesses(0)
        setIncorrectGuesses(0)
        setIsRunning(true)
    }

    return (
        <div className='h-full min-h-0 flex flex-col'>
            <div className='flex flex-row items-center'>
                <div className='w-1/3 mx-4'>
                    <QuizToolbar
                        showTeamNames={showTeamNames}
                        onShowTeamNamesChange={setShowTeamNames}
                        onGo={handleGo}
                        totalTeams={teams?.length ?? 0}
                    />
                </div>
                <div className='w-2/3 mx-4 flex flex-row items-center justify-between'>
                    <SeasonSelect season={season} onSeasonChange={setSeason}/>
                    <QuizScoreboard correctGuesses={correctGuesses} incorrectGuesses={incorrectGuesses}/>
                </div>
            </div>
            {showWinOverlay && (
                <QuizResultsOverlay
                    teamsSorted={roundTeamCount}
                    correctGuesses={correctGuesses}
                    incorrectGuesses={incorrectGuesses}
                    onDismiss={handleDismissWinOverlay}
                />
            )}
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className='flex flex-row flex-1 min-h-0'>
                    <div className='w-1/3 align-top justify-end mx-4 min-h-0 overflow-hidden @container-[size]'>
                        <UnplacedTeamBucket teams={teams ?? []} unplacedAbbrevs={unplacedAbbrevs} showTeamNames={showTeamNames}/>
                    </div>
                    <div className='w-2/3 align-top justify-start mx-4 min-h-0 overflow-hidden @container-[size]'>
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
