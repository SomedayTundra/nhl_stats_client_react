'use client'

import * as React from 'react'
import {ChevronDownIcon} from 'lucide-react'
import {useQuery} from '@tanstack/react-query'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import type {TeamInfo} from '@/state/types'
import {groupTeamsByConferenceAndDivision} from '@/lib/teamGrouping'

const SERVER = 'localhost:8000'

type TeamChooserProps = {
    selected: string[]
    onChange: (selected: string[]) => void
}

function groupCheckedState(abbrevs: string[], selectedSet: Set<string>): boolean | 'indeterminate' {
    const selectedCount = abbrevs.filter((abbrev) => selectedSet.has(abbrev)).length
    if (selectedCount === 0) return false
    if (selectedCount === abbrevs.length) return true
    return 'indeterminate'
}

export default function TeamChooser({selected, onChange}: TeamChooserProps) {
    const {data: teams, isPending, error} = useQuery<TeamInfo[]>({
        queryKey: ['teamInfo'],
        queryFn: async () => {
            const response = await fetch(`http://${SERVER}/api/nhl_team_info/`)
            if (!response.ok) {
                throw new Error(`An error occurred: ${response.statusText}`)
            }
            return (await response.json()) as TeamInfo[]
        }
    })

    // default to every team selected once the team list first loads
    const didInitializeSelection = React.useRef(false)
    React.useEffect(() => {
        if (teams && !didInitializeSelection.current) {
            didInitializeSelection.current = true
            onChange(teams.map((team) => team.teamAbbrev))
        }
    }, [teams, onChange])

    const selectedSet = React.useMemo(() => new Set(selected), [selected])

    function toggleTeam(abbrev: string) {
        if (selectedSet.has(abbrev)) {
            onChange(selected.filter((a) => a !== abbrev))
        } else {
            onChange([...selected, abbrev])
        }
    }

    function toggleGroup(abbrevs: string[]) {
        const allSelected = abbrevs.every((abbrev) => selectedSet.has(abbrev))
        if (allSelected) {
            const toRemove = new Set(abbrevs)
            onChange(selected.filter((abbrev) => !toRemove.has(abbrev)))
        } else {
            const merged = new Set(selected)
            abbrevs.forEach((abbrev) => merged.add(abbrev))
            onChange(Array.from(merged))
        }
    }

    if (isPending) return <Button variant="outline" disabled>Loading teams...</Button>

    if (error) return <Button variant="outline" disabled>Failed to load teams</Button>

    const conferences = groupTeamsByConferenceAndDivision(teams)

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                    Teams ({selected.length}/{teams.length})
                    <ChevronDownIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto p-2" align="start">
                {conferences.map((conference) => {
                    const conferenceAbbrevs = conference.divisions.flatMap((division) => division.teams.map((team) => team.teamAbbrev))
                    const conferenceChecked = groupCheckedState(conferenceAbbrevs, selectedSet)

                    return (
                        <div key={conference.conferenceName} className="mb-2">
                            <label className="flex items-center gap-2 py-1 font-semibold cursor-pointer">
                                <Checkbox
                                    checked={conferenceChecked}
                                    onCheckedChange={() => toggleGroup(conferenceAbbrevs)}
                                />
                                {conference.conferenceName}
                            </label>
                            {conference.divisions.map((division) => {
                                const divisionAbbrevs = division.teams.map((team) => team.teamAbbrev)
                                const divisionChecked = groupCheckedState(divisionAbbrevs, selectedSet)

                                return (
                                    <div key={division.divisionName} className="ml-4">
                                        <label className="flex items-center gap-2 py-1 font-medium cursor-pointer">
                                            <Checkbox
                                                checked={divisionChecked}
                                                onCheckedChange={() => toggleGroup(divisionAbbrevs)}
                                            />
                                            {division.divisionName}
                                        </label>
                                        {division.teams.map((team) => (
                                            <label key={team.teamAbbrev} className="flex items-center gap-2 py-1 ml-4 cursor-pointer">
                                                <Checkbox
                                                    checked={selectedSet.has(team.teamAbbrev)}
                                                    onCheckedChange={() => toggleTeam(team.teamAbbrev)}
                                                />
                                                {team.teamName}
                                            </label>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </PopoverContent>
        </Popover>
    )
}
