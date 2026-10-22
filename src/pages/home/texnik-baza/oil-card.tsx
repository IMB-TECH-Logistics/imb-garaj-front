import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TECH_BASE } from "@/constants/api-endpoints"
import { usePatch } from "@/hooks/usePatch"
import { handleFormError } from "@/lib/show-form-errors"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { fmtDate } from "../ombor/utils"
import type { Oil } from "./types"
import { STATUS_BAR, fmtKm } from "./utils"

type Props = {
    id: number
    oil: Oil | null
    canControl: boolean
}

const toNullable = (value: string) => {
    const trimmed = value.trim()
    return trimmed === "" ? null : Number(trimmed)
}

const OilCard = ({ id, oil, canControl }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const fromVehicle = oil?.limit_source === "vehicle"
    const [kmLimit, setKmLimit] = useState("")
    const [monthsLimit, setMonthsLimit] = useState("")

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("tb.limits_saved"))
            queryClient.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).startsWith(TECH_BASE),
            })
            setOpen(false)
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const openDialog = () => {
        setKmLimit(fromVehicle && oil?.km_limit ? String(oil.km_limit) : "")
        setMonthsLimit(
            fromVehicle && oil?.months_limit ? String(oil.months_limit) : "",
        )
        setOpen(true)
    }

    const save = () =>
        mutate(`${TECH_BASE}/${id}`, {
            oil_km_limit: toNullable(kmLimit),
            oil_months_limit: toNullable(monthsLimit),
        })

    const pct = oil?.pct ?? null

    return (
        <section className="rounded-lg border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">🛢 {t("tb.oil")}</h2>
                {canControl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={openDialog}
                    >
                        {t("tb.edit_limits")}
                    </Button>
                )}
            </div>

            {!oil ?
                <p className="text-sm text-muted-foreground">
                    {t("tb.status_none")}
                </p>
            :   <>
                    <div className="flex items-center gap-3">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    STATUS_BAR[oil.status],
                                )}
                                style={{
                                    width: `${Math.min(100, Math.max(0, pct ?? 0))}%`,
                                }}
                            />
                        </div>
                        <span className="w-12 text-right text-sm font-medium tabular-nums">
                            {pct === null ? "—" : `${Math.round(pct)}%`}
                        </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">
                            {t("tb.oil_last")}
                        </dt>
                        <dd className="text-right">{fmtDate(oil.last_date)}</dd>
                        <dt className="text-muted-foreground">
                            {t("tb.oil_km_since")}
                        </dt>
                        <dd className="text-right tabular-nums">
                            {fmtKm(oil.km_since)}
                            {oil.km_limit ? ` / ${fmtKm(oil.km_limit)}` : ""} km
                        </dd>
                        <dt className="text-muted-foreground">
                            {t("tb.oil_months_since")}
                        </dt>
                        <dd className="text-right tabular-nums">
                            {oil.months_since === null ?
                                "—"
                            :   t("tb.oil_months", { n: oil.months_since })}
                            {oil.months_limit ?
                                ` / ${t("tb.oil_months", { n: oil.months_limit })}`
                            :   ""}
                        </dd>
                        <dt className="text-muted-foreground">
                            {t("tb.oil_limit")}
                        </dt>
                        <dd className="text-right">
                            {fromVehicle ?
                                t("tb.source_vehicle")
                            :   t("tb.source_global")}
                        </dd>
                    </dl>
                </>
            }

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t("tb.edit_limits")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-1.5 text-sm">
                            {t("tb.oil_km_limit")}
                            <Input
                                type="number"
                                min={0}
                                value={kmLimit}
                                onChange={(e) => setKmLimit(e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm">
                            {t("tb.oil_months_limit")}
                            <Input
                                type="number"
                                min={0}
                                value={monthsLimit}
                                onChange={(e) => setMonthsLimit(e.target.value)}
                            />
                        </label>
                        <p className="text-xs text-muted-foreground">
                            {t("tb.limits_hint")}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {t("actions.cancel")}
                        </Button>
                        <Button onClick={save} loading={isPending}>
                            {t("actions.save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

export default OilCard
