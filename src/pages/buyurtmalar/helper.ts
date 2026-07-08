export function getTimeDifference(dateString: string): {
    hours: number
    minutes: number
} {
    const givenDate = new Date(dateString)
    const currentDate = new Date()

    const differenceInMilliseconds = currentDate.getTime() - givenDate.getTime()

    const differenceInMinutes = Math.floor(
        differenceInMilliseconds / (1000 * 60),
    )
    const hours = Math.floor(differenceInMinutes / 60)
    const minutes = differenceInMinutes % 60

    return { hours, minutes }
}

interface IDif {
    hours: number
    minutes: number
}

export function getColor(type: "text" | "button", dif: IDif) {
    if (
        dif.hours * 60 + dif.minutes < 120 &&
        dif.hours * 60 + dif.minutes >= 30 &&
        dif.minutes >= 0
    ) {
        return type === "button" ? "!bg-amber-400" : "!text-amber-400"
    } else if (dif.hours * 60 + dif.minutes >= 120) {
        return type === "button"
            ? "!bg-destructive text-white"
            : "!text-destructive"
    } else {
        return type === "button" ? "" : "!text-primary"
    }
}
