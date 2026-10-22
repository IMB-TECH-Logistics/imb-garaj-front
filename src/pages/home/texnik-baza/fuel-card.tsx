import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate } from "../ombor/utils"
import type { FuelConsumption } from "./types"
import { fmtKm } from "./utils"

const num = (value: number | null | undefined, digits = 1) =>
    value === null || value === undefined ? "—" : Number(value).toFixed(digits)

const FuelCard = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const range = useMemo(() => {
        const now = new Date()
        return {
            from: format(subMonths(now, 6), "yyyy-MM-dd"),
            to: format(now, "yyyy-MM-dd"),
        }
    }, [])

    const { data, isError } = useGet<FuelConsumption>(
        `vehicles/${id}/fuel-consumption`,
        {
            params: range,
            options: { retry: false, meta: { skipGlobalError: true } },
        },
    )

    if (isError || !data) return null
    if (!data.trips?.length && !data.months?.length) return null

    return (
        <section className="rounded-lg border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">⛽ {t("tb.fuel")}</h2>
                {data.norm !== null && (
                    <span className="text-sm text-muted-foreground">
                        {t("tb.fuel_norm")}:{" "}
                        <b className="text-foreground">{num(data.norm)}</b>
                    </span>
                )}
            </div>

            {data.months.length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                        {t("tb.fuel_months")}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {data.months.map((m, i) => (
                            <div
                                key={String(m.month ?? i)}
                                className="rounded-md border px-3 py-1.5 text-sm"
                            >
                                <div className="text-xs text-muted-foreground">
                                    {String(m.month ?? "")}
                                </div>
                                <div className="font-medium tabular-nums">
                                    {num(m.per_100km)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.trips.length > 0 && (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("tb.fuel_trip")}</TableHead>
                                <TableHead>{t("tb.fuel_km")}</TableHead>
                                <TableHead>{t("tb.fuel_liters")}</TableHead>
                                <TableHead>{t("tb.fuel_per100")}</TableHead>
                                <TableHead>{t("tb.fuel_diff")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.trips.map((trip) => (
                                <TableRow key={trip.trip_id}>
                                    <TableCell className="whitespace-nowrap">
                                        {fmtDate(trip.start)}
                                        {trip.end ? ` – ${fmtDate(trip.end)}` : ""}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                        {fmtKm(trip.km)}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                        {num(trip.liters)}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                        {num(trip.per_100km)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "tabular-nums font-medium",
                                            trip.diff_pct === null ? ""
                                            : trip.diff_pct > 0 ? "text-red-500"
                                            : "text-emerald-500",
                                        )}
                                    >
                                        {trip.diff_pct === null ?
                                            "—"
                                        :   `${trip.diff_pct > 0 ? "+" : ""}${num(trip.diff_pct)}%`}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </section>
    )
}

export default FuelCard
