'use client'

import * as React from 'react'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

const teamCounts = [1, 2, 4, 8, 16, 24, 32] as const

type TeamCount = typeof teamCounts[number]

function isTeamCount(value: number): value is TeamCount {
    return (teamCounts as readonly number[]).includes(value)
}

type QuizToolbarProps = {
    showTeamNames: boolean
    onShowTeamNamesChange: (showTeamNames: boolean) => void
}

export default function QuizToolbar({showTeamNames, onShowTeamNamesChange}: QuizToolbarProps) {
    const [teamCount, setTeamCount] = useLocalStorageState<TeamCount>('nhlStats.quiz.teamCount', 8, {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return isTeamCount(parsed) ? parsed : 8
        },
    })
    const [isRunning, setIsRunning] = React.useState(false)
    const [correctGuesses] = React.useState(0)
    const [incorrectGuesses] = React.useState(0)

    const handleTeamCountChange = (value: string) => {
        const parsed = Number(value)
        if (isTeamCount(parsed)) {
            setTeamCount(parsed)
        }
    }

    return (
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
            <Button
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isRunning}
                onClick={() => setIsRunning(true)}
            >
                Go!
            </Button>
            <Button
                className="group bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-100 disabled:bg-gray-300 disabled:text-gray-500"
                disabled={!isRunning}
                onClick={() => setIsRunning(false)}
            >
                I give up <span className="group-disabled:grayscale">🤔</span>
            </Button>
            <div className="flex flex-row items-center gap-4 whitespace-nowrap">
                <span>Correct: <span className="text-green-600 font-semibold">{correctGuesses}</span></span>
                <span>Incorrect: <span className="text-red-600 font-semibold">{incorrectGuesses}</span></span>
            </div>
        </div>
    )
}
