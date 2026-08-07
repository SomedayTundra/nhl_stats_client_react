"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {format} from "date-fns"
import { CalendarIcon } from "lucide-react"

import { use } from 'react';
import {DateContext} from "@/state/DateContext.tsx";

export default function DatePicker() {
    const dateFormat = "yyyy-MM-dd";

    const dc = use(DateContext);

    return (
        <Field className="w-40" orientation="horizontal">
            <FieldLabel htmlFor="date-picker" className="justify-start">Date:</FieldLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date-picker"
                        className="justify-start px-2.5 font-normal"
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
        </Field>
    )
}
