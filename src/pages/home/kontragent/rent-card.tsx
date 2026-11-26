import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHasAction } from "@/constants/useUser"
import { useDelete } from "@/hooks/useDelete"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { Info, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Kontragent, kontragentUrl, num, onApiError } from "./api"

export const VEHICLE_RENTS = "kontragent/vehicle-rents"
const RENT_ADD = "vehicle-rent-add"
const RENT_DELETE = "vehicle-rent-delete"
const RENT_PRICE = "vehicle-rent-price"

type VehicleRent = {
    id: number
    vehicle: number
    plate: string
    part: "head" | "trailer"
    kontragent: number
    kontragent_name: string
    monthly_usd: string
    vat_percent: string
    since: string | null
    price_usd: string
    price_rate: string | null
    periods?: RentPeriod[]
}

type RentPeriod = {
    id: number
    since: string
    monthly_usd: string
    vat_percent: string
}

type VehicleOption = { id: number; truck_number: string }

const usd = (v: string | number) =>
    `$${Math.round(num(v)).toLocaleString("ru-RU").replace(/ /g, " ")}`

const refreshKontragent = (qc: ReturnType<typeof useQueryClient>) =>
    qc.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("kontragent"),
    })

const AddRentForm = ({ kontragentId }: { kontragentId: number }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { closeModal } = useModal(RENT_ADD)
    const { data: vehiclesData, isLoading } = useGet<
        { results: VehicleOption[] } | VehicleOption[]
    >("vehicles", { params: { page_size: 1000 } })
    const vehicles = useMemo(
        () =>
            Array.isArray(vehiclesData) ? vehiclesData : (
                (vehiclesData?.results ?? [])
            ),
        [vehiclesData],
    )
    const form = useForm<{
        vehicle: number | ""
        part: "head" | "trailer"
        monthly_usd: number | ""
        vat_percent: number | ""
        since: string
        price_usd: number | ""
        price_rate: number | ""
    }>({
        defaultValues: {
            vehicle: "",
            part: "head",
            monthly_usd: "",
            vat_percent: 12,
            since: "",
            price_usd: "",
            price_rate: "",
        },
    })
    const { mutate: add, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_add"))
            form.reset()
            closeModal()
            refreshKontragent(qc)
        },
        onError: onApiError(t("messages.error")),
    })
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) =>
                add(VEHICLE_RENTS, {
                    vehicle: Number(v.vehicle),
                    part: v.part,
                    kontragent: kontragentId,
                    monthly_usd: num(v.monthly_usd),
                    vat_percent: num(v.vat_percent),
                    since: v.since ? `${v.since}-01` : null,
                    price_usd: num(v.price_usd),
                    price_rate: v.price_rate === "" ? null : num(v.price_rate),
                }),
            )}
        >
            <FormCombobox
                required
                control={form.control}
                name="vehicle"
                label={t("fin_report.vehicle")}
                options={vehicles.map((v) => ({
                    id: v.id,
                    name: v.truck_number,
                }))}
                isLoading={isLoading}
                valueKey="id"
                labelKey="name"
            />
            <FormCombobox
                required
                isSearch={false}
                isClearIcon={false}
                control={form.control}
                name="part"
                label={t("fin_report.rent_card.part")}
                options={[
                    { id: "head", name: t("fin_report.part.head") },
                    { id: "trailer", name: t("fin_report.part.trailer") },
                ]}
                valueKey="id"
                labelKey="name"
            />
            <FormNumberInput
                required
                control={form.control}
                name="monthly_usd"
                label={t("fin_report.rent_card.monthly_usd")}
                thousandSeparator=" "
                decimalScale={0}
                allowNegative={false}
                registerOptions={{
                    validate: (v: unknown) =>
                        Number(v) > 0 || t("investors.errors.gt_zero"),
                }}
            />
            <div className="flex flex-col gap-3">
                <FormNumberInput
                    control={form.control}
                    name="vat_percent"
                    label={t("fin_report.rent_card.vat_percent")}
                    decimalScale={2}
                    allowNegative={false}
                />
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    {t("fin_report.rent_card.since")}
                    <Input type="month" {...form.register("since")} />
                </label>
            </div>
            <PriceFields control={form.control} />
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    className="min-w-28"
                    onClick={closeModal}
                >
                    {t("actions.cancel")}
                </Button>
                <Button type="submit" className="min-w-32" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

// Egasi bu qismni necha pulga olgan: balansda «egasining mulki» bo'lib ko'rinadi
const PriceFields = ({ control }: { control: any }) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col gap-3">
            <FormNumberInput
                control={control}
                name="price_usd"
                label={t("fin_report.rent_card.price_usd")}
                thousandSeparator=" "
                decimalScale={0}
                allowNegative={false}
            />
            <FormNumberInput
                control={control}
                name="price_rate"
                label={t("fin_report.rent_card.price_rate")}
                thousandSeparator=" "
                decimalScale={2}
                allowNegative={false}
            />
        </div>
    )
}

const monthLabel = (d: string) => d.slice(0, 7).split("-").reverse().join(".")

const prevMonth = (d: string) => {
    const [y, m] = d.slice(0, 7).split("-").map(Number)
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`
}

const InfoHint = ({ text }: { text: string }) => (
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    tabIndex={-1}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Info className="w-3.5 h-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                align="start"
                className="max-w-72 font-normal"
            >
                {text}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
)

type HistoryRow = {
    key: string
    periodId?: number
    since: string | null
    monthly_usd: string
    vat_percent: string
}

// Ijara tarixi: asosiy summa + «shu oydan» o'zgarishlar, har biri keyingisigacha amal qiladi
const rentHistory = (rent: VehicleRent): HistoryRow[] => [
    {
        key: "base",
        since: rent.since,
        monthly_usd: rent.monthly_usd,
        vat_percent: rent.vat_percent,
    },
    ...[...(rent.periods ?? [])]
        .sort((a, b) => a.since.localeCompare(b.since))
        .map((p) => ({
            key: `p${p.id}`,
            periodId: p.id,
            since: p.since,
            monthly_usd: p.monthly_usd,
            vat_percent: p.vat_percent,
        })),
]

const RentEditForm = ({
    rent,
    onDone,
}: {
    rent: VehicleRent | null
    onDone: () => void
}) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { closeModal } = useModal(RENT_PRICE)
    const history = useMemo(() => (rent ? rentHistory(rent) : []), [rent])
    const current = history[history.length - 1]
    const form = useForm<{
        price_usd: number | ""
        price_rate: number | ""
        monthly_usd: number | ""
        vat_percent: number | ""
        since: string
    }>({
        defaultValues: {
            price_usd: "",
            price_rate: "",
            monthly_usd: "",
            vat_percent: 12,
            since: "",
        },
    })
    useEffect(() => {
        if (!rent || !current) return
        form.reset({
            price_usd: num(rent.price_usd) ? num(rent.price_usd) : "",
            price_rate: rent.price_rate ? num(rent.price_rate) : "",
            monthly_usd: num(current.monthly_usd),
            vat_percent: num(current.vat_percent),
            since: current.since ? current.since.slice(0, 7) : "",
        })
    }, [rent?.id, rent?.periods?.length])
    const done = () => {
        toast.success(t("messages.success_edit"))
        refreshKontragent(qc)
    }
    const { mutateAsync: patchAsync, isPending: patching } = usePatch({
        onError: onApiError(t("messages.error")),
    })
    const { mutateAsync: postAsync, isPending: posting } = usePost({
        onError: onApiError(t("messages.error")),
    })
    const { mutate: removePeriod } = useDelete({
        onSuccess: () => refreshKontragent(qc),
        onError: onApiError(t("messages.error")),
    })
    if (!rent || !current) return null

    const onSubmit = async (v: {
        price_usd: number | ""
        price_rate: number | ""
        monthly_usd: number | ""
        vat_percent: number | ""
        since: string
    }) => {
        try {
            const body: Record<string, unknown> = {
                price_usd: num(v.price_usd),
                price_rate: v.price_rate === "" ? null : num(v.price_rate),
            }
            const changed =
                num(v.monthly_usd) !== num(current.monthly_usd) ||
                num(v.vat_percent) !== num(current.vat_percent)
            const sameMonth =
                (v.since || "") ===
                (current.since ? current.since.slice(0, 7) : "")
            if (changed && (sameMonth || !v.since)) {
                // Shu davrning o'zidagi xatoni tuzatish
                if (current.periodId) {
                    await postAsync(`${VEHICLE_RENTS}/${rent.id}/periods`, {
                        since: `${current.since!.slice(0, 7)}-01`,
                        monthly_usd: num(v.monthly_usd),
                        vat_percent: num(v.vat_percent),
                    })
                } else {
                    body.monthly_usd = num(v.monthly_usd)
                    body.vat_percent = num(v.vat_percent)
                }
            } else if (!sameMonth && v.since) {
                if (!current.periodId && !rent.since && !changed) {
                    body.since = `${v.since}-01`
                } else {
                    // Yangi oydan boshqa summa — eski oylar eski summada qoladi
                    await postAsync(`${VEHICLE_RENTS}/${rent.id}/periods`, {
                        since: `${v.since}-01`,
                        monthly_usd: num(v.monthly_usd),
                        vat_percent: num(v.vat_percent),
                    })
                }
            }
            await patchAsync(`${VEHICLE_RENTS}/${rent.id}`, body)
            done()
            closeModal()
            onDone()
        } catch {
            // xato toast'i onError'da ko'rsatiladi
        }
    }

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit(onSubmit)}
        >
            <div className="flex items-center gap-1.5 text-sm font-medium">
                {t("fin_report.rent_card.price_title")}
                <InfoHint text={t("fin_report.rent_card.price_hint")} />
            </div>
            <PriceFields control={form.control} />

            <div className="flex items-center gap-1.5 text-sm font-medium pt-1">
                {t("fin_report.rent_card.rent_title")}
                <InfoHint text={t("fin_report.rent_card.periods_hint")} />
            </div>
            <div className="flex flex-col gap-3">
                <FormNumberInput
                    required
                    control={form.control}
                    name="monthly_usd"
                    label={t("fin_report.rent_card.monthly_usd")}
                    thousandSeparator=" "
                    decimalScale={0}
                    allowNegative={false}
                    registerOptions={{
                        validate: (v: unknown) =>
                            Number(v) > 0 || t("investors.errors.gt_zero"),
                    }}
                />
                <FormNumberInput
                    control={form.control}
                    name="vat_percent"
                    label={t("fin_report.rent_card.vat_percent")}
                    decimalScale={2}
                    allowNegative={false}
                />
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fin_report.rent_card.since")}
                <Input type="month" {...form.register("since")} />
            </label>

            <div className="flex flex-col gap-1 pt-1">
                <div className="text-sm font-medium">
                    {t("fin_report.rent_card.history_title")}
                </div>
                <div className="flex flex-col divide-y rounded-md border text-sm">
                    {history.map((h, i) => {
                        const next = history[i + 1]
                        const from =
                            h.since ?
                                monthLabel(h.since)
                            :   t("fin_report.rent_card.from_start")
                        const to =
                            next?.since ?
                                monthLabel(`${prevMonth(next.since)}-01`)
                            :   t("fin_report.rent_card.until_now")
                        return (
                            <div
                                key={h.key}
                                className="flex items-center justify-between gap-2 px-2 py-1.5"
                            >
                                <span
                                    className={
                                        next ? "text-muted-foreground" : ""
                                    }
                                >
                                    {from} – {to}
                                </span>
                                <span className="flex items-center gap-1.5 tabular-nums">
                                    {usd(h.monthly_usd)}
                                    {num(h.vat_percent) ?
                                        <span className="text-muted-foreground">
                                            {" "}
                                            + {num(h.vat_percent)}%
                                        </span>
                                    :   null}
                                    {h.periodId ?
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            aria-label={t("actions.delete")}
                                            onClick={() =>
                                                removePeriod(
                                                    `${VEHICLE_RENTS}/${rent.id}/periods/${h.periodId}`,
                                                )
                                            }
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    :   <span className="w-6" />}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    className="min-w-28"
                    onClick={closeModal}
                >
                    {t("actions.cancel")}
                </Button>
                <Button
                    type="submit"
                    className="min-w-32"
                    loading={patching || posting}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export const RentCard = ({ row }: { row: Kontragent }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const canEdit = useHasAction([
        "kontragent_control",
        "investor_control",
        "fin_report_control",
    ])
    const { data: rents = [] } = useGet<VehicleRent[]>(VEHICLE_RENTS, {
        params: { kontragent: row.id },
    })
    const [share, setShare] = useState(String(num(row.dividend_share)))
    useEffect(
        () => setShare(String(num(row.dividend_share))),
        [row.dividend_share],
    )
    const [toDelete, setToDelete] = useState<VehicleRent | null>(null)
    const [priceRent, setPriceRent] = useState<VehicleRent | null>(null)
    const { openModal: openPrice } = useModal(RENT_PRICE)
    const { openModal: openAdd } = useModal(RENT_ADD)
    const { openModal: openDelete } = useModal(RENT_DELETE)

    const { mutate: saveShare, isPending: savingShare } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            refreshKontragent(qc)
        },
        onError: onApiError(t("messages.error")),
    })

    const totalUsd = rents.reduce((a, r) => a + num(r.monthly_usd), 0)
    const partLabel = (p: string) => t(`fin_report.part.${p}`)

    return (
        <Card>
            <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-base font-semibold">
                            {t("fin_report.rent_card.title")}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {t("fin_report.rent_card.hint")}
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {t("fin_report.rent_card.dividend_share")}
                            <Input
                                className="w-24 text-right"
                                type="number"
                                min={0}
                                max={100}
                                value={share}
                                disabled={!canEdit}
                                onChange={(e) => setShare(e.target.value)}
                            />
                        </label>
                        {canEdit && num(share) !== num(row.dividend_share) && (
                            <Button
                                size="sm"
                                loading={savingShare}
                                onClick={() =>
                                    saveShare(kontragentUrl(row.id), {
                                        dividend_share: num(share),
                                    })
                                }
                            >
                                {t("actions.save")}
                            </Button>
                        )}
                        {canEdit && (
                            <Button variant="outline" onClick={openAdd}>
                                <Plus className="w-4 h-4" />
                                {t("fin_report.rent_card.add")}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-md border divide-y">
                    {rents.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            {t("fin_report.rent_card.empty")}
                        </p>
                    )}
                    {rents.map((r) => (
                        <div
                            key={r.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                            <span>
                                <span className="font-medium">{r.plate}</span>
                                <span className="text-muted-foreground">
                                    {" "}
                                    · {partLabel(r.part)}
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="tabular-nums">
                                    {usd(r.monthly_usd)}
                                    {num(r.vat_percent) ?
                                        ` + ${num(r.vat_percent)}% ${t("fin_report.vat")}`
                                    :   ""}{" "}
                                    / {t("fin_report.rent_card.month")}
                                    {r.since && (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            ·{" "}
                                            {t(
                                                "fin_report.rent_card.since_label",
                                                {
                                                    date: r.since
                                                        .slice(0, 7)
                                                        .split("-")
                                                        .reverse()
                                                        .join("."),
                                                },
                                            )}
                                        </span>
                                    )}
                                    {num(r.price_usd) > 0 && (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            ·{" "}
                                            {t(
                                                "fin_report.rent_card.price_label",
                                                { price: usd(r.price_usd) },
                                            )}
                                        </span>
                                    )}
                                </span>
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        aria-label={t("actions.edit")}
                                        title={t("actions.edit")}
                                        onClick={() => {
                                            setPriceRent(r)
                                            openPrice()
                                        }}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        aria-label={t("actions.delete")}
                                        onClick={() => {
                                            setToDelete(r)
                                            openDelete()
                                        }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </span>
                        </div>
                    ))}
                    {rents.length > 0 && (
                        <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm font-semibold bg-muted/30">
                            <span>{t("fin_report.rent_card.total")}</span>
                            <span className="tabular-nums">
                                {usd(totalUsd)} /{" "}
                                {t("fin_report.rent_card.month")}
                            </span>
                        </div>
                    )}
                </div>

                <Modal
                    title={t("fin_report.rent_card.add_title", {
                        name: row.name,
                    })}
                    modalKey={RENT_ADD}
                    size="max-w-sm"
                >
                    <AddRentForm kontragentId={row.id} />
                </Modal>
                <Modal
                    title={
                        priceRent ?
                            `${priceRent.plate} · ${partLabel(priceRent.part)}`
                        :   ""
                    }
                    modalKey={RENT_PRICE}
                    size="max-w-sm"
                >
                    <RentEditForm
                        rent={priceRent}
                        onDone={() => setPriceRent(null)}
                    />
                </Modal>
                <DeleteModal
                    path={VEHICLE_RENTS}
                    id={toDelete?.id}
                    name={
                        toDelete ?
                            `${toDelete.plate} · ${partLabel(toDelete.part)} · ${usd(toDelete.monthly_usd)}`
                        :   ""
                    }
                    modalKey={RENT_DELETE}
                    disableRefetch
                    onSuccessAction={() => refreshKontragent(qc)}
                />
            </CardContent>
        </Card>
    )
}
