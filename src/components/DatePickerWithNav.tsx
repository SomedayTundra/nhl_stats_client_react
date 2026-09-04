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

import { use, useState } from 'react';
import {DateContext} from "@/state/DateContext.tsx";

type DatePickerWithNavProps = {
    id: string
    tooltip: string
    label?: string
    // when set, days outside [minDate, maxDate] are disabled in the calendar and the -/+ nav
    // buttons clamp to (and disable at) these bounds
    minDate?: Date
    maxDate?: Date
}

export default function DatePickerWithNav({id, tooltip, label, minDate, maxDate}: DatePickerWithNavProps) {
    const dateFormat = "MM-dd-yyyy";

    const dc = use(DateContext);
    const [open, setOpen] = useState(false);

    // compare at day granularity via yyyy-MM-dd strings, so a Date's time-of-day / timezone can't
    // push an in-bounds day out (or vice versa)
    const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
    const minKey = minDate ? dayKey(minDate) : undefined;
    const maxKey = maxDate ? dayKey(maxDate) : undefined;
    const currentKey = dayKey(dc.date);

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
        dc.setDate(selected ?? new Date());
        setOpen(false);
    };

    function goToFirstDay() {
        if (minDate) dc.setDate(minDate)
    }

    function goToPreviousWeek() {
        dc.setDate(clampToBounds(subDays(dc.date, 7)))
    }

    function goToPreviousDay() {
        dc.setDate(clampToBounds(subDays(dc.date, 1)))
    }

    function goToNextDay() {
        dc.setDate(clampToBounds(addDays(dc.date, 1)))
    }

    function goToNextWeek() {
        dc.setDate(clampToBounds(addDays(dc.date, 7)))
    }

    function goToLastDay() {
        if (maxDate) dc.setDate(maxDate)
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
                            <Button variant="outline" size="icon-xs" className="rounded-r-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToFirstDay} disabled={atOrBeforeMin} aria-label="First day">
                                <ChevronFirstIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>First day</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className={`bg-blue-100 hover:bg-accent hover:text-accent-foreground ${weekBackIsLeftmost ? 'rounded-r-none' : 'rounded-none'}`} onClick={goToPreviousWeek} disabled={atOrBeforeMin} aria-label="Previous week">
                            <ChevronsLeftIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>-1 week</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className="rounded-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToPreviousDay} disabled={atOrBeforeMin} aria-label="Previous day">
                            <ChevronLeftIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>-1 day</TooltipContent>
                </Tooltip>
                <Popover open={open} onOpenChange={setOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    id={id}
                                    className="justify-start border-neutral-800 px-2.5 font-normal"
                                >
                                    <CalendarIcon />
                                    {dc.date ? (
                                        format(dc.date, dateFormat)
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{tooltip}</TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            defaultMonth={dc.date}
                            selected={dc.date}
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
                        <Button variant="outline" size="icon-xs" className="rounded-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToNextDay} disabled={atOrAfterMax} aria-label="Next day">
                            <ChevronRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>+1 day</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon-xs" className={`bg-blue-100 hover:bg-accent hover:text-accent-foreground ${weekForwardIsRightmost ? 'rounded-l-none' : 'rounded-none'}`} onClick={goToNextWeek} disabled={atOrAfterMax} aria-label="Next week">
                            <ChevronsRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>+1 week</TooltipContent>
                </Tooltip>
                {maxDate && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon-xs" className="rounded-l-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToLastDay} disabled={atOrAfterMax} aria-label="Last day">
                                <ChevronLastIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Last day</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </Field>
    )
}
