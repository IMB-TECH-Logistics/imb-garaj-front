import { format } from "date-fns"

export function formatDate(date: string | Date | undefined) {
    return date ? format(new Date(date), "dd/MM/yyyy") : ""
}
export function formatDateTime(date: string | undefined | Date | number) {
    return date ? format(new Date(date), "dd/MM/yyyy HH:mm") : ""
}

export function formatTime(date: string | undefined | Date | number) {
    return date ? format(new Date(date), "HH:mm") : ""
}
