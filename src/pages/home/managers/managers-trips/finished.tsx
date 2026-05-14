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
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { IS_READY } from "@/store/ready-mode"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { AlertTriangle, X } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type TripOrder = {
    id: number
    salary_given: boolean
}

export default function FinishManagerTrips() {
    const { id } = useParams({ strict: false })
    const navigate = useNavigate()
    const { closeModal } = useModal(`${MANAGERS_TRIPS}-finished`)
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const item = getData("finished") as ManagerTrips | undefined

    const form = useForm<ManagerTrips>({
        defaultValues: {
            ...item,
            vehicle: id,
            end: new Date().toISOString().split("T")[0],
        },
    })

    const { handleSubmit, reset, control, watch, setValue } = form

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
            enabled: !!driverId && !!tripId,
        },
    )

    const unpaidOrders = useMemo(
        () => (tripOrders ?? []).filter((o) => !o.salary_given),
        [tripOrders],
    )
    const totalOrders = tripOrders?.length ?? 0
    const paidOrders = totalOrders - unpaidOrders.length
    const canFinish = !ordersLoading && unpaidOrders.length === 0

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
                ? "Muvaffaqiyatli tahrirlandi!"
                : "Muvaffaqiyatli qo’shildi!",
        )
        closeModal()
        reset()
    }

    const headers = { "Content-Type": "multipart/form-data" }

    const { mutate: editTrip, isPending: isEditing } = usePatch(
        { onSuccess },
        { headers },
    )

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
            {!ordersLoading && totalOrders > 0 && (
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {!IS_READY && (
                    <FormDatePicker
                        control={control}
                        required
                        name="end"
                        label="Tugatish sanasi"
                    />
                )}
                <FormNumberInput
                    name="end_mileage"
                    required
                    label="Tugash probegi"
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
                        isPaste={false}
                        hideClearable={true}
                    />
                ) : null}

                <FormNumberInput
                    name="end_fuel"
                    label="Yoqilg‘i"
                    required
                    control={control}
                />

                <div className="flex justify-end">
                    <Button loading={isEditing} disabled={!canFinish}>
                        Saqlash
                    </Button>
                </div>
            </form>
        </div>
    )
}
