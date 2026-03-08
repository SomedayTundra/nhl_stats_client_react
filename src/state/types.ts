import {type DateRange, type OnSelectHandler} from "react-day-picker"


export type DateRangeState = {
    dateRange: DateRange|undefined;
    setDateRange: OnSelectHandler<DateRange | undefined>;
}