import {TeamInfoCard} from '@/components/TeamInfoCard.tsx'
import {useDroppable} from '@dnd-kit/core'
import * as React from 'react'
import {CornerLeftDown, CornerRightDown} from 'lucide-react'
import type {Conference, TeamInfo} from '@/lib/teamGrouping.ts'

// a team is only considered "placed" when dropped on the division droppable whose id matches its
// own conference/division - any other drop target (or a miss) leaves it unplaced
export function divisionDroppableId(conferenceName: string, divisionName: string): string {
    return `division:${conferenceName}:${divisionName}`
}

type DivisionDropZoneProps = {
    conferenceName: string
    divisionName: string
    children: React.ReactNode
}

function DivisionDropZone({conferenceName, divisionName, children}: DivisionDropZoneProps) {
    const {setNodeRef, isOver} = useDroppable({id: divisionDroppableId(conferenceName, divisionName)})

    return (
        <div
            ref={setNodeRef}
            className={`league-ref-one-division-container${isOver ? ' league-ref-one-division-container-drag-over' : ''}`}
        >
            {children}
        </div>
    )
}

type LeagueBoardProps = {
    teams: TeamInfo[]
    unplacedAbbrevs: Set<string>
    showTeamNames: boolean
    isPending: boolean
    error: Error | null
}

/**
 * React component that shows all placed team info content, one-team-per-TeamInfoCard
 */
export function LeagueBoard({teams, unplacedAbbrevs, showTeamNames, isPending, error}: LeagueBoardProps) {
    // built from every team, placed or not, so a division that's been fully emptied out into the
    // bucket still renders its (empty) drop zone - otherwise there'd be no way to drop a team back
    // into a division with nothing currently placed in it
    let newConferences: Map<string, Conference> = new Map()

    if (!isPending && !error) {
        teams.forEach((teamInfo) => {
            const conferenceName = teamInfo.conferenceName ?? 'NA'
            let conferenceForThisTeam = newConferences.get(conferenceName)
            if (conferenceForThisTeam === undefined) {
                conferenceForThisTeam = {divisions: new Map()}
                newConferences.set(conferenceName, conferenceForThisTeam)
            }

            const divisionName = teamInfo.divisionName
            let divisionForThisTeam = conferenceForThisTeam.divisions.get(divisionName)
            if (divisionForThisTeam === undefined) {
                divisionForThisTeam = {teams: []}
                conferenceForThisTeam.divisions.set(divisionName, divisionForThisTeam)
            }

            divisionForThisTeam.teams.push(teamInfo)
        })
    }

    return (
        <>
            <div className='league-ref-everything flex-1 flex flex-col'>
                <h1 className='league-ref-header'>NATIONAL HOCKEY LEAGUE</h1>
                <div className='league-ref-all-conferences-container flex-1'>
                    {[...newConferences.entries()].map(([conferenceName, conference]) => (
                        <div key={conferenceName} className='league-ref-one-conference-container'>
                            <h2 className='conference-name-row'>{conferenceName === 'NA' ? '' : `${conferenceName} Conference`}</h2>
                            {[...conference.divisions.entries()].map(([divisionName, division]) => (
                                <DivisionDropZone key={divisionName} conferenceName={conferenceName} divisionName={divisionName}>
                                    <h2 className='division-name-row flex flex-inline'>
                                        <CornerLeftDown color='var(--navbar-bg)' className='size-4 shrink-0 mt-1 mr-1 text-muted-foreground'/>
                                        {divisionName} Division
                                        <CornerRightDown color='var(--navbar-bg)' className='size-4 shrink-0 mt-1 ml-1 text-muted-foreground'/>
                                    </h2>
                                    <div className='team-info-card-row'>
                                        {division.teams
                                            .filter((teamInfo) => !unplacedAbbrevs.has(teamInfo.teamAbbrev))
                                            .map((teamInfo) => (
                                                <TeamInfoCard key={teamInfo.teamAbbrev} info={teamInfo} showTeamNames={showTeamNames} disabled/>
                                            ))}
                                    </div>
                                </DivisionDropZone>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
