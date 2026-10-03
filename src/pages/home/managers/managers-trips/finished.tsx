import { FormDatePicker } from "@/components/form/date-picker"
import FileUpload from "@/components/form/file-upload"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    DRIVERS_OVERVIEW,
    MANAGERS_TRIPS,
    SETTINGS_DRIVERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { useUser } from "@/constants/useUser"
import KassaCloseSection, { KassaCloseState } from "./kassa-close-section"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { IS_READY } from "@/store/ready-mode"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { startOfDay } from "date-fns"
import { AlertTriangle, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { todayIso } from "@/lib/today-iso"

type TripOrder = {
    id: number
    salary_given: boolean
}

export default function FinishManagerTrips({ tab: tabProp, onTabChange }: { tab?: "info" | "kassa"; onTabChange?: (t: "info" | "kassa") => void } = {}) {
    const { t } = useTranslation()
    const { id } = useParams({ strict: false })
    const navigate = useNavigate()
    const { closeModal } = useModal(`${MANAGERS_TRIPS}-finished`)
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const item = getData("finished") as ManagerTrips | undefined
    const { data: me } = useUser()
    const isKassaV2 = me?.kassa_mode === "driver_cash" && me?.kassa_version === 2
    const [kassa, setKassa] = useState<KassaCloseState | null>(null)
    const [closing, setClosing] = useState(false)
    const [tabState, setTabState] = useState<"info" | "kassa">("info")
    const tab = tabProp ?? tabState
    const setTab = (t: "info" | "kassa") => {
        setTabState(t)
        onTabChange?.(t)
    }
    const fuelKind = String((item as any)?.fuel_type ?? (item as any)?.vehicle_fuel ?? "").toLowerCase()
    const fuelUnit = fuelKind.includes("methane") || fuelKind.includes("metan") ? "m³" : "litr"

    const form = useForm<ManagerTrips>({
        defaultValues: {
            ...item,
            vehicle: id,
            end: todayIso(),
        },
    })

    const { handleSubmit, reset, control, watch, setValue } = form

    const today = startOfDay(new Date())
    const tripStart = item?.start ? startOfDay(new Date(item.start)) : today
    const minEndDate = tripStart > today ? tripStart : today

    const { data: drivers } = useGet(SETTINGS_DRIVERS, {
        params: { page_size: 10000 },
    })
    void drivers

    const driverId = item?.driver
    const tripId = item?.id

    const { data: tripOrders, isLoading: ordersLoading } = useGet<TripOrder[]>(
        driverId && tripId
            ? `${DRIVERS_OVERVIEW}/${driverId}/trips/${tripId}/orders`
            : "",
        {
            enabled: !!driverId && !!tripId && !isKassaV2,
        },
    )

    const unpaidOrders = useMemo(
        () => (tripOrders ?? []).filter((o) => !o.salary_given),
        [tripOrders],
    )
    const totalOrders = tripOrders?.length ?? 0
    const paidOrders = totalOrders - unpaidOrders.length
    const canFinish = isKassaV2 ? !!kassa?.ready : !ordersLoading && unpaidOrders.length === 0

    const startImage = watch("start_mileage_image") as File | string | null
    void startImage
    const endImage = watch("end_mileage_image") as File | string | null

    const startMileage = watch("start_mileage")
    void startMileage
    const endMileage = watch("end_mileage")

    function removeImage(name: "start_mileage_image" | "end_mileage_image") {
        setValue(name, null)
    }

    function onSuccess() {
        queryClient.invalidateQueries({ queryKey: [MANAGERS_TRIPS] })
        toast.success(
            item?.id
                ? t("messages.success_edit")
                : t("messages.success_add"),
        )
        closeModal()
        reset()
    }

    const headers = { "Content-Type": "multipart/form-data" }

    const { mutate: editTrip, isPending: isEditing } = usePatch(
        { onSuccess },
        { headers },
    )
    const { mutateAsync: patchTripAsync } = usePatch({ meta: { skipGlobalError: true } }, { headers })
    const { mutateAsync: postCloseAsync } = usePost({ meta: { skipGlobalError: true } })

    const errorText = (e: any) => {
        const d = e?.response?.data
        if (!d) return "Xatolik yuz berdi"
        if (d.detail) return String(d.detail)
        const first = Object.values(d)[0]
        return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : "Xatolik yuz berdi"
    }

    async function finishWithKassa(formData: FormData, tripId: number) {
        if (!kassa) return
        setClosing(true)
        try {
            await patchTripAsync(`${MANAGERS_TRIPS}/${tripId}`, formData)
            const res: any = await postCloseAsync(`checkout/kassa-v2/trips/${tripId}/close`, {
                amount: kassa.amount,
                salary: kassa.salary,
                salaries: kassa.salaries,
                expenses: kassa.expenses,
            })
            queryClient.invalidateQueries({
                predicate: (q) => {
                    const k = String(q.queryKey[0])
                    return k.startsWith(MANAGERS_TRIPS) || k.includes("cashflow") || k.startsWith("checkout/kassa-v2")
                },
            })
            toast.success(res?.status === "yopildi" ? "Aylanma yopildi" : "Aylanma yopildi, qoldiq so'rovi kassirga yuborildi")
            closeModal()
            reset()
        } catch (e) {
            toast.error(errorText(e))
            queryClient.invalidateQueries({ queryKey: [MANAGERS_TRIPS] })
        } finally {
            setClosing(false)
        }
    }

    function onSubmit(values: ManagerTrips) {
        if (!canFinish) {
            toast.error(
                `${unpaidOrders.length} ta reys uchun oylik berilmagan`,
            )
            return
        }
        const formData = new FormData()
        formData.append("end_mileage", String(values.end_mileage))
        formData.append("end", values.end)
        formData.append("end_fuel", String(values.end_fuel))
        if (values.end_mileage_image instanceof File) {
            formData.append("end_mileage_image", values.end_mileage_image)
        }

        if (isKassaV2) {
            finishWithKassa(formData, Number(values.id))
            return
        }
        editTrip(`${MANAGERS_TRIPS}/${values.id}`, formData)
    }

    function goToSalaryPage() {
        if (!driverId || !tripId) return
        closeModal()
        navigate({
            to: "/haydovchilar/$id/aylanma/$tripId",
            params: { id: String(driverId), tripId: String(tripId) },
            search: { name: item?.driver_name ?? undefined } as any,
        })
    }

    return (
        <div className="max-h-[80vh] overflow-y-auto pr-2 pl-2 no-scrollbar-x">
            {!isKassaV2 && !ordersLoading && totalOrders > 0 && (
                <div
                    className={`mb-4 rounded-md border p-3 flex flex-col gap-2 ${
                        canFinish
                            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"
                            : "border-amber-200 bg-amber-50 dark:bg-amber-950/20"
                    }`}
                >
                    <div className="flex items-start gap-2">
                        <AlertTriangle
                            size={16}
                            className={
                                canFinish ? "text-emerald-600" : "text-amber-600"
                            }
                        />
                        <div className="flex-1 text-sm">
                            <div className="font-medium">
                                Oyliklar holati: {paidOrders}/{totalOrders}{" "}
                                berilgan
                            </div>
                            {!canFinish && (
                                <div className="text-[12px] text-muted-foreground mt-0.5">
                                    {unpaidOrders.length} ta reys uchun oylik
                                    berilmagan. Aylanmani tugatishdan oldin
                                    barchasini bering.
                                </div>
                            )}
                        </div>
                    </div>
                    {!canFinish && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="self-end"
                            onClick={goToSalaryPage}
                        >
                            Oylik berish sahifasiga o’tish
                        </Button>
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit(onSubmit, () => setTab("info"))} className="space-y-3">
                {isKassaV2 && (
                    <Tabs value={tab} onValueChange={(v) => setTab(v as "info" | "kassa")}>
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="info">Aylanma ma'lumotlari</TabsTrigger>
                            <TabsTrigger value="kassa">Kassa hisobi</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
                <div className={isKassaV2 && tab !== "info" ? "hidden" : "space-y-3"}>
                {!IS_READY && (
                    <FormDatePicker
                        control={control}
                        required
                        name="end"
                        label={t("form.end_date")}
                        calendarProps={{ disabled: { before: minEndDate } }}
                    />
                )}
                <FormNumberInput
                    name="end_mileage"
                    required
                    label={t("table.end_mileage")}
                    control={control}
                    registerOptions={{
                        min: {
                            value: item?.start_mileage || 0,
                            message: `Tugash probegi ${item?.start_mileage || 0} dan kam bo’lmasligi kerak`,
                        },
                    }}
                />

                {endImage ? (
                    <div className="relative w-24 h-24">
                        <img
                            src={
                                endImage instanceof File
                                    ? URL.createObjectURL(endImage)
                                    : endImage
                            }
                            className="w-24 h-24 object-cover rounded-md"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage("end_mileage_image")}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            <X width={12} />
                        </button>
                    </div>
                ) : endMileage ? (
                    <FileUpload
                        control={control}
                        name="end_mileage_image"
                        multiple={false}
                        isPaste={true}
                        hideClearable={true}
                    />
                ) : null}

                <FormNumberInput
                    name="end_fuel"
                    label={`Qolgan yoqilg'i (${fuelUnit})`}
                    required
                    decimalScale={2}
                    allowNegative={false}
                    control={control}
                />

                </div>

                {isKassaV2 && (
                    <div className={tab === "kassa" ? "" : "hidden"}>
                        <KassaCloseSection tripId={item?.id} onChange={setKassa} />
                    </div>
                )}

                <div className="flex justify-end">
                    {isKassaV2 && tab === "info" ?
                    <Button
                        type="button"
                        onClick={async () => {
                            if (await form.trigger()) setTab("kassa")
                        }}
                    >
                        Keyingi: Kassa hisobi →
                    </Button>
                    :
                    <Button loading={isEditing || closing} disabled={!canFinish}>
                        {isKassaV2 ? (kassa?.amount ? "Tugatish va so'rov yuborish" : "Tugatish") : t("actions.save")}
                    </Button>}
                </div>
            </form>
        </div>
    )
}
