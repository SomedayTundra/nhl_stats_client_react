import {useEffect, useRef, useState} from 'react'
import {ChevronDownIcon} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {FieldLabel} from '@/components/ui/field.tsx'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils.ts'

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several stops
const WHEEL_STEP_COOLDOWN_MS = 120

export type JiraStatusOption = {
    name: string
    // how many issues are in this status
    count: number
}

export type JiraStatusGroup = {
    // e.g. "To Do" (every not-yet-done status) or "Done"
    name: string
    statuses: JiraStatusOption[]
}

type JiraStatusSelectProps = {
    // the groups and their statuses in display order; the mousewheel steps through them in that same order
    groups: JiraStatusGroup[]
    selected: string[]
    onChange: (selected: string[]) => void
}

function groupCheckedState(names: string[], selectedSet: Set<string>): boolean | 'indeterminate' {
    const selectedCount = names.filter(name => selectedSet.has(name)).length
    if (selectedCount === 0) return false
    if (selectedCount === names.length) return true
    return 'indeterminate'
}

function haveSameElements(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false
    const bSet = new Set(b)
    return a.every(value => bSet.has(value))
}

type WheelStop = {
    name: string
    names: string[]
}

// the mousewheel's stops, in order: every status; then each group alone; then each status alone -
// wrapping back to every status after that
function buildWheelStops(groups: JiraStatusGroup[]): WheelStop[] {
    const allNames = groups.flatMap(group => group.statuses.map(status => status.name))
    return [
        {name: 'All Statuses', names: allNames},
        ...groups.map(group => ({name: group.name, names: group.statuses.map(status => status.name)})),
        ...allNames.map(name => ({name, names: [name]})),
    ]
}

// "Status" label + a tree of checkboxes (All Statuses -> group -> status) over the Jira page's status filter, followed
// by the selected statuses spelled out. Controlled: the caller owns the selection and persists it. Like TeamChooser,
// checkbox clicks only edit a draft that's committed when the popover closes.
export function JiraStatusSelect({groups, selected, onChange}: JiraStatusSelectProps) {
    const allNames = groups.flatMap(group => group.statuses.map(status => status.name))
    const wheelStops = buildWheelStops(groups)

    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<string[]>(selected)
    // the draft is seeded on open and only means anything while open; closed, the trigger shows the committed selection
    const draftSelected = open ? draft : selected

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) {
            setDraft(selected)
        } else if (!haveSameElements(draftSelected, selected)) {
            onChange(draftSelected)
        }
        setOpen(nextOpen)
    }

    // latest-value refs so the wheel listener can be bound once instead of re-subscribed on every
    // step (the selection changes on each wheel tick)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const openRef = useRef(open)
    const selectedRef = useRef(selected)
    const onChangeRef = useRef(onChange)
    const wheelStopsRef = useRef(wheelStops)
    const lastStepAtRef = useRef(0)

    useEffect(() => {
        openRef.current = open
        selectedRef.current = selected
        onChangeRef.current = onChange
        wheelStopsRef.current = wheelStops
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

            const stops = wheelStopsRef.current
            const currentIndex = stops.findIndex(stop => haveSameElements(stop.names, selectedRef.current))
            // a custom pick that matches no stop starts the cycle from "All Statuses", either direction
            const nextIndex = currentIndex === -1
                ? 0
                : (currentIndex + (event.deltaY > 0 ? 1 : -1) + stops.length) % stops.length

            lastStepAtRef.current = event.timeStamp
            onChangeRef.current(stops[nextIndex].names)
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [])

    const draftSelectedSet = new Set(draftSelected)

    function toggleGroup(names: string[]) {
        if (names.every(name => draftSelectedSet.has(name))) {
            const toRemove = new Set(names)
            setDraft(draftSelected.filter(name => !toRemove.has(name)))
        } else {
            setDraft([...new Set([...draftSelected, ...names])])
        }
    }

    const total = (statuses: JiraStatusOption[]) => statuses.reduce((sum, status) => sum + status.count, 0)
    const allStatuses = groups.flatMap(group => group.statuses)
    const draftIssueCount = total(allStatuses.filter(status => draftSelectedSet.has(status.name)))

    // the trigger names whichever wheel stop the selection matches; a custom pick is just "Statuses"
    const currentStopName = wheelStops.find(stop => haveSameElements(stop.names, draftSelected))?.name

    // what the trigger could read: each wheel stop with its own count, plus a custom pick at its largest possible count
    const countOf = (names: string[]) => total(allStatuses.filter(status => names.includes(status.name)))
    const triggerLabels = [...new Set([
        ...wheelStops.map(stop => `${stop.name} (${countOf(stop.names)})`),
        `Statuses (${total(allStatuses)})`,
    ])]

    // spelled out in display order, regardless of the order they were picked in
    const selectedSet = new Set(selected)
    const selectedNames = allNames.filter(name => selectedSet.has(name))

    return (
        <div className='flex flex-row items-center gap-2 min-w-0'>
            <FieldLabel htmlFor='jira-status-select'>Status</FieldLabel>
            <div ref={wrapperRef} className='flex shrink-0'>
                <Popover open={open} onOpenChange={handleOpenChange}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button id='jira-status-select' variant='outline' className='justify-between select-none border-neutral-800'>
                                    {/* every label the trigger can show, stacked invisibly in the same grid cell
                                        as the real one, so the button is always as wide as the widest of them and
                                        never shrinks out from under the pointer mid-wheel */}
                                    <span className='grid text-left'>
                                        {triggerLabels.map(label => (
                                            <span key={label} aria-hidden className='invisible col-start-1 row-start-1'>{label}</span>
                                        ))}
                                        <span className={cn('col-start-1 row-start-1', draftSelected.length === 0 && 'text-red-600')}>
                                            {currentStopName ?? 'Statuses'} ({draftIssueCount})
                                        </span>
                                    </span>
                                    <ChevronDownIcon/>
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Mousewheel to quick-select statuses</TooltipContent>
                    </Tooltip>
                    <PopoverContent
                        className='w-64 max-h-(--radix-popover-content-available-height) overflow-y-auto p-2'
                        align='start'
                        collisionPadding={8}
                    >
                        <label className='flex items-center gap-2 py-1 mb-2 pb-2 border-b font-bold cursor-pointer'>
                            <Checkbox
                                checked={groupCheckedState(allNames, draftSelectedSet)}
                                onCheckedChange={() => toggleGroup(allNames)}
                            />
                            All Statuses ({total(allStatuses)})
                        </label>
                        {groups.map(group => {
                            const groupNames = group.statuses.map(status => status.name)
                            return (
                                <div key={group.name} className='mb-2'>
                                    <label className='flex items-center gap-2 py-1 font-semibold cursor-pointer'>
                                        <Checkbox
                                            checked={groupCheckedState(groupNames, draftSelectedSet)}
                                            onCheckedChange={() => toggleGroup(groupNames)}
                                        />
                                        {group.name} ({total(group.statuses)})
                                    </label>
                                    {group.statuses.map(status => (
                                        <label key={status.name} className='flex items-center gap-2 py-1 ml-4 cursor-pointer'>
                                            <Checkbox
                                                checked={draftSelectedSet.has(status.name)}
                                                onCheckedChange={() => toggleGroup([status.name])}
                                            />
                                            {status.name} ({status.count})
                                        </label>
                                    ))}
                                </div>
                            )
                        })}
                    </PopoverContent>
                </Popover>
            </div>
            <span className='text-sm text-muted-foreground truncate'>
                ({selectedNames.length > 0 ? selectedNames.join(', ') : 'none'})
            </span>
        </div>
    )
}
