import type { TFunction } from "i18next"
import type { FuelType } from "./types"

export const EMPTY_VALUE = "—"

const TIME_ZONE = "Asia/Tashkent"

const MINUTES_IN_HOUR = 60
const MINUTES_IN_DAY = 24 * 60

const groupThousands = (integer: string) =>
    integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

export const formatNumber = (value: number | null | undefined, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return EMPTY_VALUE
    }
    const fixed = Math.abs(value).toFixed(digits)
    const [integer, fraction] = fixed.split(".")
    const trimmed = fraction && Number(fraction) !== 0 ? `,${fraction}` : ""
    return `${value < 0 ? "-" : ""}${groupThousands(integer)}${trimmed}`
}

export const formatKm = (t: TFunction, value: number | null | undefined) =>
    value === null || value === undefined ?
        EMPTY_VALUE
    :   `${formatNumber(value)} ${t("route_norms.units.km")}`

export const formatDuration = (
    t: TFunction,
    value: number | null | undefined,
) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return EMPTY_VALUE
    }
    const total = Math.round(value)
    const days = Math.floor(total / MINUTES_IN_DAY)
    const hours = Math.floor((total % MINUTES_IN_DAY) / MINUTES_IN_HOUR)
    const minutes = total % MINUTES_IN_HOUR
    const day = t("route_norms.units.day")
    const hour = t("route_norms.units.hour")
    const minute = t("route_norms.units.minute")

    if (days > 0) {
        return hours > 0 ? `${days} ${day} ${hours} ${hour}` : `${days} ${day}`
    }
    if (hours > 0) {
        return minutes > 0 ?
                `${hours} ${hour} ${minutes} ${minute}`
            :   `${hours} ${hour}`
    }
    return `${minutes} ${minute}`
}

export const formatDurationRange = (
    t: TFunction,
    min: number | null | undefined,
    max: number | null | undefined,
) =>
    min === null || min === undefined || max === null || max === undefined ?
        null
    :   `${formatDuration(t, min)} – ${formatDuration(t, max)}`

export const formatKmRange = (
    min: number | null | undefined,
    max: number | null | undefined,
) =>
    min === null || min === undefined || max === null || max === undefined ?
        null
    :   `${formatNumber(min, 0)} – ${formatNumber(max, 0)}`

export const fuelUnit = (t: TFunction, type: FuelType | null | undefined) =>
    type === "methane" ?
        t("route_norms.units.m3")
    :   t("route_norms.units.liter")

export const fuelLabel = (t: TFunction, type: FuelType) =>
    t(`route_norms.fuel_types.${type}`)

export const formatFuel = (
    t: TFunction,
    type: FuelType | null | undefined,
    value: number | null | undefined,
) =>
    value === null || value === undefined ?
        EMPTY_VALUE
    :   `${formatNumber(value)} ${fuelUnit(t, type)}`

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
})

export const formatDateTime = (value: string | null | undefined) => {
    if (!value) return EMPTY_VALUE
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return EMPTY_VALUE
    const parts = Object.fromEntries(
        dateTimeFormat.formatToParts(date).map((p) => [p.type, p.value]),
    )
    return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`
}

export const formatDate = (value: string | null | undefined) => {
    if (!value) return EMPTY_VALUE
    const [year, month, day] = value.slice(0, 10).split("-")
    return year && month && day ? `${day}.${month}.${year}` : EMPTY_VALUE
}
