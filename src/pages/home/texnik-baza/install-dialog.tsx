import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/datepicker"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { TECH_BASE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { todayIso } from "@/lib/today-iso"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { Tire } from "./types"
import { fmtKm } from "./utils"

type AvailableTire = {
    lot_id: number
    factory_number: string | null
    product_name: string
    condition: "new" | "used"
    km_total: number
    km_limit: number | null
}

type OldAction = "remove" | "repair" | "write_off"

type Props = {
    id: number
    target: { position: string; old?: Tire } | null
    label: (code: string) => string
    onClose: () => void
}

const InstallDialog = ({ id, target, label, onClose }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [lotId, setLotId] = useState<number | null>(null)
    const [date, setDate] = useState(todayIso())
    const [odometer, setOdometer] = useState("")
    const [oldAction, setOldAction] = useState<OldAction>("remove")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const open = target !== null

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
        return () => clearTimeout(timer)
    }, [searchInput])

    useEffect(() => {
        if (!open) return
        setSearchInput("")
        setSearch("")
        setLotId(null)
        setDate(todayIso())
        setOdometer("")
        setOldAction("remove")
        setErrors({})
    }, [open])

    const { data, isLoading } = useGet<AvailableTire[]>(
        `${TECH_BASE}/${id}/tires/available`,
        { params: { search }, enabled: open },
    )
    const list = Array.isArray(data) ? data : []

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("tb.installed_ok"))
            queryClient.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).startsWith(TECH_BASE),
            })
            onClose()
        },
        onError: (e: unknown) => {
            const body = (e as { response?: { data?: Record<string, unknown> } })
                ?.response?.data
            if (body && typeof body === "object") {
                const next: Record<string, string> = {}
                Object.entries(body).forEach(([k, v]) => {
                    next[k] = Array.isArray(v) ? String(v[0]) : String(v)
                })
                setErrors(next)
            }
            handleFormError(e)
        },
    })

    const submit = () => {
        if (!target || !lotId) return
        setErrors({})
        mutate(`${TECH_BASE}/${id}/tires/install`, {
            lot_id: lotId,
            position: target.position,
            date,
            ...(odometer ? { odometer: Number(odometer) } : {}),
            ...(target.old ? { old_action: oldAction } : {}),
        })
    }

    const oldActions: { value: OldAction; label: string }[] = [
        { value: "remove", label: t("tb.old_remove") },
        { value: "repair", label: t("tb.old_repair") },
        { value: "write_off", label: t("tb.old_write_off") },
    ]

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {target?.old ?
                            t("tb.replace_tire")
                        :   t("tb.install_tire")}
                        {target?.position ? ` · ${label(target.position)}` : ""}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <Input
                        placeholder={t("tb.search_tire")}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <div className="max-h-60 overflow-y-auto rounded-md border divide-y">
                        {isLoading ?
                            <Skeleton className="h-16 w-full" />
                        : !list.length ?
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                {t("tb.no_available")}
                            </p>
                        :   list.map((item) => (
                                <button
                                    key={item.lot_id}
                                    type="button"
                                    onClick={() => setLotId(item.lot_id)}
                                    className={cn(
                                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent",
                                        item.lot_id === lotId && "bg-primary/10",
                                    )}
                                >
                                    <div className="min-w-0">
                                        <div className="font-mono font-medium">
                                            {item.factory_number ?? "—"}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {item.product_name}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <Badge
                                            variant={
                                                item.condition === "new" ?
                                                    "default"
                                                :   "secondary"
                                            }
                                        >
                                            {item.condition === "new" ?
                                                t("tb.condition_new")
                                            :   t("tb.condition_used")}
                                        </Badge>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {fmtKm(item.km_total)}
                                            {item.km_limit ?
                                                ` / ${fmtKm(item.km_limit)}`
                                            :   ""}{" "}
                                            km
                                        </span>
                                    </div>
                                </button>
                            ))
                        }
                    </div>
                    {errors.lot_id && (
                        <span className="text-xs text-destructive">
                            {errors.lot_id}
                        </span>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5 text-sm">
                            {t("tb.date")}
                            <DatePicker
                                fullWidth
                                date={date}
                                setDate={setDate}
                                placeholder={t("tb.date")}
                                calendarProps={{
                                    disabled: { after: new Date() },
                                }}
                            />
                            {errors.date && (
                                <span className="text-xs text-destructive">
                                    {errors.date}
                                </span>
                            )}
                        </div>
                        <label className="flex flex-col gap-1.5 text-sm">
                            {t("tb.odometer_optional")}
                            <Input
                                type="number"
                                min={0}
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                            />
                            {errors.odometer && (
                                <span className="text-xs text-destructive">
                                    {errors.odometer}
                                </span>
                            )}
                        </label>
                    </div>
                    {errors.position && (
                        <span className="text-xs text-destructive">
                            {errors.position}
                        </span>
                    )}

                    {target?.old && (
                        <div className="flex flex-col gap-2 text-sm">
                            <span className="text-muted-foreground">
                                {t("tb.old_tire_action", {
                                    number:
                                        target.old.factory_number ??
                                        target.old.product_name,
                                })}
                            </span>
                            <RadioGroup
                                value={oldAction}
                                onValueChange={(v) =>
                                    setOldAction(v as OldAction)
                                }
                            >
                                {oldActions.map((a) => (
                                    <label
                                        key={a.value}
                                        className="flex items-center gap-2"
                                    >
                                        <RadioGroupItem value={a.value} />
                                        {a.label}
                                    </label>
                                ))}
                            </RadioGroup>
                            {errors.old_action && (
                                <span className="text-xs text-destructive">
                                    {errors.old_action}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        loading={isPending}
                        disabled={!lotId}
                        onClick={submit}
                    >
                        {target?.old ?
                            t("tb.replace_tire")
                        :   t("tb.install_tire")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default InstallDialog
