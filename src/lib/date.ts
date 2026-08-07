import {format} from "date-fns"

export function formatDateForApi(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

// converts an API date string (yyyy-MM-dd) to display format (MM-dd-yyyy) via plain string
// rearrangement rather than parsing into a Date, so there's no timezone-shift risk
export function formatApiDateForDisplay(apiDate: string): string {
    const [year, month, day] = apiDate.split("-")
    return `${month}-${day}-${year}`
}

export function serializeDate(date: Date): string {
    return date.toISOString()
}

export function deserializeDate(raw: string): Date {
    return new Date(raw)
}
