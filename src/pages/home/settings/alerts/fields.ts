import type { AlertSettingsValues } from "@/components/alerts/types"

export type AlertFieldName = keyof AlertSettingsValues

export type AlertField = {
    name: AlertFieldName
    unit: "km" | "minutes" | "hours" | "months" | "days"
    decimalScale: number
}

export const ALERT_FIELDS: AlertField[] = [
    { name: "unassigned_km", unit: "km", decimalScale: 2 },
    { name: "unassigned_minutes", unit: "minutes", decimalScale: 0 },
    { name: "long_drive_hours", unit: "hours", decimalScale: 1 },
    { name: "rest_minutes", unit: "minutes", decimalScale: 0 },
    { name: "oil_km", unit: "km", decimalScale: 0 },
    { name: "oil_months", unit: "months", decimalScale: 0 },
    { name: "tire_km", unit: "km", decimalScale: 0 },
    { name: "warn_km", unit: "km", decimalScale: 0 },
    { name: "warn_days", unit: "days", decimalScale: 0 },
]
