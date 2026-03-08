import * as React from "react";
import DatePickerWithRange from "@/components/DatePickerWithRange.tsx";
import {type DateRange, type OnSelectHandler} from "react-day-picker"
import {format} from "date-fns";
import {DateRangeContext} from "@/state/DateRangeContext.tsx";


export default function DateRangeTest() {
    const [date, setDate] = React.useState<DateRange|undefined>({from: new Date(), to: new Date()})

    const handleDateSelect: OnSelectHandler<DateRange|undefined> = (selected) => { setDate(selected); };

    const dateRangeContextValue = {
        dateRange: date,
        setDateRange: handleDateSelect
    };

    const dateFormat = "yyyy-MM-dd";

    return (
        <DateRangeContext value={dateRangeContextValue}>
            <div>
                <DatePickerWithRange/>
                {date?.from ? (
                    date.to ? (
                        <>
                            From:{" "}
                            {format(date.from, dateFormat)} ||{" "}
                            To:{" "}
                            {format(date.to, dateFormat)}
                        </>
                    ) : (
                        <>
                        From:
                        format(date.from, dateFormat)
                        </>
                    )
                ) : (
                    <span>Pick a date</span>
                )}
            </div>
        </DateRangeContext>
    );
}