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

function haveSameElements(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false
    const bSet = new Set(b)
    return a.every((value) => bSet.has(value))
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

    // default to every team selected once the team list first loads, but only when nothing was
    // already selected (e.g. restored from persisted state) - otherwise this would clobber that
    // restored selection every time the component remounts
    const didInitializeSelection = React.useRef(false)
    React.useEffect(() => {
        if (!teams || didInitializeSelection.current) return
        didInitializeSelection.current = true
        if (selected.length === 0) {
            onChange(teams.map((team) => team.teamAbbrev))
        }
    }, [teams, onChange, selected])

    // checkbox clicks only edit this draft; it's only pushed to onChange when the popover closes
    const [open, setOpen] = React.useState(false)
    const [draftSelected, setDraftSelected] = React.useState<string[]>(selected)

    // keep the draft in sync with externally-driven changes to `selected` (e.g. the default
    // select-all above) as long as the popover is closed; while open, edits stay local to the draft
    React.useEffect(() => {
        if (!open) {
            setDraftSelected(selected)
        }
    }, [selected, open])

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) {
            setDraftSelected(selected)
        } else if (!haveSameElements(draftSelected, selected)) {
            onChange(draftSelected)
        }
        setOpen(nextOpen)
    }

    const draftSelectedSet = React.useMemo(() => new Set(draftSelected), [draftSelected])

    function toggleTeam(abbrev: string) {
        if (draftSelectedSet.has(abbrev)) {
            setDraftSelected(draftSelected.filter((a) => a !== abbrev))
        } else {
            setDraftSelected([...draftSelected, abbrev])
        }
    }

    function toggleGroup(abbrevs: string[]) {
        const allSelected = abbrevs.every((abbrev) => draftSelectedSet.has(abbrev))
        if (allSelected) {
            const toRemove = new Set(abbrevs)
            setDraftSelected(draftSelected.filter((abbrev) => !toRemove.has(abbrev)))
        } else {
            const merged = new Set(draftSelected)
            abbrevs.forEach((abbrev) => merged.add(abbrev))
            setDraftSelected(Array.from(merged))
        }
    }

    if (isPending) return <Button variant="outline" disabled>Loading teams...</Button>

    if (error) return <Button variant="outline" disabled>Failed to load teams</Button>

    const conferences = groupTeamsByConferenceAndDivision(teams)
    const allAbbrevs = teams.map((team) => team.teamAbbrev)
    const leagueChecked = groupCheckedState(allAbbrevs, draftSelectedSet)

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                    Teams ({draftSelected.length}/{teams.length})
                    <ChevronDownIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto p-2" align="start">
                <label className="flex items-center gap-2 py-1 mb-2 pb-2 border-b font-bold cursor-pointer">
                    <Checkbox
                        checked={leagueChecked}
                        onCheckedChange={() => toggleGroup(allAbbrevs)}
                    />
                    League
                </label>
                {conferences.map((conference) => {
                    const conferenceAbbrevs = conference.divisions.flatMap((division) => division.teams.map((team) => team.teamAbbrev))
                    const conferenceChecked = groupCheckedState(conferenceAbbrevs, draftSelectedSet)

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
                                const divisionChecked = groupCheckedState(divisionAbbrevs, draftSelectedSet)

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
                                                    checked={draftSelectedSet.has(team.teamAbbrev)}
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
