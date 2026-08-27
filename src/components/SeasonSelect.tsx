'use client'

import {useEffect, useLayoutEffect, useRef, useState} from 'react'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {getSeasonEntry, seasonEntries, type SeasonOption} from '@/lib/seasonOption.ts'

type SeasonSelectProps = {
    season: SeasonOption
    onSeasonChange: (season: SeasonOption) => void
}

// seasonEntries runs oldest-to-newest; the picker shows newest-first
const orderedSeasonEntries = [...seasonEntries].reverse()

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several eras
const WHEEL_STEP_COOLDOWN_MS = 120

// covers the input's own horizontal padding (pl-3 + pr-2) plus a small anti-clip buffer, added
// on top of the measured text width so the widest entry never touches the edge
const INPUT_PADDING_ALLOWANCE = '1.75rem'

export function SeasonSelect({season, onSeasonChange}: SeasonSelectProps) {
    const entryByName = new Map(orderedSeasonEntries.map((entry) => [entry.name, entry]))
    const selectedEntry = getSeasonEntry(season)

    const [open, setOpen] = useState(false)
    // the name of the item the pointer/keyboard is currently highlighting while the list is open;
    // drives the description preview and is cleared on close so it reverts to the real selection
    const [highlightedName, setHighlightedName] = useState<string | undefined>(undefined)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const lastStepAtRef = useRef(0)

    // measure the pixel width of the longest entry name (in the real rendered font) so the input
    // can be sized to hold it whatever is currently selected; a ResizeObserver on the hidden
    // sizer re-measures when the font finishes loading or the responsive font-size changes
    const sizerRef = useRef<HTMLDivElement | null>(null)
    const [widestNameWidth, setWidestNameWidth] = useState<number | undefined>(undefined)

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
        const matched = entryByName.get(name)
        if (matched !== undefined) {
            onSeasonChange(matched.seasonId)
        }
    }

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (!nextOpen) {
            setHighlightedName(undefined)
        }
    }

    // while open, preview the highlighted item's description; otherwise show the selected one
    const previewEntry = open && highlightedName !== undefined ? entryByName.get(highlightedName) : undefined
    const describedEntry = previewEntry ?? selectedEntry

    // native, non-passive wheel listener: React's synthetic onWheel is passive, so it can't
    // preventDefault the page scroll. Only active while the dropdown is closed and the pointer
    // is over the control - wheel down moves to the next entry in the list, wheel up the previous.
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (wrapper === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            if (open || Math.abs(event.deltaY) < 1) {
                return
            }
            event.preventDefault()

            if (event.timeStamp - lastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }

            const currentIndex = orderedSeasonEntries.findIndex((entry) => entry.seasonId === season)
            if (currentIndex === -1) {
                return
            }
            const step = event.deltaY > 0 ? 1 : -1
            const nextIndex = Math.min(Math.max(currentIndex + step, 0), orderedSeasonEntries.length - 1)
            if (nextIndex !== currentIndex) {
                lastStepAtRef.current = event.timeStamp
                onSeasonChange(orderedSeasonEntries[nextIndex].seasonId)
            }
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [open, season, onSeasonChange])

    return (
        <div ref={wrapperRef} className="relative flex flex-row items-center gap-3">
            {/* hidden, non-interactive stack of every entry name, used only to measure the widest */}
            <div
                ref={sizerRef}
                aria-hidden
                className="pointer-events-none invisible absolute left-0 top-0 w-max text-base whitespace-nowrap md:text-sm"
            >
                {orderedSeasonEntries.map((entry) => (
                    <div key={entry.seasonId}>{entry.name}</div>
                ))}
            </div>
            <Combobox
                items={orderedSeasonEntries.map((entry) => entry.name)}
                value={selectedEntry?.name ?? ''}
                onInputValueChange={handleInputValueChange}
                open={open}
                onOpenChange={handleOpenChange}
                onItemHighlighted={(name) => setHighlightedName(name)}
            >
                <ComboboxInput
                    id="quiz-season"
                    style={
                        widestNameWidth !== undefined
                            ? {minWidth: `calc(${widestNameWidth}px + ${INPUT_PADDING_ALLOWANCE})`}
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
            {describedEntry ? (
                <span className="text-sm text-muted-foreground">{describedEntry.description}</span>
            ) : null}
        </div>
    )
}
