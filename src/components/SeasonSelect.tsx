'use client'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {seasonLabels, seasonOptions, type SeasonOption} from '@/lib/seasonOption.ts'

type SeasonSelectProps = {
    season: SeasonOption
    onSeasonChange: (season: SeasonOption) => void
}

export function SeasonSelect({season, onSeasonChange}: SeasonSelectProps) {
    const labelToSeason = new Map(seasonOptions.map((option) => [seasonLabels[option], option]))

    const handleInputValueChange = (label: string) => {
        const matched = labelToSeason.get(label)
        if (matched !== undefined) {
            onSeasonChange(matched)
        }
    }

    return (
        <Combobox items={seasonOptions.map((option) => seasonLabels[option])} value={seasonLabels[season]} onInputValueChange={handleInputValueChange}>
            <ComboboxInput id="quiz-season" className="w-40"/>
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
    )
}
