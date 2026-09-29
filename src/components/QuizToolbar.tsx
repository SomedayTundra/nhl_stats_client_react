'use client'

import {useEffect, useRef} from 'react'
import {Dice5Icon} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from '@/components/ui/combobox'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {isTeamCountFraction, teamCountForFraction, teamCountFractions, type TeamCountFraction} from '@/lib/quizTeamCount.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

function randomOf<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several choices (mirrors EraSelect)
const WHEEL_STEP_COOLDOWN_MS = 120

type QuizToolbarProps = {
    showTeamNames: boolean
    onShowTeamNamesChange: (showTeamNames: boolean) => void
    // hands the freshly-rolled team-count fraction up to the parent, which owns the era +
    // launches the round once that era's teams have loaded
    onRandomizeAndGo: (fraction: TeamCountFraction) => void
    onGo: (teamCount: number) => void
    totalTeams: number
}

export default function QuizToolbar({showTeamNames, onShowTeamNamesChange, onRandomizeAndGo, onGo, totalTeams}: QuizToolbarProps) {
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

    // roll the team-count fraction here (this component owns it), then let the parent roll the
    // era + show-names and kick off the round
    const handleRandomizeAndGo = () => {
        const fraction = randomOf(teamCountFractions)
        setTeamCountFraction(fraction)
        onRandomizeAndGo(fraction)
    }

    // mousewheel steps through the four fractions while the dropdown is closed and the pointer is
    // over the control - wheel down = fewer teams, wheel up = more. Native, non-passive listener
    // (React's synthetic onWheel is passive, so it can't preventDefault the page scroll); attached
    // once since setTeamCountFraction is stable and the step uses the functional updater form.
    const wheelWrapperRef = useRef<HTMLDivElement | null>(null)
    const comboboxOpenRef = useRef(false)
    const lastWheelStepAtRef = useRef(0)

    useEffect(() => {
        const wrapper = wheelWrapperRef.current
        if (wrapper === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            if (comboboxOpenRef.current || Math.abs(event.deltaY) < 1) {
                return
            }
            event.preventDefault()

            if (event.timeStamp - lastWheelStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }
            lastWheelStepAtRef.current = event.timeStamp

            const step = event.deltaY > 0 ? 1 : -1
            setTeamCountFraction((current) => {
                const currentIndex = teamCountFractions.indexOf(current)
                const nextIndex = Math.min(Math.max(currentIndex + step, 0), teamCountFractions.length - 1)
                return teamCountFractions[nextIndex]
            })
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [setTeamCountFraction])

    return (
        <div className="flex flex-row items-center gap-4">
            <div className="flex flex-row items-center gap-2 shrink-0">
                <FieldLabel htmlFor="quiz-team-count" className="whitespace-nowrap">Number of teams:</FieldLabel>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div ref={wheelWrapperRef} className="flex">
                            <Combobox<TeamCountFraction>
                                // remount when totalTeams changes - the combobox only recomputes its displayed
                                // input text from itemToStringLabel when the selected value itself changes, so
                                // without this key the input would keep showing the previous season's number
                                key={totalTeams}
                                items={teamCountFractions}
                                value={teamCountFraction}
                                onValueChange={handleTeamCountFractionChange}
                                onOpenChange={(open) => {comboboxOpenRef.current = open}}
                                itemToStringLabel={(fraction) => String(teamCountForFraction(fraction, totalTeams))}
                            >
                                <ComboboxInput id="quiz-team-count" className="w-20 border-neutral-800 bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50"/>
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
                    </TooltipTrigger>
                    <TooltipContent side="top">100%, 75%, 50%, or 25%</TooltipContent>
                </Tooltip>
            </div>
            <div className="flex flex-row items-center gap-2 shrink-0">
                <Checkbox id="quiz-show-team-names" checked={showTeamNames} onCheckedChange={(checked) => onShowTeamNamesChange(checked === true)}/>
                <FieldLabel htmlFor="quiz-show-team-names" className="whitespace-nowrap">Show Team Names</FieldLabel>
            </div>
            <div className="ml-auto flex flex-row items-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            className="rounded-r-none border-neutral-500/50"
                            onClick={handleRandomizeAndGo}
                            aria-label="Randomize and Go!"
                        >
                            <Dice5Icon/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Randomize and Go!</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className="rounded-l-none bg-(--navbar-fg) text-white hover:text-(--navbar-fg) hover:bg-(--navbar-bg)"
                            onClick={() => onGo(teamCount)}
                        >
                            Go!
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Start the quiz!</TooltipContent>
                </Tooltip>
            </div>
        </div>
    )
}
