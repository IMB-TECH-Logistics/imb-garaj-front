import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/datepicker"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import Select from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { TECH_BASE } from "@/constants/api-endpoints"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { todayIso } from "@/lib/today-iso"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Settings2, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { fmtDate } from "../ombor/utils"
import type { Axle, Tire } from "./types"
import InstallDialog from "./install-dialog"
import { STATUS_WHEEL, fmtKm, positionsOf } from "./utils"

type Props = {
    id: number
    axles: Axle[]
    tires: Tire[]
    canControl: boolean
}

const useInvalidate = () => {
    const queryClient = useQueryClient()
    return () =>
        queryClient.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith(TECH_BASE),
        })
}

export const usePositionLabel = (axles: Axle[]) => {
    const { t } = useTranslation()
    return (code: string) => {
        const match = /^(\d+)([LR])([OI])$/.exec(code)
        if (!match) return code
        const axle = Number(match[1])
        const side = match[2] === "L" ? t("tb.left") : t("tb.right")
        const dual = axles[axle - 1]?.dual
        const layer =
            dual ?
                `, ${match[3] === "O" ? t("tb.outer") : t("tb.inner")}`
            :   ""
        return `${t("tb.axle", { n: axle })}, ${side}${layer}`
    }
}

type WheelProps = {
    tire?: Tire
    code: string
    label: (code: string) => string
    canControl: boolean
    allTires: Tire[]
    positions: string[]
    onMove: (tire: Tire, position: string, date: string) => void
    moving: boolean
    onInstall: (position: string, old?: Tire) => void
}

const Wheel = ({
    tire,
    code,
    label,
    canControl,
    allTires,
    positions,
    onMove,
    moving,
    onInstall,
}: WheelProps) => {
    const { t } = useTranslation()
    const [target, setTarget] = useState("")
    const [date, setDate] = useState(todayIso())

    const wheel = (
        <button
            type="button"
            disabled={!tire && !canControl}
            title={label(code)}
            className={cn(
                "flex h-14 w-9 sm:w-11 items-center justify-center rounded-md border-2 text-[10px] sm:text-xs font-semibold tabular-nums transition-transform",
                tire ?
                    STATUS_WHEEL[tire.status] + " hover:scale-105"
                :   STATUS_WHEEL.none + " opacity-60",
            )}
        >
            {tire && tire.pct !== null ? `${Math.round(tire.pct)}%` : ""}
        </button>
    )

    if (!tire) {
        if (!canControl) return wheel
        return (
            <Popover>
                <PopoverTrigger asChild>{wheel}</PopoverTrigger>
                <PopoverContent className="w-64 text-sm flex flex-col gap-3">
                    <div className="font-semibold">{label(code)}</div>
                    <Button size="sm" onClick={() => onInstall(code)}>
                        {t("tb.install_tire")}
                    </Button>
                </PopoverContent>
            </Popover>
        )
    }

    const options = positions
        .filter((p) => p !== tire.position)
        .map((p) => {
            const other = allTires.find((x) => x.position === p)
            return {
                value: p,
                label:
                    other ?
                        `${label(p)} · ${other.factory_number ?? other.product_name}`
                    :   label(p),
            }
        })

    return (
        <Popover>
            <PopoverTrigger asChild>{wheel}</PopoverTrigger>
            <PopoverContent className="w-72 text-sm flex flex-col gap-3">
                <div className="font-semibold">
                    {tire.position ? label(tire.position) : t("tb.unplaced")}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    <dt className="text-muted-foreground">
                        {t("tb.factory_number")}
                    </dt>
                    <dd className="text-right font-mono">
                        {tire.factory_number ?? "—"}
                    </dd>
                    <dt className="text-muted-foreground">{t("tb.product")}</dt>
                    <dd className="text-right">{tire.product_name}</dd>
                    <dt className="text-muted-foreground">
                        {t("tb.installed_at")}
                    </dt>
                    <dd className="text-right">{fmtDate(tire.installed_at)}</dd>
                    <dt className="text-muted-foreground">{t("tb.km_limit")}</dt>
                    <dd className="text-right tabular-nums">
                        {fmtKm(tire.km)}
                        {tire.km_limit ? ` / ${fmtKm(tire.km_limit)}` : ""}
                    </dd>
                </dl>
                {canControl && tire.position && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInstall(tire.position, tire)}
                    >
                        {t("tb.replace_tire")}
                    </Button>
                )}
                {canControl && (
                    <div className="flex flex-col gap-2 border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                            {t("tb.move_to")}
                        </span>
                        <Select
                            value={target}
                            setValue={setTarget}
                            options={options}
                            label={t("tb.choose_position")}
                        />
                        <DatePicker
                            fullWidth
                            date={date}
                            setDate={setDate}
                            placeholder={t("tb.date")}
                        />
                        <span className="text-xs text-muted-foreground">
                            {t("tb.swap_hint")}
                        </span>
                        <Button
                            size="sm"
                            disabled={!target}
                            loading={moving}
                            onClick={() => onMove(tire, target, date)}
                        >
                            {t("tb.move")}
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

const LayoutDialog = ({
    id,
    axles,
    open,
    onOpenChange,
}: {
    id: number
    axles: Axle[]
    open: boolean
    onOpenChange: (open: boolean) => void
}) => {
    const { t } = useTranslation()
    const invalidate = useInvalidate()
    const [draft, setDraft] = useState<Axle[]>(axles)

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("tb.layout_saved"))
            invalidate()
            onOpenChange(false)
        },
        onError: (e: unknown) => handleFormError(e),
    })

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (next) setDraft(axles)
                onOpenChange(next)
            }}
        >
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("tb.edit_layout")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    {draft.map((axle, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                        >
                            <span className="text-sm font-medium">
                                {t("tb.axle", { n: i + 1 })}
                            </span>
                            <label className="flex items-center gap-2 text-sm">
                                {t("tb.dual")}
                                <Switch
                                    checked={axle.dual}
                                    onCheckedChange={(dual) =>
                                        setDraft(
                                            draft.map((a, j) =>
                                                j === i ? { dual } : a,
                                            ),
                                        )
                                    }
                                />
                            </label>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 !text-red-500"
                                icon={<Trash2 size={16} />}
                                onClick={() =>
                                    setDraft(draft.filter((_, j) => j !== i))
                                }
                            />
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        icon={<Plus size={16} />}
                        onClick={() => setDraft([...draft, { dual: true }])}
                    >
                        {t("tb.add_axle")}
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        loading={isPending}
                        disabled={!draft.length}
                        onClick={() =>
                            mutate(`${TECH_BASE}/${id}`, { axles: draft })
                        }
                    >
                        {t("actions.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const TireSchema = ({ id, axles, tires, canControl }: Props) => {
    const { t } = useTranslation()
    const invalidate = useInvalidate()
    const label = usePositionLabel(axles)
    const [layoutOpen, setLayoutOpen] = useState(false)
    const [installTarget, setInstallTarget] = useState<{
        position: string
        old?: Tire
    } | null>(null)
    const positions = positionsOf(axles)

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("tb.moved_ok"))
            invalidate()
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const move = (tire: Tire, position: string, date: string) => {
        const other = tires.find((x) => x.position === position)
        mutate(`${TECH_BASE}/${id}/tires/move`, {
            lot_id: tire.lot_id,
            position,
            date,
            ...(other ? { swap_with_lot_id: other.lot_id } : {}),
        })
    }

    const byPosition = new Map(tires.map((x) => [x.position, x]))
    const unplaced = tires.filter((x) => !x.position || !positions.includes(x.position))

    const wheelProps = {
        label,
        canControl,
        allTires: tires,
        positions,
        onMove: move,
        moving: isPending,
        onInstall: (position: string, old?: Tire) =>
            setInstallTarget({ position, old }),
    }

    const renderWheel = (code: string) => (
        <Wheel
            key={code}
            code={code}
            tire={byPosition.get(code)}
            {...wheelProps}
        />
    )

    return (
        <section className="rounded-lg border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">🛞 {t("tb.tire_schema")}</h2>
                {canControl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Settings2 size={14} />}
                        onClick={() => setLayoutOpen(true)}
                    >
                        {t("tb.edit_layout")}
                    </Button>
                )}
            </div>

            <div className="mx-auto flex flex-col items-center gap-3 py-2">
                <span className="text-xs text-muted-foreground">
                    ▲ {t("tb.front")}
                </span>
                {axles.map((axle, i) => {
                    const n = i + 1
                    return (
                        <div key={i} className="flex items-center gap-1">
                            <div className="flex gap-1">
                                {renderWheel(`${n}LO`)}
                                {axle.dual && renderWheel(`${n}LI`)}
                            </div>
                            <div className="h-1.5 w-8 sm:w-14 rounded bg-border" />
                            <div className="flex gap-1">
                                {axle.dual && renderWheel(`${n}RI`)}
                                {renderWheel(`${n}RO`)}
                            </div>
                        </div>
                    )
                })}
            </div>

            {unplaced.length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                        {t("tb.unplaced")}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {unplaced.map((tire) => (
                            <Wheel
                                key={tire.lot_id}
                                code=""
                                tire={tire}
                                {...wheelProps}
                            />
                        ))}
                    </div>
                </div>
            )}

            <InstallDialog
                id={id}
                target={installTarget}
                label={label}
                onClose={() => setInstallTarget(null)}
            />

            <LayoutDialog
                id={id}
                axles={axles}
                open={layoutOpen}
                onOpenChange={setLayoutOpen}
            />
        </section>
    )
}

export default TireSchema
