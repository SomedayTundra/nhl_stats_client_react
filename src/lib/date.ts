import {format} from "date-fns"

export function formatDateForApi(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

export function serializeDate(date: Date): string {
    return date.toISOString()
}

export function deserializeDate(raw: string): Date {
    return new Date(raw)
}
