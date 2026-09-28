'use client'

import {useEffect, useLayoutEffect, useRef, useState} from 'react'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {getSeasonEntry, seasonEntries, type SeasonId} from '@/lib/seasonId.ts'
// import {getSeasonEntry, seasonEntriesNewestFirst, type SeasonId} from '@/lib/seasonId.ts'

type EraSelectProps = {
    season: SeasonId
    onSeasonChange: (season: SeasonId) => void
}

// derived once from the static era list rather than per render
const seasonNames = seasonEntries.map((entry) => entry.name)
const seasonEntryByName = new Map(seasonEntries.map((entry) => [entry.name, entry]))
const longestSeasonName = seasonNames.reduce((longest, name) => (name.length > longest.length ? name : longest), '')

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several eras
const WHEEL_STEP_COOLDOWN_MS = 120

// the open dropdown's list is overflow-y-auto and its popup width is derived from this input's
// width (--anchor-width). Pad the measured name width so the popup keeps room for a vertical
// scrollbar - without this the scrollbar eats into the row and wraps the longest names onto two
// lines. Doubles as making the closed control read a touch wider next to the description text.
const DROPDOWN_SCROLLBAR_ALLOWANCE_PX = 24

export function EraSelect({season, onSeasonChange}: EraSelectProps) {
    const selectedEntry = getSeasonEntry(season)

    // the name the pointer/keyboard is highlighting while the list is open; drives the description
    // preview and is cleared on close so it reverts to the real selection
    const [highlightedName, setHighlightedName] = useState<string | undefined>(undefined)
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

    // size the input to hold the longest name whatever is selected; the ResizeObserver re-measures
    // when the webfont loads or the responsive font-size changes. The sizer carries the input's own
    // px-3, so the measured width already includes horizontal padding (the inline-end addon makes
    // the real right padding pr-2, so this over-allocates by ~0.25rem - harmless, never clips).
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

    const handleInputValueChange = (name: string) => {
        const matched = seasonEntryByName.get(name)
        if (matched !== undefined) {
            onSeasonChange(matched.seasonId)
        }
    }

    const handleOpenChange = (open: boolean) => {
        openRef.current = open
        if (!open) {
            setHighlightedName(undefined)
        }
    }

    // highlightedName is cleared on close, so a value here already means the list is open
    const describedEntry =
        (highlightedName !== undefined ? seasonEntryByName.get(highlightedName) : undefined) ?? selectedEntry

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
            {/* hidden twin of the longest entry name, measured to size the input */}
            <span
                ref={sizerRef}
                aria-hidden
                className="pointer-events-none invisible absolute left-0 top-0 px-3 text-base whitespace-nowrap md:text-sm"
            >
                {longestSeasonName}
            </span>
            <Tooltip>
                {/* trigger wraps only the combo box, so the tooltip stays centered over it - anchoring
                    it to the whole control lets the variable-width description shift it side to side */}
                <TooltipTrigger asChild>
                    <div className="flex">
                        <Combobox
                            items={seasonNames}
                            value={selectedEntry?.name ?? ''}
                            onInputValueChange={handleInputValueChange}
                            onOpenChange={handleOpenChange}
                            onItemHighlighted={(name) => setHighlightedName(name)}
                        >
                            <ComboboxInput
                                id="quiz-season"
                                style={
                                    widestNameWidth !== undefined
                                        ? {minWidth: `${widestNameWidth + DROPDOWN_SCROLLBAR_ALLOWANCE_PX}px`}
                                        : undefined
                                }
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {item}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
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
