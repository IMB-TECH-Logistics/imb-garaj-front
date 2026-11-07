import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Select from "@/components/ui/select"
import { useHasAction } from "@/constants/useUser"
import { useDelete } from "@/hooks/useDelete"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Kontragent, kontragentUrl, num, onApiError } from "./api"

export const VEHICLE_RENTS = "kontragent/vehicle-rents"

type VehicleRent = {
    id: number
    vehicle: number
    plate: string
    part: "head" | "trailer"
    kontragent: number
    kontragent_name: string
    monthly_usd: string
}

type VehicleOption = { id: number; truck_number: string }

const usd = (v: string | number) =>
    `$${Math.round(num(v)).toLocaleString("ru-RU").replace(/ /g, " ")}`

export const RentCard = ({ row }: { row: Kontragent }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const canEdit = useHasAction("investor_control")
    const { data: rents = [] } = useGet<VehicleRent[]>(VEHICLE_RENTS, {
        params: { kontragent: row.id },
    })
    const { data: vehiclesData } = useGet<
        { results: VehicleOption[] } | VehicleOption[]
    >("vehicles", { params: { page_size: 1000 }, enabled: canEdit })
    const vehicles = useMemo(
        () =>
            Array.isArray(vehiclesData) ? vehiclesData : (
                (vehiclesData?.results ?? [])
            ),
        [vehiclesData],
    )
    const [share, setShare] = useState(String(num(row.dividend_share)))
    useEffect(
        () => setShare(String(num(row.dividend_share))),
        [row.dividend_share],
    )
    const [vehicle, setVehicle] = useState("")
    const [part, setPart] = useState<"head" | "trailer">("head")
    const [amount, setAmount] = useState("")

    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith("kontragent"),
        })
    const { mutate: saveShare, isPending: savingShare } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })
    const { mutate: add, isPending: adding } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_add"))
            setVehicle("")
            setAmount("")
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })
    const { mutate: remove } = useDelete({
        onSuccess: refresh,
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
                                    {usd(r.monthly_usd)} /{" "}
                                    {t("fin_report.rent_card.month")}
                                </span>
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        aria-label={t("actions.delete")}
                                        onClick={() =>
                                            remove(`${VEHICLE_RENTS}/${r.id}`)
                                        }
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

                {canEdit && (
                    <div className="flex flex-wrap items-end gap-2">
                        <Select
                            className="w-44"
                            label={t("fin_report.vehicle")}
                            value={vehicle}
                            setValue={setVehicle}
                            options={vehicles.map((v) => ({
                                value: String(v.id),
                                label: v.truck_number,
                            }))}
                        />
                        <Select
                            className="w-36"
                            label={t("fin_report.rent_card.part")}
                            value={part}
                            setValue={(v) => setPart(v as "head" | "trailer")}
                            options={[
                                { value: "head", label: partLabel("head") },
                                {
                                    value: "trailer",
                                    label: partLabel("trailer"),
                                },
                            ]}
                        />
                        <Input
                            className="w-32 text-right"
                            type="number"
                            min={0}
                            placeholder="$ / oy"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <Button
                            disabled={!vehicle || !amount}
                            loading={adding}
                            onClick={() =>
                                add(VEHICLE_RENTS, {
                                    vehicle: Number(vehicle),
                                    part,
                                    kontragent: row.id,
                                    monthly_usd: num(amount),
                                })
                            }
                        >
                            <Plus className="w-4 h-4" />
                            {t("fin_report.rent_card.add")}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
