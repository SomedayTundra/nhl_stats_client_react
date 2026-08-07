import {format} from "date-fns"

export function formatDateForApi(date: Date): string {
    return format(date, "yyyy-MM-dd")
}
