import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns"
import { twMerge } from "tailwind-merge"
import i18n from "@/i18n/i18n"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDateLabel(dateStr: string): string {
    const [_, month, day] = dateStr.split("-") // "2025-09-22"
    return i18n.t("core.time.day_month", {
        day: parseInt(day),
        month: i18n.t(`core.months.m${parseInt(month)}`),
    })
}

const educationLevel = (n: number) => ({
    get label() {
        return i18n.t(`core.education.e${n}`)
    },
    key: n,
})

export const educationLevels = [1, 2, 3, 4, 5, 6].map(educationLevel)

export function getTimeDifference(time1: string, time2: string): string {
    const [h1, m1, s1] = time1.split(":").map(Number)
    const [h2, m2, s2] = time2.split(":").map(Number)

    const date = new Date()
    const t1 = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        h1,
        m1,
        s1 || 0,
    )
    const t2 = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        h2,
        m2,
        s2 || 0,
    )

    const diffMs = t2.getTime() - t1.getTime()
    const isNegative = diffMs < 0
    const absDiffMs = Math.abs(diffMs)

    const diffHours = Math.floor(absDiffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))
    const diffSeconds = Math.floor((absDiffMs % (1000 * 60)) / 1000)

    const formattedHours = String(diffHours).padStart(2, "0")
    const formattedMinutes = String(diffMinutes).padStart(2, "0")
    const formattedSeconds = String(diffSeconds).padStart(2, "0")

    return !isNegative ?
            `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
        :   "-"
}

export const imagePaths = [
    "/task/fon1.jpg",
    "/task/fon2.jpg",
    "/task/fon3.jpg",
    "/task/fon4.jpg",
    "/task/fon5.jpg",
    "/task/fon6.jpg",
    "/task/fon7.jpg",
    "/task/fon8.jpg",
    "/task/fon9.jpg",
    "/task/fon10.jpg",
    "/task/fon11.jpg",
    "/task/fon12.jpg",
    "/task/fon13.jpg",
    "/task/fon14.jpg",
    "/task/fon15.jpg",
    "/task/fon16.jpg",
    "/task/fon17.jpg",
    "/task/fon18.jpg",
    "/task/fon19.png",
    "/task/fon20.jpg",
    "/task/fon21.jpg",
    "/task/fon22.jpg",
    "/task/fon23.png",
    "/task/fon24.png",
]

export function getRandomImage() {
    return imagePaths[Math.floor(Math.random() * imagePaths.length)]
}

export function formatDateChat(dateString: string): string {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
        return i18n.t("core.time.today")
    } else if (date.toDateString() === yesterday.toDateString()) {
        return i18n.t("core.time.yesterday")
    } else {
        return format(String(date), "dd/MM/yyyy")
    }
}

export const toNum = (v: string | number | null | undefined): number =>
    Number(v ?? 0) || 0
