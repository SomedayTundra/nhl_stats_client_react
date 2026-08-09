'use client'

import * as React from 'react'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

const teamCounts = [4, 8, 16, 24, 32] as const

type TeamCount = typeof teamCounts[number]

function isTeamCount(value: number): value is TeamCount {
    return (teamCounts as readonly number[]).includes(value)
}

type QuizToolbarProps = {
    showTeamNames: boolean
    onShowTeamNamesChange: (showTeamNames: boolean) => void
    onGo: (teamCount: number) => void
    correctGuesses: number
    incorrectGuesses: number
}

export default function QuizToolbar({showTeamNames, onShowTeamNamesChange, onGo, correctGuesses, incorrectGuesses}: QuizToolbarProps) {
    const [teamCount, setTeamCount] = useLocalStorageState<TeamCount>('nhlStats.quiz.teamCount', 8, {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return isTeamCount(parsed) ? parsed : 8
        },
    })

    const handleTeamCountChange = (value: string) => {
        const parsed = Number(value)
        if (isTeamCount(parsed)) {
            setTeamCount(parsed)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-4 ml-4">
                <div className="flex flex-row items-center gap-2 shrink-0">
                    <FieldLabel htmlFor="quiz-team-count" className="whitespace-nowrap">Number of teams:</FieldLabel>
                    <Combobox items={teamCounts.map(String)} value={String(teamCount)} onInputValueChange={handleTeamCountChange}>
                        <ComboboxInput id="quiz-team-count" className="w-20"/>
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
                <div className="flex flex-row items-center gap-2 shrink-0">
                    <Checkbox id="quiz-show-team-names" checked={showTeamNames} onCheckedChange={(checked) => onShowTeamNamesChange(checked === true)}/>
                    <FieldLabel htmlFor="quiz-show-team-names" className="whitespace-nowrap">Show Team Names</FieldLabel>
                </div>
            </div>
            {/* mirrors the w-1/3 / w-2/3 + mx-4 column layout of the bucket/board row below so the
                Go! button's right edge and the readout's left edge line up exactly with those panels */}
            <div className="flex flex-row">
                <div className="w-1/3 mx-4 flex flex-row justify-end">
                    <Button
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => onGo(teamCount)}
                    >
                        Go!
                    </Button>
                </div>
                <div className="w-2/3 mx-4 flex flex-row items-center gap-4">
                    <div className="flex flex-row items-center gap-4 whitespace-nowrap">
                        <span>Correct: <span className="text-green-600 font-semibold">{correctGuesses}</span></span>
                        <span>Incorrect: <span className="text-red-600 font-semibold">{incorrectGuesses}</span></span>
                    </div>
                </div>
            </div>
        </div>
    )
}
