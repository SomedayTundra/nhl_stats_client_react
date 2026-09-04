'use client'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

const teamCountFractions = ['all', 'threeQuarters', 'half', 'quarter'] as const

type TeamCountFraction = typeof teamCountFractions[number]

const teamCountFractionMultipliers: Record<TeamCountFraction, number> = {
    all: 1,
    threeQuarters: 0.75,
    half: 0.5,
    quarter: 0.25,
}

function isTeamCountFraction(value: string): value is TeamCountFraction {
    return (teamCountFractions as readonly string[]).includes(value)
}

// the four choices scale with however many teams the selected season actually has, rather than
// being fixed counts - so switching seasons (and therefore total team count) updates them too
function teamCountForFraction(fraction: TeamCountFraction, totalTeams: number): number {
    return Math.round(totalTeams * teamCountFractionMultipliers[fraction])
}

type QuizToolbarProps = {
    showTeamNames: boolean
    onShowTeamNamesChange: (showTeamNames: boolean) => void
    onGo: (teamCount: number) => void
    totalTeams: number
}

export default function QuizToolbar({showTeamNames, onShowTeamNamesChange, onGo, totalTeams}: QuizToolbarProps) {
    const [teamCountFraction, setTeamCountFraction] = useLocalStorageState<TeamCountFraction>('nhlStats.quiz.teamCountFraction', 'quarter', {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return typeof parsed === 'string' && isTeamCountFraction(parsed) ? parsed : 'quarter'
        },
    })

    const teamCount = teamCountForFraction(teamCountFraction, totalTeams)

    // selection is keyed by fraction, not by the displayed team count - the count for each
    // fraction shifts whenever totalTeams changes (i.e. the season changes), so tying selection
    // to the numeric label would silently lose the user's choice the moment the numbers moved
    const handleTeamCountFractionChange = (value: TeamCountFraction | null) => {
        if (value !== null) {
            setTeamCountFraction(value)
        }
    }

    return (
        <div className="flex flex-row items-center gap-4">
            <div className="flex flex-row items-center gap-2 shrink-0">
                <FieldLabel htmlFor="quiz-team-count" className="whitespace-nowrap">Number of teams:</FieldLabel>
                <Combobox<TeamCountFraction>
                    // remount when totalTeams changes - the combobox only recomputes its displayed
                    // input text from itemToStringLabel when the selected value itself changes, so
                    // without this key the input would keep showing the previous season's number
                    key={totalTeams}
                    items={teamCountFractions}
                    value={teamCountFraction}
                    onValueChange={handleTeamCountFractionChange}
                    itemToStringLabel={(fraction) => String(teamCountForFraction(fraction, totalTeams))}
                >
                    <ComboboxInput id="quiz-team-count" className="w-20 gray"/>
                    <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                            {(fraction: TeamCountFraction) => (
                                <ComboboxItem key={fraction} value={fraction}>
                                    {teamCountForFraction(fraction, totalTeams)}
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
                className="bg-green-600 text-white hover:bg-green-700 ml-auto"
                onClick={() => onGo(teamCount)}
            >
                Go!
            </Button>
        </div>
    )
}
