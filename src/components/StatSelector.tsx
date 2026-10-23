import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx'
import * as React from 'react'
import {useEffect, useRef} from 'react'
import {isStatType, statNames, statToLabel} from '@/lib/stat.ts'

// the longest (string.length) choice in the statNames array
const longestStatLabel = statNames.map(statToLabel).reduce((longestStatLabelSoFar, statLabel) => (statLabel.length > longestStatLabelSoFar.length) ? statLabel : longestStatLabelSoFar)

// the trigger holds a chevron, this pixel value is meant to account for the space the chevron needs
const SELECT_CHEVRON_ALLOWANCE_PX = 24

// only process new mousewheel events every this-many milliseconds
const WHEEL_STEP_COOLDOWN_MS = 120

// to operate we need the current value to try and display, as well as a function to call when our value changes
type StatSelectorProps = {
    value: string,
    onChange: (stat: string) => void
}

export function StatSelector({value, onChange} : StatSelectorProps) {
    // latest-value refs so the mousewheel listener can be bound once, instead of re-subscribed on every
    // step (the selection changes on each wheel tick)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const openRef = useRef(false)
    const valueRef = useRef(value)
    const onChangeRef = useRef(onChange)
    const lastMousewheelTimeRef = useRef(0)

    useEffect(() => {
        valueRef.current = value
        onChangeRef.current = onChange
    })

    useEffect(() => {
        const wrapper = wrapperRef.current
        if(wrapper === null) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            // if the select control is open, or the wheel amount is super-small,
            // we don't want to do anything else
            if(openRef.current || Math.abs(event.deltaY) < 1) {
                return
            }

            // the control isn't open, so prevent the default behavior
            event.preventDefault()

            // if we had another mousewheel "very recently", we'll assume that
            // one took care of any mouse-wheelin' we wanted to do
            if(event.timeStamp - lastMousewheelTimeRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }

            // if our current notion of what the value should be isn't a valid choice, just bail
            const currentStatIndex = (statNames as readonly string[]).indexOf(valueRef.current)
            if(currentStatIndex === -1) {
                return
            }

            // figure out if we're going up or down, make sure there is another choice in that direction,
            // and then call the referenced onChange function with the new value
            const step = event.deltaY > 0 ? 1 : -1
            const nextIndex = Math.min(Math.max(currentStatIndex + step, 0), statNames.length - 1)
            if(nextIndex !== currentStatIndex) {
                lastMousewheelTimeRef.current = event.timeStamp
                onChangeRef.current(statNames[nextIndex])
            }
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [])

    // sizes this stat-type select to exactly fit its longest choice (currently "Goal Diff")
    const statTypeSizerRef = React.useRef<HTMLSpanElement | null>(null)
    const [statTypeInputWidth, setStatTypeInputWidth] = React.useState<number | undefined>(undefined)
    React.useLayoutEffect(() => {
        const statTypesizerSpan = statTypeSizerRef.current
        if (statTypesizerSpan === null) {
            return
        }
        // inline measure() function that measures the width of the invisible statTypeSizerSpan
        const measure = () => setStatTypeInputWidth(statTypesizerSpan.getBoundingClientRect().width)
        measure()

        // any time that the invisible statTypeSizerSpan's size changes, we recompute
        const observer = new ResizeObserver(measure)
        observer.observe(statTypesizerSpan)

        return () => observer.disconnect()
    }, [])

    return (
        <div ref={wrapperRef} className='flex flex-row items-center gap-2 shrink-0'>
            {/* an aria-hidden span holding the longest stat-type choice label, measured to help size the SelectTrigger itself
            such that the Select has enough room on-screen to display the whole text of that longest label */}
            <span
                ref={statTypeSizerRef}
                aria-hidden
                className='pointer-events-none invisible absolute px-4 text-sm whitespace-nowrap'
            >
               {longestStatLabel}
            </span>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div className='flex'>
                        <Select
                            value={isStatType(value) ? value : ''}
                            onValueChange={onChange}
                            onOpenChange={(open) => {
                                openRef.current = open
                            }}
                        >
                            <SelectTrigger id='stat-select' className='w-16'
                                           style={statTypeInputWidth !== undefined ? {width: `${statTypeInputWidth + SELECT_CHEVRON_ALLOWANCE_PX}px`} : undefined}>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent position='popper'>
                                {statNames.map((stat) => (
                                    <SelectItem key={stat} value={stat}>
                                        {statToLabel(stat)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TooltipTrigger>
                <TooltipContent side='top'>Mousewheel to change the displayed stat</TooltipContent>
            </Tooltip>
        </div>
    )
}
