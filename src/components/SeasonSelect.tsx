'use client'

import {useMemo} from 'react'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {useSeasonInfo} from '@/hooks/useSeasonInfo.ts'
import {buildSeasonIds, seasonIdToLabel} from '@/lib/season.ts'

type SeasonSelectProps = {
    // the selected seasonId, e.g. '19951996' (empty string until the caller has resolved a default)
    value: string
    onChange: (seasonId: string) => void
}

// "Season:" label + a combo box holding one entry per playable season from 1942-43 through the
// current season (newest first). Controlled: the caller owns the value and persists it.
export function SeasonSelect({value, onChange}: SeasonSelectProps) {
    // no argument -> the season currently in progress, or the upcoming one between seasons; it's
    // the newest entry the picker offers
    const {data: currentSeason} = useSeasonInfo()

    const {labels, seasonIdByLabel, labelBySeasonId} = useMemo(() => {
        // before we know the current season, fall back to just the selected id so the control
        // still shows the right thing
        const ids = currentSeason
            ? buildSeasonIds(currentSeason.seasonId)
            : (value ? [value] : [])

        const seasonIdByLabel = new Map<string, string>()
        const labelBySeasonId = new Map<string, string>()
        for (const id of ids) {
            const label = seasonIdToLabel(id)
            seasonIdByLabel.set(label, id)
            labelBySeasonId.set(id, label)
        }
        return {labels: ids.map(seasonIdToLabel), seasonIdByLabel, labelBySeasonId}
    }, [currentSeason, value])

    const handleInputValueChange = (label: string) => {
        const id = seasonIdByLabel.get(label)
        if (id !== undefined) {
            onChange(id)
        }
    }

    const selectedLabel = value ? (labelBySeasonId.get(value) ?? seasonIdToLabel(value)) : ''

    return (
        <div className="flex flex-row items-center gap-2 shrink-0">
            <FieldLabel htmlFor="season-select" className="justify-start whitespace-nowrap">Season:</FieldLabel>
            <Combobox
                items={labels}
                value={selectedLabel}
                onInputValueChange={handleInputValueChange}
                autoHighlight
            >
                <ComboboxInput id="season-select" className="w-32"/>
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
    )
}
