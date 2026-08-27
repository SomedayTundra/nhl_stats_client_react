'use client'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {getSeasonEntry, seasonEntries, type SeasonOption} from '@/lib/seasonOption.ts'

type SeasonSelectProps = {
    season: SeasonOption
    onSeasonChange: (season: SeasonOption) => void
}

export function SeasonSelect({season, onSeasonChange}: SeasonSelectProps) {
    const nameToSeasonId = new Map(seasonEntries.map((entry) => [entry.name, entry.seasonId]))
    const selectedEntry = getSeasonEntry(season)

    const handleInputValueChange = (name: string) => {
        const matched = nameToSeasonId.get(name)
        if (matched !== undefined) {
            onSeasonChange(matched)
        }
    }

    return (
        <div className="flex flex-row items-center gap-3">
            <Combobox
                items={seasonEntries.map((entry) => entry.name)}
                value={selectedEntry?.name ?? ''}
                onInputValueChange={handleInputValueChange}
            >
                <ComboboxInput id="quiz-season" className="w-72"/>
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
            {selectedEntry ? (
                <span className="text-sm text-muted-foreground">{selectedEntry.description}</span>
            ) : null}
        </div>
    )
}
