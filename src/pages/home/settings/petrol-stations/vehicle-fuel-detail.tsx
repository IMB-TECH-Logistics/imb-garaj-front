import ParamDateRange from "@/components/as-params/date-picker-range"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatQuantity } from "./cashflow-cols"
import type { FuelType } from "./cols"
import { FuelBadge, unitOf, VEHICLE_FUEL } from "./vehicle-fuel"

type VehicleFuelDetail = {
    vehicle_plate: string
    stations: {
        petrol_station: number
        petrol_station_name: string
        fuel_type: FuelType | null
        fills: number
        quantity: string
        amount: string
    }[]
    fills: {
        id: number
        created: string
        petrol_station_name: string
        fuel_type: FuelType | null
        driver_name: string | null
        quantity: string | null
        amount: string
        price: string | null
        comment: string | null
        executor_name: string | null
    }[]
}

const VehicleFuelDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { plate } = useParams({ strict: false }) as { plate: string }
    const search = useSearch({ strict: false }) as Record<string, any>

    const { data, isLoading } = useGet<VehicleFuelDetail>(`${VEHICLE_FUEL}/detail`, {
        params: { plate, from_date: search.from_date, to_date: search.to_date },
        enabled: !!plate,
    })

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                            navigate({
                                to: "/petrol-stations",
                                search: {
                                    fuel: "vehicles",
                                    from_date: search.from_date,
                                    to_date: search.to_date,
                                },
                            } as never)
                        }
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <h1 className="text-xl font-semibold leading-tight">{plate}</h1>
                </div>
                <div className="w-64 shrink-0 ml-auto">
                    <ParamDateRange from="from_date" to="to_date" />
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <h3 className="mb-2 text-sm font-semibold">{t("nav.petrol")}</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("settings.petrol.station")}</TableHead>
                                <TableHead>{t("form.fuel_type")}</TableHead>
                                <TableHead className="text-right">{t("settings.petrol.fills")}</TableHead>
                                <TableHead className="text-right">{t("form.quantity")}</TableHead>
                                <TableHead className="text-right">{t("form.amount")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data?.stations ?? []).map((s) => (
                                <TableRow
                                    key={s.petrol_station}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate({
                                            to: "/petrol-stations/$id",
                                            params: { id: String(s.petrol_station) },
                                        })
                                    }
                                >
                                    <TableCell className="font-medium">{s.petrol_station_name}</TableCell>
                                    <TableCell>
                                        <FuelBadge fuel={s.fuel_type} />
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{s.fills}</TableCell>
                                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                                        {formatQuantity(Number(s.quantity), unitOf(s.fuel_type))}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                                        {formatMoney(Number(s.amount))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <h3 className="mb-2 text-sm font-semibold">{t("settings.petrol.all_fills")}</h3>
                    {isLoading ?
                        <p className="py-8 text-center text-sm text-muted-foreground">…</p>
                    :   <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("table.time_col")}</TableHead>
                                    <TableHead>{t("settings.petrol.station")}</TableHead>
                                    <TableHead>{t("form.driver")}</TableHead>
                                    <TableHead className="text-right">{t("form.quantity")}</TableHead>
                                    <TableHead className="text-right">{t("table.price_col")}</TableHead>
                                    <TableHead className="text-right">{t("form.amount")}</TableHead>
                                    <TableHead>{t("form.comment")}</TableHead>
                                    <TableHead>{t("table.executor")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(data?.fills ?? []).map((f) => (
                                    <TableRow key={f.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(f.created), "dd/MM/yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell>{f.petrol_station_name}</TableCell>
                                        <TableCell>{f.driver_name || "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                                            {f.quantity ?
                                                formatQuantity(Number(f.quantity), unitOf(f.fuel_type))
                                            :   "—"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                                            {f.price ? formatMoney(Math.round(Number(f.price))) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">
                                            {formatMoney(Number(f.amount))}
                                        </TableCell>
                                        <TableCell className="max-w-56 truncate" title={f.comment || undefined}>
                                            {f.comment || "—"}
                                        </TableCell>
                                        <TableCell>{f.executor_name || "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    }
                </CardContent>
            </Card>
        </div>
    )
}

export default VehicleFuelDetailPage
