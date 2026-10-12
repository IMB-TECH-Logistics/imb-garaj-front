import i18n from "@/i18n/i18n"

export default function convertTime(givenDateString: string) {
    if (givenDateString) {
        const givenDate: Date = new Date(givenDateString)
        const currentDate: Date = new Date()
        const difference: number = +currentDate - +givenDate

        const hoursDifference = Math.floor(difference / (1000 * 60 * 60))
        const minutesDifference = Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60),
        )

        return i18n.t("core.time.hours_minutes", {
            hours: hoursDifference,
            minutes: minutesDifference,
        })
    } else {
        return ""
    }
}