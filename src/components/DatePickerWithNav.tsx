"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {addDays, format, subDays} from "date-fns"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { use } from 'react';
import {DateContext} from "@/state/DateContext.tsx";

export default function DatePickerWithNav() {
    const dateFormat = "yyyy-MM-dd";

    const dc = use(DateContext);

    function goToPreviousDay() {
        dc.setDate(subDays(dc.date, 1))
    }

    function goToNextDay() {
        dc.setDate(addDays(dc.date, 1))
    }

    return (
        <Field className="w-auto flex-row items-center" orientation="horizontal">
            <FieldLabel htmlFor="date-picker" className="justify-start shrink-0">Date:</FieldLabel>
            <div className="flex items-center gap-0">
                <Button variant="outline" size="icon" className="rounded-r-none" onClick={goToPreviousDay} aria-label="Previous day">
                    <ChevronLeftIcon />
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker"
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
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            defaultMonth={dc.date}
                            selected={dc.date}
                            onSelect={dc.setDate}
                            numberOfMonths={1}
                        />
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" className="rounded-l-none" onClick={goToNextDay} aria-label="Next day">
                    <ChevronRightIcon />
                </Button>
            </div>
        </Field>
    )
}
