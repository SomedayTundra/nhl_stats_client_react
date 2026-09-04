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

// yyyy-MM-dd -> a local-midnight Date built from the parts, so there's no UTC-parsing day shift
// (matches how formatDateForApi and date-fns `format` read a Date back out, in local time)
export function parseApiDate(apiDate: string): Date {
    const [year, month, day] = apiDate.split("-").map(Number)
    return new Date(year, month - 1, day)
}

export function serializeDate(date: Date): string {
    return date.toISOString()
}

export function deserializeDate(raw: string): Date {
    return new Date(raw)
}
