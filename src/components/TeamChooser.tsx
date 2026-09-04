'use client'

import * as React from 'react'
import {ChevronDownIcon} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {groupTeamsByConferenceAndDivision, type TeamDivisionGroup} from '@/lib/teamGrouping'
import {useTeamInfo} from '@/hooks/useTeamInfo.ts'

type TeamChooserProps = {
    // seasonId whose teams to offer, e.g. '19951996'; '' until the caller has resolved one
    season: string
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

export default function TeamChooser({season, selected, onChange}: TeamChooserProps) {
    const {data: teams, isPending, error} = useTeamInfo(season || undefined)

    // select every team of the chosen season by default: on the very first load (unless a
    // selection was already restored from persisted state) and again whenever the season changes,
    // since the previous selection referenced a different era's teams. `defaultedForSeason` tracks
    // which season we last did this for so a restored selection / a remount isn't clobbered.
    const defaultedForSeason = React.useRef<string | null>(null)
    const seenFirstSeason = React.useRef(false)
    React.useEffect(() => {
        // teams is empty for an uncached season until its background farm lands - wait for it
        if (!season || !teams || teams.length === 0) return

        if (!seenFirstSeason.current) {
            seenFirstSeason.current = true
            if (selected.length > 0) {
                defaultedForSeason.current = season
                return
            }
        }

        if (defaultedForSeason.current === season) return
        defaultedForSeason.current = season
        onChange(teams.map((team) => team.teamAbbrev))
    }, [season, teams, selected, onChange])

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

    // seasons before conferences existed have every team grouped under the "NA" placeholder
    // conference groupTeamsByConferenceAndDivision falls back to - there's no real conference tier
    // to show, so its divisions hang directly off "League" instead of under an "NA" entry
    const hasConferenceInfo = conferences.length !== 1 || conferences[0].conferenceName !== 'NA'

    function renderDivision(division: TeamDivisionGroup, wrapperClassName: string, labelClassName: string) {
        const divisionAbbrevs = division.teams.map((team) => team.teamAbbrev)
        const divisionChecked = groupCheckedState(divisionAbbrevs, draftSelectedSet)

        return (
            <div key={division.divisionName} className={wrapperClassName}>
                <label className={labelClassName}>
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
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between border-neutral-800">
                    <span className={draftSelected.length === 0 ? 'text-red-600' : undefined}>
                        Teams ({draftSelected.length}/{teams.length})
                    </span>
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
                {hasConferenceInfo
                    ? conferences.map((conference) => {
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
                                {conference.divisions.map((division) =>
                                    renderDivision(division, 'ml-4', 'flex items-center gap-2 py-1 font-medium cursor-pointer')
                                )}
                            </div>
                        )
                    })
                    // no real conference tier: promote the divisions to top-level "League" children
                    : conferences[0]?.divisions.map((division) =>
                        renderDivision(division, 'mb-2', 'flex items-center gap-2 py-1 font-semibold cursor-pointer')
                    )}
            </PopoverContent>
        </Popover>
    )
}
