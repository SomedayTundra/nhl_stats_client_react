import {format} from "date-fns"

/**
 * Whenever our API calls deal with dates, they are of the form yyyy-MM-dd
 */
export function formatDateForApi(date: Date | undefined): string {
    return date ? format(date, "yyyy-MM-dd") : "undefined"
}

/**
 * Converts an API date string (yyyy-MM-dd) to display format (MM-dd-yyyy) via plain string
 * rearrangement rather than parsing into a Date, which would introduce a slight risk
 * of timezone shifting.
 */
export function formatApiDateForDisplay(apiDate: string): string {
    const [year, month, day] = apiDate.split("-")
    return `${month}-${day}-${year}`
}

/**
 * Given a string formatted as one of our API dates (yyyy-MM-dd), return
 * an equivalent Date object.
 */
export function parseApiDateString(apiDate: string): Date {
    const [year, month, day] = apiDate.split("-").map(Number)
    return new Date(year, month - 1, day)
}

/**
 * Basic serialization of a Date, used when we store selected dates to local storage
 * to preserve the state of a page as we navigate away from it and then back again.
 *
 * Not strictly necessary as it just wraps a single call, but it makes the calling
 * code more readable.
 */
export function serializeDate(date: Date): string {
    return date.toISOString()
}

/**
 * Basic deserialization of a Date, used when we store selected dates to local storage
 * to preserve the state of a page as we navigate away from it and then back again.
 *
 * Not strictly necessary as it just wraps a single call, but it makes the calling
 * code more readable.
 */
export function deserializeDate(raw: string): Date {
    return new Date(raw)
}
