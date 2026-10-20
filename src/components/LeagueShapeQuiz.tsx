'use client'

import * as React from 'react'
import {DndContext, DragOverlay, type DragEndEvent, type DragStartEvent} from '@dnd-kit/core'
import {UnplacedTeamBucket, UNPLACED_TEAM_BUCKET_DROPPABLE_ID, type QuizResultsSummary} from '@/components/UnplacedTeamBucket.tsx'
import {LeagueBoard, divisionDroppableId} from '@/components/LeagueBoard.tsx'
import {TeamInfoCardView} from '@/components/TeamInfoCard.tsx'
import QuizToolbar from '@/components/QuizToolbar.tsx'
import {EraSelect} from '@/components/EraSelect.tsx'
import {defaultSeasonId, getSeasonEntry, isValidSeasonId, validSeasonIds, type SeasonId} from '@/lib/seasonId.ts'
import {teamCountForFraction, type TeamCountFraction} from '@/lib/quizTeamCount.ts'
import type {TeamInfo} from '@/state/types'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'
import {useTeamInfo} from '@/hooks/useTeamInfo.ts'

function pickRandomTeams(allTeams: TeamInfo[], count: number): TeamInfo[] {
    const shuffled = [...allTeams]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, count)
}

function randomOf<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

export default function LeagueShapeQuiz() {
    const [season, setSeason] = useLocalStorageState<SeasonId>('nhlStats.quiz.season', defaultSeasonId, {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return typeof parsed === 'string' && isValidSeasonId(parsed) ? parsed : defaultSeasonId
        },
    })

    const {data: teams, isPending, error} = useTeamInfo(season)

    // teams the player has dragged out of the league board and into the bucket; everything else
    // renders in its correct conference/division on the board
    const [unplacedAbbrevs, setUnplacedAbbrevs] = React.useState<Set<string>>(new Set())
    const [activeTeamAbbrev, setActiveTeamAbbrev] = React.useState<string | null>(null)
    const [showTeamNames, setShowTeamNames] = useLocalStorageState<boolean>('nhlStats.quiz.showTeamNames', true)

    const [correctGuesses, setCorrectGuesses] = React.useState(0)
    const [incorrectGuesses, setIncorrectGuesses] = React.useState(0)

    const [isRunning, setIsRunning] = React.useState(false)

    // a frozen snapshot of the round that just finished; while set, it's what the
    // UnplacedTeamBucket shows instead of its header + drop zone. Snapshotting (rather than
    // reading live state) is what lets it stay put while the user fiddles with the era /
    // team-count / show-names controls afterwards - only the next "Go!" clears it.
    const [completedRound, setCompletedRound] = React.useState<QuizResultsSummary | null>(null)

    // how many teams the current/most recently finished round started with - used for the win
    // screen's "you correctly sorted X teams" summary, since that's a round-scoped fact rather
    // than something derivable from the (ongoing) correct/incorrect guess counters
    const [roundTeamCount, setRoundTeamCount] = React.useState(0)

    // set by "Randomize & Go": the toolbar-rolled team-count fraction, held until the newly-rolled
    // era's team list finishes loading (see the effect below), then consumed to start the round
    const [pendingRandomFraction, setPendingRandomFraction] = React.useState<TeamCountFraction | null>(null)

    // once every team the round started with has been correctly placed, the bucket empties out -
    // end the round (re-enable Go) and snapshot the result for the bucket to display
    React.useEffect(() => {
        if (isRunning && unplacedAbbrevs.size === 0) {
            setIsRunning(false)
            setCompletedRound({
                teamsSorted: roundTeamCount,
                correctGuesses,
                incorrectGuesses,
                era: getSeasonEntry(season)?.name ?? season,
                totalTeams: teams?.length ?? 0,
                showTeamNames,
            })
        }
    }, [isRunning, unplacedAbbrevs, roundTeamCount, correctGuesses, incorrectGuesses, season, teams, showTeamNames])

    // "Randomize & Go" rolls the era right here, but a round can't be built until that era's team
    // list has loaded. Once it's in, start the round with the fraction the toolbar rolled; a load
    // failure just drops the pending request. (Round-start body mirrors handleGo.)
    React.useEffect(() => {
        if (pendingRandomFraction === null) return
        if (error) {
            setPendingRandomFraction(null)
            return
        }
        if (!teams || teams.length === 0) return

        const teamCount = teamCountForFraction(pendingRandomFraction, teams.length)
        const chosenTeams = pickRandomTeams(teams, teamCount)
        setPendingRandomFraction(null)
        setUnplacedAbbrevs(new Set(chosenTeams.map((team) => team.teamAbbrev)))
        setRoundTeamCount(teamCount)
        setCorrectGuesses(0)
        setIncorrectGuesses(0)
        setCompletedRound(null)
        setIsRunning(true)
    }, [pendingRandomFraction, teams, error])

    // switching seasons swaps out the whole team list, so any in-progress round (built from the
    // previous season's teams) no longer makes sense - clear it and require a fresh "Go!". Adjusted
    // during render (React's recommended way to reset state when a prop-like value changes) rather
    // than in an effect, so it doesn't cost an extra render pass. `completedRound` is deliberately
    // left alone: a finished round's results stay on screen until the next "Go!", changing era or
    // not.
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
        const isCorrectSlot = team !== undefined && overId === divisionDroppableId(team.conferenceName ?? 'NA', team.divisionName)

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
        setCompletedRound(null)
        setIsRunning(true)
    }

    // the toolbar has already rolled (and applied) the team-count fraction; roll the era +
    // show-names here, then let the effect above launch the round once the new era loads
    function handleRandomizeAndGo(fraction: TeamCountFraction) {
        setSeason(randomOf(validSeasonIds))
        setShowTeamNames(Math.random() < 0.5)
        setPendingRandomFraction(fraction)
    }

    return (
        <div className='h-full min-h-0 flex flex-col'>
            <div className='flex flex-row py-2 items-center'>
                <div className='w-1/3 mx-4'>
                    <QuizToolbar
                        showTeamNames={showTeamNames}
                        onShowTeamNamesChange={setShowTeamNames}
                        onRandomizeAndGo={handleRandomizeAndGo}
                        onGo={handleGo}
                        totalTeams={teams?.length ?? 0}
                    />
                </div>
                <div className='w-2/3 mx-4 flex flex-row items-center'>
                    <EraSelect season={season} onSeasonChange={setSeason}/>
                </div>
            </div>
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* exactly the space between the toolbar and the footer, and the one size container both panels'
                    cqh units resolve against - so cards come out the same size in each. A board that needs more
                    room than this scrolls here, not inside the board. */}
                <div className='flex-1 min-h-0 overflow-y-auto @container-[size]'>
                    {/* at least the full space above, taller when the board needs it; both panels stretch to it */}
                    <div className='min-h-full flex flex-row pb-[clamp(0.15rem,0.8cqh,0.5rem)]'>
                        {/* the bucket sits out of the flow so its own cards never make the row taller - it takes
                            whatever height the board gives the row and scrolls inside past that */}
                        <div className='w-1/3 min-w-0 mx-4 relative'>
                            <div className='absolute inset-0 @container'>
                                <UnplacedTeamBucket
                                    teams={teams ?? []}
                                    unplacedAbbrevs={unplacedAbbrevs}
                                    showTeamNames={showTeamNames}
                                    correctGuesses={correctGuesses}
                                    incorrectGuesses={incorrectGuesses}
                                    results={completedRound}
                                />
                            </div>
                        </div>
                        <div className='w-2/3 min-w-0 mx-4 flex flex-col'>
                            <LeagueBoard teams={teams ?? []} unplacedAbbrevs={unplacedAbbrevs} showTeamNames={showTeamNames} isPending={isPending} error={error}/>
                        </div>
                    </div>
                </div>
                <DragOverlay>
                    {activeTeam ? <TeamInfoCardView info={activeTeam} showTeamNames={showTeamNames} dragOverlay/> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
