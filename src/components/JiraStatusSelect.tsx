import {useEffect, useRef} from 'react'

import {FieldLabel} from '@/components/ui/field.tsx'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several statuses
const WHEEL_STEP_COOLDOWN_MS = 120

export type JiraStatusOption = {
    value: string
    label: string
}

type JiraStatusSelectProps = {
    // the options in display order; the mousewheel steps through them in that same order
    options: JiraStatusOption[]
    value: string
    onChange: (value: string) => void
}

// "Status" label + a select over the Jira page's status filter. Controlled: the caller owns the value and persists it.
export function JiraStatusSelect({options, value, onChange}: JiraStatusSelectProps) {
    // latest-value refs so the wheel listener can be bound once instead of re-subscribed on every
    // step (the selection changes on each wheel tick)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const openRef = useRef(false)
    const optionsRef = useRef(options)
    const valueRef = useRef(value)
    const onChangeRef = useRef(onChange)
    const lastStepAtRef = useRef(0)

    useEffect(() => {
        optionsRef.current = options
        valueRef.current = value
        onChangeRef.current = onChange
    })

    useEffect(() => {
        const wrapper = wrapperRef.current
        if (wrapper === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            // an open dropdown scrolls its own list; a tiny delta is trackpad noise
            if (openRef.current || Math.abs(event.deltaY) < 1) {
                return
            }

            // the control isn't open, so keep the page from scrolling underneath it
            event.preventDefault()

            if (event.timeStamp - lastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }

            const values = optionsRef.current.map(option => option.value)
            const currentIndex = values.indexOf(valueRef.current)
            if (currentIndex === -1) {
                return
            }

            const step = event.deltaY > 0 ? 1 : -1
            const nextIndex = Math.min(Math.max(currentIndex + step, 0), values.length - 1)
            if (nextIndex !== currentIndex) {
                lastStepAtRef.current = event.timeStamp
                onChangeRef.current(values[nextIndex])
            }
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [])

    return (
        <div ref={wrapperRef} className='flex flex-row items-center gap-2 shrink-0'>
            <FieldLabel htmlFor='jira-status-select'>Status</FieldLabel>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className='flex'>
                        <Select
                            value={value}
                            onValueChange={onChange}
                            onOpenChange={(open) => {
                                openRef.current = open
                            }}
                        >
                            <SelectTrigger id='jira-status-select' className='w-48'>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent position='popper'>
                                {options.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TooltipTrigger>
                <TooltipContent side='top'>Mousewheel to change the status</TooltipContent>
            </Tooltip>
        </div>
    )
}
