import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormImagePicker from "@/components/form/image-picker"
import { Button } from "@/components/ui/button"
import { VEHICLES, SETTINGS_VEHICLE_TYPE, SETTINGS_DRIVERS, SETTINGS_SELECTABLE_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { showSettingsApiError } from "../settings-api-errors"

/** Plausible production-year range for a truck on the road today. */
const MIN_YEAR = 1950
const MAX_YEAR = new Date().getFullYear() + 1

const IMAGE_FIELDS = [
    "truck_front",
    "truck_back",
    "license_front",
    "license_back",
    "trailer_front",
    "trailer_back",
] as const

const FUEL_OPTIONS = [
    { value: "methane", label: "Metan" },
    { value: "diesel", label: "Dizel" },
]

const STATUS_OPTIONS = [
    { value: 1, label: "Yukli" },
    { value: 2, label: "Yuksiz" },
    { value: 3, label: "Ta'mirda" },
]

/**
 * FormInput and FormCombobox cannot render their own validation text here:
 * FormInput throws on `hideError={false}` when the field is clean, and
 * FormCombobox reads a stale `control._formState` outside its Controller. So a
 * missing required field showed nothing but a red border. Render the message
 * from this form, which subscribes to `formState.errors`.
 */
const FieldMessage = ({ message }: { message?: unknown }) =>
    message ? (
        <span className="mt-1 block text-xs text-destructive">
            {String(message)}
        </span>
    ) : null

const AddVehicleSettingsModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData(VEHICLES) as any

    const { data: vehicleTypes } = useGet(SETTINGS_VEHICLE_TYPE, {
        params: { page_size: 10000 },
    })
    const { data: drivers } = useGet(SETTINGS_DRIVERS, {
        params: { page_size: 10000 },
    })
    const { data: owners } = useGet(SETTINGS_SELECTABLE_USERS)

    const form = useForm({
        defaultValues: current || { fuel: "methane" },
    })

    const {
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors },
    } = form
    const fuel = watch("fuel")
    const consumptionLabel =
        fuel === "diesel" ? "Sarfi (litr/100km)" : "Sarfi (m³/100km)"

    const onSuccess = () => {
        toast.success(
            `Avtomobil muvaffaqiyatli ${current?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(VEHICLES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [VEHICLES] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({ onSuccess })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({ onSuccess })
    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: any) => {
        const formData = new FormData()

        Object.entries(values).forEach(([key, value]) => {
            if (IMAGE_FIELDS.includes(key as (typeof IMAGE_FIELDS)[number])) {
                return
            }
            if (value === undefined || value === null || value === "") {
                return
            }
            if (key === "registered_date") {
                formData.append(key, format(new Date(value as string), "yyyy-MM-dd"))
                return
            }
            formData.append(key, String(value))
        })

        IMAGE_FIELDS.forEach((key) => {
            if (values[key] instanceof File) {
                formData.append(key, values[key])
            }
        })

        if (current?.id) {
            updateMutate(`${VEHICLES}/${current.id}`, formData, {
                onError: showSettingsApiError,
            })
        } else {
            postMutate(VEHICLES, formData, { onError: showSettingsApiError })
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1 max-h-[75vh] overflow-y-auto pr-2">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <div>
                    <FormInput
                        required
                        name="truck_number"
                        label="Avtomobil raqami"
                        methods={form}
                        registerOptions={{
                            required: "Avtomobil raqamini kiriting",
                        }}
                    />
                    <FieldMessage message={errors.truck_number?.message} />
                </div>
                <FormInput
                    name="truck_passport"
                    label="Tex passport"
                    methods={form}
                />
                <FormInput
                    name="trailer_number"
                    label="Tirkama raqami"
                    methods={form}
                />
                <div>
                    <FormCombobox
                        required
                        name="truck_type"
                        label="Avtomobil turi"
                        options={vehicleTypes?.results ?? []}
                        control={control}
                        labelKey="name"
                        valueKey="id"
                    />
                    <FieldMessage message={errors.truck_type?.message} />
                </div>
                <FormCombobox
                    name="trailer_type"
                    label="Tirkama turi"
                    options={vehicleTypes?.results ?? []}
                    control={control}
                    labelKey="name"
                    valueKey="id"
                />
                <FormCombobox
                    name="driver"
                    label="Haydovchi"
                    options={drivers?.results ?? []}
                    control={control}
                    labelKey="first_name"
                    valueKey="id"
                />
                <FormCombobox
                    name="owner"
                    label="Egasi"
                    options={owners ?? []}
                    control={control}
                    labelKey="first_name"
                    valueKey="id"
                />
                <FormCombobox
                    name="fuel"
                    label="Yoqilg'i turi"
                    options={FUEL_OPTIONS}
                    control={control}
                    labelKey="label"
                    valueKey="value"
                />
                <FormCombobox
                    name="status"
                    label="Status"
                    options={STATUS_OPTIONS}
                    control={control}
                    labelKey="label"
                    valueKey="value"
                />
                {/*
                  * A production year is an identifier, not money: the default
                  * space grouping rendered "1800" as "1 800" in the form while
                  * the table showed "1800" (UI audit S1-39). Grouping off, plus
                  * a plausible range so a typo like 1800 or 20255 is caught.
                  */}
                <FormNumberInput
                    name="year"
                    label="Yili"
                    control={control}
                    decimalScale={0}
                    allowNegative={false}
                    thousandSeparator={""}
                    placeholder={`Misol: ${MAX_YEAR - 1}`}
                    registerOptions={{
                        validate: (value: unknown) => {
                            if (value === null || value === undefined || value === "")
                                return true
                            const num = Number(value)
                            if (Number.isNaN(num))
                                return "Yili raqam bo'lishi kerak"
                            if (num < MIN_YEAR || num > MAX_YEAR)
                                return `Yili ${MIN_YEAR}–${MAX_YEAR} oralig'ida bo'lishi kerak`
                            return true
                        },
                    }}
                />
                <FormNumberInput
                    name="consumption"
                    label={consumptionLabel}
                    control={control}
                    decimalScale={0}
                    allowNegative={false}
                    registerOptions={{
                        validate: (value: unknown) => {
                            if (value === null || value === undefined || value === "")
                                return true
                            const num = Number(value)
                            if (Number.isNaN(num))
                                return "Sarfi raqam bo'lishi kerak"
                            if (num < 0)
                                return "Sarfi manfiy bo'lishi mumkin emas"
                            return true
                        },
                    }}
                />
                <FormDatePicker
                    name="registered_date"
                    label="Ro'yxatdan o'tgan sana"
                    control={control}
                    fullWidth
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:col-span-2 pt-4">
                    <FormImagePicker
                        name="truck_front"
                        label="Avtomobil old"
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="truck_back"
                        label="Avtomobil orqa"
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="license_front"
                        label="Tex passport old"
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="license_back"
                        label="Tex passport orqa"
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="trailer_front"
                        label="Tirkama old"
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="trailer_back"
                        label="Tirkama orqa"
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                </div>

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        Saqlash
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddVehicleSettingsModal
