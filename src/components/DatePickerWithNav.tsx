"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {addDays, format, subDays} from "date-fns"
import { CalendarIcon, ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react"
import type {OnSelectHandler} from "react-day-picker"
import {useState} from 'react'

// the step buttons either side of the date. Disabled ones (at the season's first or last day) fade
// further than the Button default's 50%, so they read as unavailable rather than just quieter.
const NAV_BUTTON_CLASS = 'bg-st-accent-soft hover:bg-accent hover:text-accent-foreground disabled:opacity-30'

type DatePickerWithNavProps = {
    id: string
    date: Date
    setDate: (date:Date) => void
    tooltip: string
    label?: string
    // when set, days outside [minDate, maxDate] are disabled in the calendar and the -/+ nav
    // buttons clamp to (and disable at) these bounds
    minDate?: Date
    maxDate?: Date
}

export default function DatePickerWithNav({id, date, setDate, tooltip, label, minDate, maxDate}: DatePickerWithNavProps) {
    const dateFormat = "MM-dd-yyyy";

    const [open, setOpen] = useState(false);

    // compare at day granularity via yyyy-MM-dd strings, so a Date's time-of-day / timezone can't
    // push an in-bounds day out (or vice versa)
    const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
    const minKey = minDate ? dayKey(minDate) : undefined;
    const maxKey = maxDate ? dayKey(maxDate) : undefined;
    const currentKey = dayKey(date);

    const atOrBeforeMin = minKey !== undefined && currentKey <= minKey;
    const atOrAfterMax = maxKey !== undefined && currentKey >= maxKey;

    const clampToBounds = (d: Date): Date => {
        if (minDate && dayKey(d) < dayKey(minDate)) return minDate;
        if (maxDate && dayKey(d) > dayKey(maxDate)) return maxDate;
        return d;
    };

    const disabledDays = [
        ...(minDate ? [{ before: minDate }] : []),
        ...(maxDate ? [{ after: maxDate }] : []),
    ];

    const handleCalendarSelect: OnSelectHandler<Date | undefined> = (selected) => {
        setDate(selected ?? new Date());
        setOpen(false);
    };

    function goToFirstDay() {
        if (minDate) setDate(minDate)
    }

    function goToPreviousWeek() {
        setDate(clampToBounds(subDays(date, 7)))
    }

    function goToPreviousDay() {
        setDate(clampToBounds(subDays(date, 1)))
    }

    function goToNextDay() {
        setDate(clampToBounds(addDays(date, 1)))
    }

    function goToNextWeek() {
        setDate(clampToBounds(addDays(date, 7)))
    }

    function goToLastDay() {
        if (maxDate) setDate(maxDate)
    }

    // the leftmost/rightmost buttons in the group get the outer corner radius; everything between
    // them is square. Which button ends up on each edge shifts depending on whether the
    // first-day/last-day bumper buttons are present (first day is always leftmost when shown,
    // last day is always rightmost when shown).
    const weekBackIsLeftmost = minDate === undefined
    const weekForwardIsRightmost = maxDate === undefined

    return (
        <Field className="w-auto flex-row items-center" orientation="horizontal">
            {label && (
                <FieldLabel htmlFor={id} className="justify-start shrink-0">{label}:</FieldLabel>
            )}
            <div className="flex items-center gap-0">
                {minDate && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon-xs" className={`rounded-r-none ${NAV_BUTTON_CLASS}`} onClick={goToFirstDay} disabled={atOrBeforeMin} aria-label="First day">
                                <ChevronFirstIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">First day</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className={`${NAV_BUTTON_CLASS} ${weekBackIsLeftmost ? 'rounded-r-none' : 'rounded-none'}`} onClick={goToPreviousWeek} disabled={atOrBeforeMin} aria-label="Previous week">
                            <ChevronsLeftIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">-1 week</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className={`rounded-none ${NAV_BUTTON_CLASS}`} onClick={goToPreviousDay} disabled={atOrBeforeMin} aria-label="Previous day">
                            <ChevronLeftIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">-1 day</TooltipContent>
                </Tooltip>
                <Popover open={open} onOpenChange={setOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    id={id}
                                    className="justify-start select-none border-neutral-800 px-2.5 font-normal"
                                >
                                    <CalendarIcon />
                                    {format(date, dateFormat)}
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">{tooltip}</TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            defaultMonth={date}
                            selected={date}
                            onSelect={handleCalendarSelect}
                            numberOfMonths={1}
                            disabled={disabledDays.length ? disabledDays : undefined}
                            startMonth={minDate}
                            endMonth={maxDate}
                        />
                    </PopoverContent>
                </Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className={`rounded-none ${NAV_BUTTON_CLASS}`} onClick={goToNextDay} disabled={atOrAfterMax} aria-label="Next day">
                            <ChevronRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">+1 day</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className={`${NAV_BUTTON_CLASS} ${weekForwardIsRightmost ? 'rounded-l-none' : 'rounded-none'}`} onClick={goToNextWeek} disabled={atOrAfterMax} aria-label="Next week">
                            <ChevronsRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">+1 week</TooltipContent>
                </Tooltip>
                {maxDate && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon-xs" className={`rounded-l-none ${NAV_BUTTON_CLASS}`} onClick={goToLastDay} disabled={atOrAfterMax} aria-label="Last day">
                                <ChevronLastIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Last day</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </Field>
    )
}
