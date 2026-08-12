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
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react"
import type {OnSelectHandler} from "react-day-picker"

import { use, useState } from 'react';
import {DateContext} from "@/state/DateContext.tsx";

type DatePickerWithNavProps = {
    id: string
    tooltip: string
    label?: string
}

export default function DatePickerWithNav({id, tooltip, label}: DatePickerWithNavProps) {
    const dateFormat = "MM-dd-yyyy";

    const dc = use(DateContext);
    const [open, setOpen] = useState(false);

    const handleCalendarSelect: OnSelectHandler<Date | undefined> = (selected) => {
        dc.setDate(selected ?? new Date());
        setOpen(false);
    };

    function goToPreviousWeek() {
        dc.setDate(subDays(dc.date, 7))
    }

    function goToPreviousDay() {
        dc.setDate(subDays(dc.date, 1))
    }

    function goToNextDay() {
        dc.setDate(addDays(dc.date, 1))
    }

    function goToNextWeek() {
        dc.setDate(addDays(dc.date, 7))
    }

    return (
        <Field className="w-auto flex-row items-center" orientation="horizontal">
            {label && (
                <FieldLabel htmlFor={id} className="justify-start shrink-0">{label}:</FieldLabel>
            )}
            <div className="flex items-center gap-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-r-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToPreviousWeek} aria-label="Previous week">
                            <ChevronsLeftIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>-1 week</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToPreviousDay} aria-label="Previous day">
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
                                    className="justify-start rounded-none px-2.5 font-normal"
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
                        />
                    </PopoverContent>
                </Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToNextDay} aria-label="Next day">
                            <ChevronRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>+1 day</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-l-none bg-blue-100 hover:bg-accent hover:text-accent-foreground" onClick={goToNextWeek} aria-label="Next week">
                            <ChevronsRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>+1 week</TooltipContent>
                </Tooltip>
            </div>
        </Field>
    )
}
