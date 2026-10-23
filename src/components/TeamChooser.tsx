'use client'

import * as React from 'react'
import {ChevronDownIcon} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {groupTeamsByConferenceAndDivision, type TeamConferenceGroup, type TeamDivisionGroup, type TeamInfo} from '@/lib/teamGrouping'
import {useTeamInfo} from '@/hooks/useTeamInfo.ts'

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip past several stops - mirrors SeasonSelect's own
// wheel support
const WHEEL_STEP_COOLDOWN_MS = 120

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

type WheelStop = {
    // what the tooltip calls this stop: the literal word "league", or a conference/division's own
    // name - shown in the tooltip as "; currently {name}" when the selection matches this stop
    name: string
    abbrevs: string[]
}

// the mousewheel's stops, in order: the whole league; then each conference alone (skipped
// entirely for a pre-conference season, where hasConferenceInfo is false); then each division
// alone - wrapping back to the league after that.
function buildWheelStops(teams: TeamInfo[], conferences: TeamConferenceGroup[], hasConferenceInfo: boolean): WheelStop[] {
    const stops: WheelStop[] = [{name: 'League', abbrevs: teams.map((team) => team.teamAbbrev)}]

    if (hasConferenceInfo) {
        for (const conference of conferences) {
            stops.push({
                name: conference.conferenceName,
                abbrevs: conference.divisions.flatMap((division) => division.teams.map((team) => team.teamAbbrev)),
            })
        }
    }

    const allDivisions = hasConferenceInfo ? conferences.flatMap((c) => c.divisions) : (conferences[0]?.divisions ?? [])
    for (const division of allDivisions) {
        stops.push({name: division.divisionName, abbrevs: division.teams.map((team) => team.teamAbbrev)})
    }

    return stops
}

export default function TeamChooser({season, selected, onChange}: TeamChooserProps) {
    const {data: teams, isPending, error} = useTeamInfo(season || undefined)

    // computed with a safe `teams ?? []` fallback (rather than after the isPending/error early
    // returns below) specifically so the wheel hooks further down - which need hooks called
    // unconditionally on every render - can depend on them
    const loadedTeams = teams ?? []
    const conferences = groupTeamsByConferenceAndDivision(loadedTeams)
    const allAbbrevs = loadedTeams.map((team) => team.teamAbbrev)
    // seasons before conferences existed have every team grouped under the "NA" placeholder
    // conference groupTeamsByConferenceAndDivision falls back to - there's no real conference tier
    // to show, so its divisions hang directly off "League" instead of under an "NA" entry
    const hasConferenceInfo = conferences.length !== 1 || conferences[0].conferenceName !== 'NA'
    const wheelStops = buildWheelStops(loadedTeams, conferences, hasConferenceInfo)

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

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) {
            setDraftSelected(selected)
        } else if (!haveSameElements(draftSelected, selected)) {
            onChange(draftSelected)
        }
        setOpen(nextOpen)
    }

    // latest-value refs so the wheel listener can be bound once instead of re-subscribed on every
    // step (the selection changes on each wheel tick) - same pattern as SeasonSelect's own wheel
    // support, but stepping (with wraparound) through wheelStops instead of a single value list
    const wrapperRef = React.useRef<HTMLDivElement | null>(null)
    const openRef = React.useRef(open)
    const selectedRef = React.useRef(selected)
    const onChangeRef = React.useRef(onChange)
    const wheelStopsRef = React.useRef(wheelStops)
    const lastStepAtRef = React.useRef(0)

    React.useEffect(() => {
        openRef.current = open
        selectedRef.current = selected
        onChangeRef.current = onChange
        wheelStopsRef.current = wheelStops
    })

    // native, non-passive wheel listener: React's synthetic onWheel is passive so it can't
    // preventDefault the page scroll. Acts only while the popover is closed and the pointer is
    // over the control - wheel down steps forward through wheelStops, wheel up steps backward,
    // wrapping at both ends.
    //
    // depends on [isPending, error] rather than running once at mount ([]): while isPending is
    // still true this component's own return is the disabled "Loading teams..." button, so
    // wrapperRef.current is null the first time this would otherwise run - it needs to retry once
    // isPending flips false and the real, ref-bearing markup below actually exists to attach to.
    React.useEffect(() => {
        const wrapper = wrapperRef.current
        if (wrapper === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            if (openRef.current || Math.abs(event.deltaY) < 1) {
                return
            }
            event.preventDefault()

            if (event.timeStamp - lastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }

            const stops = wheelStopsRef.current
            if (stops.length === 0) {
                return
            }
            const currentIndex = stops.findIndex((stop) => haveSameElements(stop.abbrevs, selectedRef.current))
            // the current selection doesn't match any stop (a custom pick) - land on the league
            // (index 0) as a predictable place to start the cycle from, either direction
            const nextIndex = currentIndex === -1
                ? 0
                : (currentIndex + (event.deltaY > 0 ? 1 : -1) + stops.length) % stops.length

            lastStepAtRef.current = event.timeStamp
            onChangeRef.current(stops[nextIndex].abbrevs)
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [isPending, error])

    const draftSelectedSet = new Set(draftSelected)

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

    const leagueChecked = groupCheckedState(allAbbrevs, draftSelectedSet)

    // the tooltip names whichever wheel stop the *committed* selection currently matches; a
    // custom pick that doesn't line up with any stop just leaves that off rather than guess
    const currentStopName = wheelStops.find((stop) => haveSameElements(stop.abbrevs, selected))?.name

    // when the select popover is open, this holds the count of the "draft selection," basically
    // whatever the user has checked/unchecked; when the popover closes, the draft becomes the
    // actual selection ('selected') so this holds that length instead
    const shownSelectedCount = open ? draftSelected.length : selected.length

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
        <div ref={wrapperRef} className="flex">
            <Popover open={open} onOpenChange={handleOpenChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-between select-none border-neutral-800">
                                <span className={shownSelectedCount === 0 ? 'text-red-600' : undefined}>
                                    {currentStopName ? currentStopName : "Teams"} ({shownSelectedCount}/{teams.length})
                                </span>
                                <ChevronDownIcon/>
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <div className='items-center'>Mousewheel to quick-select groups</div>
                    </TooltipContent>
                </Tooltip>
                {/* grows to fit every team, capped at the room radix measures between the trigger and
                    the viewport edge (less collisionPadding) - only past that does it scroll */}
                <PopoverContent
                    className="w-80 max-h-(--radix-popover-content-available-height) overflow-y-auto p-2"
                    align="start"
                    collisionPadding={8}
                >
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
        </div>
    )
}
