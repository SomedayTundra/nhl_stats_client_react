'use client'

import {useEffect, useRef} from 'react'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {useSeasonInfo} from '@/hooks/useSeasonInfo.ts'
import {buildSeasonIds, seasonIdToLabel} from '@/lib/season.ts'

type SeasonSelectProps = {
    // the selected seasonId, e.g. '19951996' (empty string until the caller has resolved a default)
    value: string
    onChange: (seasonId: string) => void
}

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several seasons
const WHEEL_STEP_COOLDOWN_MS = 120

// "Season:" label + a combo box holding one entry per playable season from 1942-43 through the
// current season (newest first). Controlled: the caller owns the value and persists it.
export function SeasonSelect({value, onChange}: SeasonSelectProps) {
    // the newest entry the picker offers: the season currently in progress, or the most recently
    // completed one if today falls between seasons.
    const {data: currentSeasonInfo} = useSeasonInfo()
    const latestSeasonId = currentSeasonInfo ? String(currentSeasonInfo.seasonId) : ''

    // before the lookup resolves, fall back to just the selected id so the control still shows the
    // right thing
    const ids = latestSeasonId
        ? buildSeasonIds(latestSeasonId)
        : (value ? [value] : [])

    const seasonIdByLabel = new Map<string, string>()
    const labelBySeasonId = new Map<string, string>()
    for (const id of ids) {
        const label = seasonIdToLabel(id)
        seasonIdByLabel.set(label, id)
        labelBySeasonId.set(id, label)
    }
    const labels = ids.map(seasonIdToLabel)

    const handleInputValueChange = (label: string) => {
        const id = seasonIdByLabel.get(label)
        if (id !== undefined) {
            onChange(id)
        }
    }

    const selectedLabel = value ? (labelBySeasonId.get(value) ?? seasonIdToLabel(value)) : ''

    // latest-value refs so the wheel listener can be bound once instead of re-subscribed on every
    // step (the selection changes on each wheel tick)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const openRef = useRef(false)
    const idsRef = useRef(ids)
    const valueRef = useRef(value)
    const onChangeRef = useRef(onChange)
    const lastStepAtRef = useRef(0)

    useEffect(() => {
        idsRef.current = ids
        valueRef.current = value
        onChangeRef.current = onChange
    })

    // native, non-passive wheel listener: React's synthetic onWheel is passive so it can't
    // preventDefault the page scroll. Acts only while the dropdown is closed and the pointer is
    // over the control - wheel down picks the next entry in the list, wheel up the previous.
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

            const seasonIds = idsRef.current
            const currentIndex = seasonIds.indexOf(valueRef.current)
            if (currentIndex === -1) {
                return
            }
            const step = event.deltaY > 0 ? 1 : -1
            const nextIndex = Math.min(Math.max(currentIndex + step, 0), seasonIds.length - 1)
            if (nextIndex !== currentIndex) {
                lastStepAtRef.current = event.timeStamp
                onChangeRef.current(seasonIds[nextIndex])
            }
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [])

    return (
        <div ref={wrapperRef} className="flex flex-row items-center gap-2 shrink-0">
            <FieldLabel htmlFor="season-select" className="justify-start whitespace-nowrap">Season:</FieldLabel>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex">
                        <Combobox
                            items={labels}
                            value={selectedLabel}
                            onInputValueChange={handleInputValueChange}
                            onOpenChange={(open) => {
                                openRef.current = open
                            }}
                            autoHighlight
                        >
                            {/* matches the outline Button's hovered/unhovered look (e.g. the TeamChooser trigger):
                                bg-background at rest, bg-accent/text-accent-foreground on hover */}
                            <ComboboxInput
                                id="season-select"
                                className="w-32 border-neutral-800 bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50"
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
        </div>
    )
}
