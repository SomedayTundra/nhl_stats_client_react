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
import {DateRangeContext} from "@/state/DateRangeContext.tsx";

export default function DatePickerWithRange() {
    const dateFormat = "yyyy-MM-dd";

    const drc = use(DateRangeContext);

    // FIXME: customize the way clicks are handled here!
    //        to wit, double-click to reset the `from` date is not intuitive at all
    //
    // const handleDayClick = (day: Date) => {
    //     setDate((prev) => {
    //         if (prev?.to) {
    //             // If 'to' is already set, reset the range
    //             return {from: day, to: undefined};
    //         } else if (prev?.from) {
    //             // If 'from' is set and 'to' is not
    //             if (day < prev.from) {
    //                 // If the new day is before the 'from' date, reset the range
    //                 return {from: day, to: undefined};
    //             } else {
    //                 // Otherwise, set the 'to' date
    //                 return {from: prev.from, to: day};
    //             }
    //         } else {
    //             // If neither 'from' nor 'to' is set, set 'from'
    //             return {from: day, to: undefined};
    //         }
    //     });
    // }

    return (
        <Field className="w-80" orientation="horizontal">
            <FieldLabel htmlFor="date-picker-range" className="justify-start">Date Range:</FieldLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date-picker-range"
                        className="justify-start px-2.5 font-normal"
                    >
                        <CalendarIcon />
                        {drc.dateRange?.from ? (
                            drc.dateRange.to ? (
                                <>
                                    {format(drc.dateRange.from, dateFormat)} -{" "}
                                    {format(drc.dateRange.to, dateFormat)}
                                </>
                            ) : (
                                format(drc.dateRange.from, dateFormat)
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={drc.dateRange?.from}
                        selected={drc.dateRange}
                        // onDayClick={handleDayClick}
                        onSelect={drc.setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </Field>
    )
}
