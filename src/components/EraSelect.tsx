'use client'

import {useEffect, useLayoutEffect, useRef, useState} from 'react'

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {getSeasonEntry, seasonEntries, type SeasonId} from '@/lib/seasonId.ts'
// import {getSeasonEntry, seasonEntriesNewestFirst, type SeasonId} from '@/lib/seasonId.ts'

type EraSelectProps = {
    season: SeasonId
    onSeasonChange: (season: SeasonId) => void
}

// derived once from the static era list rather than per render
const longestSeasonName = seasonEntries
    .map((entry) => entry.name)
    .reduce((longest, name) => (name.length > longest.length ? name : longest), '')

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several eras
const WHEEL_STEP_COOLDOWN_MS = 120

// the measured sizer covers the trigger's text and its px-3 padding; the trigger also holds the
// chevron (size-4) and the gap-2 before it, so pad the measurement by those to fit the longest name
const TRIGGER_CHEVRON_ALLOWANCE_PX = 24

export function EraSelect({season, onSeasonChange}: EraSelectProps) {
    const selectedEntry = getSeasonEntry(season)

    // the era the pointer/keyboard is highlighting while the list is open; drives the description
    // preview and is cleared on close so it reverts to the real selection
    const [highlightedSeason, setHighlightedSeason] = useState<SeasonId | undefined>(undefined)
    const [widestNameWidth, setWidestNameWidth] = useState<number | undefined>(undefined)

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const sizerRef = useRef<HTMLSpanElement | null>(null)

    // latest-value refs so the wheel listener can be attached once instead of re-subscribed every
    // time the selected season changes (which it does on every wheel step)
    const openRef = useRef(false)
    const seasonRef = useRef(season)
    const onSeasonChangeRef = useRef(onSeasonChange)
    const lastStepAtRef = useRef(0)

    useEffect(() => {
        seasonRef.current = season
        onSeasonChangeRef.current = onSeasonChange
    })

    // size the trigger to hold the longest name whatever is selected; the ResizeObserver re-measures
    // when the webfont loads or the responsive font-size changes. The sizer carries the trigger's own
    // px-3, so the measured width already includes horizontal padding.
    useLayoutEffect(() => {
        const sizer = sizerRef.current
        if (sizer === null) {
            return
        }
        const measure = () => setWidestNameWidth(sizer.getBoundingClientRect().width)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(sizer)
        return () => observer.disconnect()
    }, [])

    const handleOpenChange = (open: boolean) => {
        openRef.current = open
        if (!open) {
            setHighlightedSeason(undefined)
        }
    }

    // highlightedSeason is cleared on close, so a value here already means the list is open
    const describedEntry =
        (highlightedSeason !== undefined ? getSeasonEntry(highlightedSeason) : undefined) ?? selectedEntry

    // native, non-passive wheel listener: React's synthetic onWheel is passive, so it can't
    // preventDefault the page scroll. Acts only while the dropdown is closed and the pointer is
    // over the control - wheel down moves to the next entry in the list, wheel up the previous.
    useEffect(() => {
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

            const currentIndex = seasonEntries.findIndex((entry) => entry.seasonId === seasonRef.current)
            const step = event.deltaY > 0 ? 1 : -1
            const nextIndex = Math.min(Math.max(currentIndex + step, 0), seasonEntries.length - 1)
            if (nextIndex !== currentIndex) {
                lastStepAtRef.current = event.timeStamp
                onSeasonChangeRef.current(seasonEntries[nextIndex].seasonId)
            }
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [])

    return (
        <div ref={wrapperRef} className="relative flex flex-row items-center gap-3">
            Era:
            {/* hidden twin of the longest entry name, measured to size the trigger */}
            <span
                ref={sizerRef}
                aria-hidden
                className="pointer-events-none invisible absolute left-0 top-0 px-3 text-base whitespace-nowrap md:text-sm"
            >
                {longestSeasonName}
            </span>
            <Tooltip>
                {/* trigger wraps only the select, so the tooltip stays centered over it - anchoring
                    it to the whole control lets the variable-width description shift it side to side */}
                <TooltipTrigger asChild>
                    <div className="flex">
                        <Select
                            value={selectedEntry?.seasonId ?? ''}
                            onValueChange={onSeasonChange}
                            onOpenChange={handleOpenChange}
                        >
                            <SelectTrigger
                                id="quiz-season"
                                style={
                                    widestNameWidth !== undefined
                                        ? {minWidth: `${widestNameWidth + TRIGGER_CHEVRON_ALLOWANCE_PX}px`}
                                        : undefined
                                }
                            >
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {seasonEntries.map((entry) => (
                                    // radix moves focus onto an item as the pointer or arrow keys
                                    // highlight it, so focus doubles as the highlight signal
                                    <SelectItem
                                        key={entry.seasonId}
                                        value={entry.seasonId}
                                        onFocus={() => setHighlightedSeason(entry.seasonId)}
                                    >
                                        {entry.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top">Mousewheel to browse through time</TooltipContent>
            </Tooltip>
            {describedEntry ? (
                <span className="text-sm text-muted-foreground">{describedEntry.description}</span>
            ) : null}
        </div>
    )
}
