import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FileUpload from "@/components/form/file-upload"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    MANAGERS_TRIPS,
    MANAGERS_ORDERS,
    PETROL_STATIONS_OTHER_VEHICLES,
    SETTINGS_PETROL_STATIONS,
    VEHICLES,
} from "@/constants/api-endpoints"
import { cn } from "@/lib/utils"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useDelete } from "@/hooks/useDelete"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type VehicleOption = {
    id: number
    truck_number: string
    fuel: "methane" | "diesel" | string
}

// Garaj yuritmaydigan firma mashinasi: faqat raqami saqlanadi.
type OtherVehicleOption = {
    id: number
    number: string
    fuel: "methane" | "diesel" | string
}

type TripOption = {
    id: number
    start?: string | null
    driver_name?: string | null
}

type OrderOption = {
    id: number
    loading_name?: string | null
    unloading_name?: string | null
}

// Har bir mashinaning yagona `fuel` turi bor — shu qiymatga qarab o'lchov birligi
// aniqlanadi, hech qachon hardcoded "litr" ishlatilmaydi.
const UNIT_LABEL: Record<string, string> = { methane: "m³", diesel: "litr" }

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS" },
    { id: 2, name: "USD" },
]

type FormValues = {
    vehicle: number | ""
    other_vehicle: number | ""
    amount: string | number | ""
    quantity: string | number | ""
    currency: 1 | 2
    currency_course: string | number | ""
    comment: string
    trip: number | ""
    order: number | ""
    receipt: File | null
    paid_at: string | null
}

const LAST_KEY = (id: number) => `petrol-last-expense-${id}`

const AddExpenseModal = ({ stationId }: { stationId: number }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("petrol-expense")
    const { getData, setData } = useGlobalStore()

    const last = getData<{ vehicle: number | ""; other_vehicle: number | ""; isOther: boolean }>(LAST_KEY(stationId))

    const form = useForm<FormValues>({
        defaultValues: {
            vehicle: last?.vehicle ?? "",
            other_vehicle: last?.other_vehicle ?? "",
            amount: "",
            quantity: "",
            currency: 1,
            currency_course: "",
            comment: "",
            trip: "",
            order: "",
            receipt: null,
            paid_at: null,
        },
    })
    const { control, handleSubmit, watch, reset, setValue } = form
    const currency = watch("currency")
    const vehicleId = watch("vehicle")
    const tripId = watch("trip")

    const { data: vehiclesData } = useGet<ListResponse<VehicleOption>>(
        VEHICLES,
        { params: { page_size: 1000 } },
    )
    const { data: otherVehicles, refetch: refetchOtherVehicles } =
        useGet<OtherVehicleOption[]>(PETROL_STATIONS_OTHER_VEHICLES)

    const [isOther, setIsOther] = useState(last?.isOther ?? false)
    const [isAdding, setIsAdding] = useState(false)
    const [newNumber, setNewNumber] = useState("")
    const [newComment, setNewComment] = useState("")
    const [newFuel, setNewFuel] = useState<"methane" | "diesel">("methane")
    const [addError, setAddError] = useState("")
    // Set while an existing car is being corrected; the same panel serves
    // both jobs so a wrong fuel type is fixed where it was chosen.
    const [editingId, setEditingId] = useState<number | null>(null)
    const vehicleOptions = (vehiclesData?.results ?? []).map((v) => ({
        id: v.id,
        name: `${v.truck_number} (${UNIT_LABEL[v.fuel] ?? "litr"})`,
    }))
    const selectedVehicle = vehiclesData?.results?.find(
        (v) => v.id === vehicleId,
    )
    const otherVehicleId = watch("other_vehicle")
    const selectedOtherVehicle = otherVehicles?.find(
        (v) => v.id === otherVehicleId,
    )
    // Methane is sold by the cubic metre and diesel by the litre; the label
    // follows whichever vehicle is actually selected.
    const unitLabel =
        UNIT_LABEL[
            (isOther ? selectedOtherVehicle?.fuel : selectedVehicle?.fuel) ?? ""
        ] ?? "litr"

    const { data: tripsData } = useGet<ListResponse<TripOption>>(
        MANAGERS_TRIPS,
        {
            params: { vehicle: vehicleId, page_size: 1000 },
            enabled: !!vehicleId && !isOther,
        },
    )
    const tripOptions = (tripsData?.results ?? []).map((t) => ({
        id: t.id,
        name: `${t.start ? t.start.slice(0, 10) : "??"} — ${t.driver_name ?? "Haydovchi yo'q"}`,
    }))

    const { data: ordersData } = useGet<ListResponse<OrderOption>>(
        MANAGERS_ORDERS,
        {
            params: { trip: tripId, page_size: 1000 },
            enabled: !!tripId && !isOther,
        },
    )
    const orderOptions = (ordersData?.results ?? []).map((o) => ({
        id: o.id,
        name: `${o.loading_name ?? "?"} → ${o.unloading_name ?? "?"}`,
    }))

    useEffect(() => {
        setValue("trip", "")
        setValue("order", "")
    }, [vehicleId, setValue])

    useEffect(() => {
        setValue("order", "")
    }, [tripId, setValue])

    const closeVehiclePanel = (row: any) => {
        setIsAdding(false)
        setEditingId(null)
        setNewNumber("")
        setNewComment("")
        setNewFuel("methane")
        setAddError("")
        refetchOtherVehicles().then(() => setValue("other_vehicle", row.id))
    }

    const { mutate: deleteOtherVehicle, isPending: isDeleting } = useDelete({
        onSuccess: () => {
            toast.success(t("toast.truck_deleted"))
            setIsAdding(false)
            setEditingId(null)
            setAddError("")
            refetchOtherVehicles().then(() => setValue("other_vehicle", ""))
        },
        onError: (error: any) => {
            setAddError(
                error?.response?.data?.detail || t("messages.error"),
            )
        },
    })

    const { mutate: updateOtherVehicle, isPending: isUpdating } = usePatch({
        onSuccess: (row: any) => {
            toast.success(t("toast.truck_updated"))
            closeVehiclePanel(row)
        },
        onError: (error: any) => {
            const data = error?.response?.data
            setAddError(data?.number?.[0] || data?.fuel?.[0] || t("messages.error"))
        },
    })

    const { mutate: createOtherVehicle, isPending: isCreating } = usePost({
        onSuccess: (row: any) => {
            toast.success(t("toast.truck_added"))
            closeVehiclePanel(row)
        },
        onError: (error: any) => {
            setAddError(error?.response?.data?.number?.[0] || t("messages.error"))
        },
    })

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("toast.expense_added"))
            const current = form.getValues()
            setData(LAST_KEY(stationId), {
                vehicle: current.vehicle,
                other_vehicle: current.other_vehicle,
                isOther,
            })
            reset({
                vehicle: current.vehicle,
                other_vehicle: current.other_vehicle,
                amount: "",
                quantity: "",
                currency: 1,
                currency_course: "",
                comment: "",
                trip: "",
                order: "",
                receipt: null,
                paid_at: null,
            })
            queryClient.refetchQueries({
                predicate: (q) =>
                    String(q.queryKey[0]).includes("petrol-stations"),
            })
            closeModal()
        },
    })

    const onSubmit = (values: FormValues) => {
        const fields: Record<string, any> = {
            ...(isOther
                ? { other_vehicle: values.other_vehicle }
                : { vehicle: values.vehicle }),
            amount: Number(values.amount),
            quantity: Number(values.quantity),
            currency: values.currency,
            currency_course:
                values.currency === 2 && values.currency_course !== ""
                    ? Number(values.currency_course)
                    : null,
            comment: values.comment || null,
            trip: isOther ? null : values.trip || null,
            order: isOther ? null : values.order || null,
            paid_at: values.paid_at ? new Date(values.paid_at).toISOString() : null,
        }

        if (values.receipt instanceof File) {
            const formData = new FormData()
            Object.entries(fields).forEach(([key, value]) => {
                if (value === null || value === undefined) return
                formData.append(key, String(value))
            })
            formData.append("receipt", values.receipt)
            mutate(`${SETTINGS_PETROL_STATIONS}/${stationId}/expense`, formData)
        } else {
            mutate(`${SETTINGS_PETROL_STATIONS}/${stationId}/expense`, fields)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 max-h-[75vh] overflow-y-auto pr-1 no-scrollbar-x">
            <div className="flex flex-col gap-1.5">
                <span className="font-medium text-sm">{t("form.vehicle_type")}</span>
                <div className="flex gap-2">
                    {[
                        { value: false, label: "Garaj furasi" },
                        { value: true, label: "Boshqa mashina" },
                    ].map((choice) => (
                        <button
                            key={String(choice.value)}
                            type="button"
                            onClick={() => {
                                setIsOther(choice.value)
                                setValue("vehicle", "")
                                setValue("other_vehicle", "")
                                setValue("trip", "")
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                                isOther === choice.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {choice.label}
                        </button>
                    ))}
                </div>
            </div>

            {isOther ?
                <div className="flex flex-col gap-2">
                    <FormCombobox
                        required
                        control={control}
                        label={t("form.truck_number")}
                        name="other_vehicle"
                        options={(otherVehicles ?? []).map((v) => ({
                            ...v,
                            label: `${v.number} (${UNIT_LABEL[v.fuel] ?? "litr"})`,
                        }))}
                        valueKey="id"
                        labelKey="label"
                        placeholder={t("form.truck_number")}
                    />
                    {isAdding ?
                        <div className="flex flex-col gap-2 rounded-md border p-3">
                            <Input
                                fullWidth
                                autoFocus
                                placeholder="01 777 AAA"
                                value={newNumber}
                                onChange={(event) => {
                                    setNewNumber(event.target.value)
                                    setAddError("")
                                }}
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">
                                    {t("form.fuel_type")}
                                </span>
                                <div className="flex gap-2">
                                    {[
                                        { value: "methane", label: "Metan (m³)" },
                                        { value: "diesel", label: "Dizel (litr)" },
                                    ].map((choice) => (
                                        <button
                                            key={choice.value}
                                            type="button"
                                            onClick={() =>
                                                setNewFuel(
                                                    choice.value as
                                                        | "methane"
                                                        | "diesel",
                                                )
                                            }
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                                                newFuel === choice.value
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background text-muted-foreground hover:text-foreground",
                                            )}
                                        >
                                            {choice.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Input
                                fullWidth
                                placeholder="Izoh (ixtiyoriy)"
                                value={newComment}
                                onChange={(event) =>
                                    setNewComment(event.target.value)
                                }
                            />
                            {!!addError && (
                                <span className="text-destructive text-xs">
                                    {addError}
                                </span>
                            )}
                            <div className="flex gap-2 justify-end">
                                {!!editingId && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        loading={isDeleting}
                                        className="text-destructive mr-auto"
                                        onClick={() =>
                                            deleteOtherVehicle(
                                                `${PETROL_STATIONS_OTHER_VEHICLES}/${editingId}`,
                                            )
                                        }
                                    >
                                        {t("actions.delete")}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsAdding(false)
                                        setEditingId(null)
                                        setAddError("")
                                    }}
                                >
                                    {t("actions.cancel")}
                                </Button>
                                <Button
                                    type="button"
                                    loading={isCreating || isUpdating}
                                    disabled={!newNumber.trim()}
                                    onClick={() => {
                                        const payload = {
                                            number: newNumber.trim(),
                                            fuel: newFuel,
                                            ...(newComment.trim()
                                                ? { comment: newComment.trim() }
                                                : {}),
                                        } as any
                                        if (editingId) {
                                            updateOtherVehicle(
                                                `${PETROL_STATIONS_OTHER_VEHICLES}/${editingId}`,
                                                payload,
                                            )
                                        } else {
                                            createOtherVehicle(
                                                PETROL_STATIONS_OTHER_VEHICLES,
                                                payload,
                                            )
                                        }
                                    }}
                                >
                                    {editingId ? t("actions.save") : t("actions.add")}
                                </Button>
                            </div>
                        </div>
                    :   <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null)
                                    setNewNumber("")
                                    setNewComment("")
                                    setNewFuel("methane")
                                    setAddError("")
                                    setIsAdding(true)
                                }}
                                className="text-sm text-primary w-max hover:underline"
                            >
                                + Yangi mashina qo'shish
                            </button>
                            {!!selectedOtherVehicle && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(selectedOtherVehicle.id)
                                        setNewNumber(selectedOtherVehicle.number)
                                        setNewFuel(
                                            selectedOtherVehicle.fuel === "diesel"
                                                ? "diesel"
                                                : "methane",
                                        )
                                        setNewComment("")
                                        setAddError("")
                                        setIsAdding(true)
                                    }}
                                    className="text-sm text-muted-foreground w-max hover:underline"
                                >
                                    {t("actions.edit")}
                                </button>
                            )}
                        </div>
                    }
                </div>
            :   <>
                    <FormCombobox
                        required
                        control={control}
                        label={t("form.truck")}
                        name="vehicle"
                        options={vehicleOptions}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.truck")}
                    />
                    <FormCombobox
                        control={control}
                        label={t("form.trip_optional")}
                        name="trip"
                        options={tripOptions}
                        valueKey="id"
                        labelKey="name"
                        placeholder={
                            vehicleId ?
                                t("form.select_trip")
                            :   t("form.select_vehicle_first")
                        }
                    />
                    {!!tripId && !isOther && (
                        <FormCombobox
                            control={control}
                            label={t("form.order_optional")}
                            name="order"
                            options={orderOptions}
                            valueKey="id"
                            labelKey="name"
                            placeholder={
                                orderOptions.length === 0
                                    ? t("form.no_trips_in_turnover")
                                    : t("form.select_order")
                            }
                        />
                    )}
                </>
            }
            <FormNumberInput
                required
                control={control}
                label={`${t("form.quantity")} (${unitLabel})`}
                name="quantity"
                placeholder="Ex: 120.5"
                thousandSeparator=" "
                decimalScale={2}
            />
            <FormCombobox
                control={control}
                label={t("form.currency")}
                name="currency"
                options={CURRENCY_OPTIONS}
                valueKey="id"
                labelKey="name"
            />
            <FormNumberInput
                required
                control={control}
                label={t("form.amount")}
                name="amount"
                placeholder="Ex: 1 000 000"
                thousandSeparator=" "
                decimalScale={currency === 2 ? 2 : 0}
            />
            {currency === 2 && (
                <FormNumberInput
                    required
                    control={control}
                    label={t("form.currency_rate")}
                    name="currency_course"
                    placeholder="Ex: 12 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}
            <FormDatePicker
                control={control}
                label={t("form.date_optional")}
                name="paid_at"
                placeholder={t("form.select_date")}
                className="w-full"
            />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <FileUpload
                control={control}
                name="receipt"
                multiple={false}
                isPaste={true}
                hideClearable={true}
                label={t("form.receipt_optional")}
            />
            <div className="flex justify-end mt-1">
                <Button className="min-w-32" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddExpenseModal
