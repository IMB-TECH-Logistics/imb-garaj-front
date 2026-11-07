import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Select from "@/components/ui/select"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Kontragent, kontragentUrl, num, onApiError } from "./api"

export const VEHICLE_RENTS = "kontragent/vehicle-rents"
const RENT_ADD = "vehicle-rent-add"
const RENT_DELETE = "vehicle-rent-delete"

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

const refreshKontragent = (qc: ReturnType<typeof useQueryClient>) =>
    qc.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("kontragent"),
    })

const AddRentForm = ({ kontragentId }: { kontragentId: number }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { closeModal } = useModal(RENT_ADD)
    const { data: vehiclesData } = useGet<
        { results: VehicleOption[] } | VehicleOption[]
    >("vehicles", { params: { page_size: 1000 } })
    const vehicles = useMemo(
        () =>
            Array.isArray(vehiclesData) ? vehiclesData : (
                (vehiclesData?.results ?? [])
            ),
        [vehiclesData],
    )
    const [vehicle, setVehicle] = useState("")
    const [part, setPart] = useState<"head" | "trailer">("head")
    const [amount, setAmount] = useState("")
    const { mutate: add, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_add"))
            setVehicle("")
            setAmount("")
            closeModal()
            refreshKontragent(qc)
        },
        onError: onApiError(t("messages.error")),
    })
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault()
                if (vehicle && num(amount) > 0)
                    add(VEHICLE_RENTS, {
                        vehicle: Number(vehicle),
                        part,
                        kontragent: kontragentId,
                        monthly_usd: num(amount),
                    })
            }}
        >
            <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fin_report.vehicle")}
                <Select
                    label={t("fin_report.vehicle")}
                    value={vehicle}
                    setValue={setVehicle}
                    options={vehicles.map((v) => ({
                        value: String(v.id),
                        label: v.truck_number,
                    }))}
                />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fin_report.rent_card.part")}
                <Select
                    label={t("fin_report.rent_card.part")}
                    value={part}
                    setValue={(v) => setPart(v as "head" | "trailer")}
                    options={[
                        { value: "head", label: t("fin_report.part.head") },
                        {
                            value: "trailer",
                            label: t("fin_report.part.trailer"),
                        },
                    ]}
                />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fin_report.rent_card.monthly_usd")}
                <Input
                    type="number"
                    min={0}
                    placeholder="2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </label>
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!vehicle || !(num(amount) > 0)}
                    loading={isPending}
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
    const canEdit = useHasAction("investor_control")
    const { data: rents = [] } = useGet<VehicleRent[]>(VEHICLE_RENTS, {
        params: { kontragent: row.id },
    })
    const [share, setShare] = useState(String(num(row.dividend_share)))
    useEffect(
        () => setShare(String(num(row.dividend_share))),
        [row.dividend_share],
    )
    const [toDelete, setToDelete] = useState<VehicleRent | null>(null)
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
                                    {usd(r.monthly_usd)} /{" "}
                                    {t("fin_report.rent_card.month")}
                                </span>
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
