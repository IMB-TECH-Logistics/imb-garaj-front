import { useTranslation } from "react-i18next"
import { formatFuel } from "@/pages/home/route-norms/format"

export type TripFuel = {
    fuel_type: "diesel" | "methane" | null
    state: TripFuelState
    used_fuel: number | null
    per_100km: number | null
    orders_km: number
    orders_fuel: number | null
    empty_km: number
    empty_fuel: number | null
}

export default function TripFuelSummary({ fuel }: { fuel: TripFuel }) {
    const { t } = useTranslation()
    const estimated = fuel.state === "pending"
    if (fuel.used_fuel == null || (estimated && !fuel.used_fuel)) {
        return estimated ? (
            <div className="mt-2 text-sm text-muted-foreground">
                {t("trips.fuel.title")}: {t("trips.fuel.pending")}
            </div>
        ) : null
    }
    const value = (v: number | null) => `${estimated && v != null ? "≈ " : ""}${formatFuel(t, fuel.fuel_type, v)}`
    return (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">{t("trips.fuel.title")}</span>
            <span>
                {t("trips.fuel.total")}: <b className="tabular-nums">{value(fuel.used_fuel)}</b>
            </span>
            <span>
                {t("trips.fuel.orders")}: <span className="tabular-nums">{value(fuel.orders_fuel)}</span>
            </span>
            <span>
                {t("trips.fuel.empty")}: <span className="tabular-nums">{value(fuel.empty_fuel)}</span>
            </span>
            {estimated && <span className="text-muted-foreground">{t("trips.fuel.estimated")}</span>}
        </div>
    )
}
