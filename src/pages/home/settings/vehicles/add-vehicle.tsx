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
import { useTranslation } from "react-i18next"

const MIN_VEHICLE_YEAR = 1950

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
    { value: 1, label: "status.loaded" },
    { value: 2, label: "status.empty" },
    { value: 3, label: "status.repair" },
]

const AddVehicleSettingsModal = () => {
    const { t } = useTranslation()
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

    const { handleSubmit, reset, control, watch } = form
    const fuel = watch("fuel")
    const consumptionLabel =
        fuel === "diesel" ? "Sarfi (litr/100km)" : "Sarfi (m³/100km)"

    const onSuccess = () => {
        toast.success(
            current?.id ? t("toast.truck_updated") : t("toast.truck_added"),
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
            updateMutate(`${VEHICLES}/${current.id}`, formData)
        } else {
            postMutate(VEHICLES, formData)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1 max-h-[75vh] overflow-y-auto pr-2">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="truck_number"
                    label={t("form.vehicle_number")}
                    methods={form}
                />
                <FormInput
                    name="truck_passport"
                    label={t("form.tech_passport")}
                    methods={form}
                />
                <FormNumberInput
                    name="stir"
                    label={t("form.tax_id")}
                    control={control}
                    thousandSeparator=""
                    decimalScale={0}
                    maxLength={14}
                    registerOptions={{
                        validate: (v: string) => {
                            if (!v) return true
                            if (!/^\d+$/.test(v)) return t("validation.numbers_only")
                            if (v.length !== 9 && v.length !== 14) return "9 (STIR) yoki 14 (JSHSHIR) xonali bo'lishi kerak"
                            return true
                        },
                    }}
                />
                <FormInput
                    name="trailer_number"
                    label={t("form.trailer_number")}
                    methods={form}
                />
                <FormCombobox
                    required
                    name="truck_type"
                    label={t("form.vehicle_type")}
                    options={vehicleTypes?.results ?? []}
                    control={control}
                    labelKey="name"
                    valueKey="id"
                />
                <FormCombobox
                    name="trailer_type"
                    label={t("form.trailer_type")}
                    options={vehicleTypes?.results ?? []}
                    control={control}
                    labelKey="name"
                    valueKey="id"
                />
                <FormCombobox
                    name="driver"
                    label={t("form.driver")}
                    options={drivers?.results ?? []}
                    control={control}
                    labelKey="first_name"
                    valueKey="id"
                />
                <FormCombobox
                    name="owner"
                    label={t("form.owner")}
                    options={owners ?? []}
                    control={control}
                    labelKey="first_name"
                    valueKey="id"
                />
                <FormCombobox
                    name="fuel"
                    label={t("form.fuel_type")}
                    options={FUEL_OPTIONS}
                    control={control}
                    labelKey="label"
                    valueKey="value"
                />
                <FormCombobox
                    name="status"
                    label={t("table.status")}
                    options={STATUS_OPTIONS}
                    control={control}
                    labelKey="label"
                    valueKey="value"
                />
                <FormNumberInput
                    name="year"
                    label={t("form.year")}
                    control={control}
                    decimalScale={0}
                    thousandSeparator={""}
                    isAllowed={({ floatValue }) =>
                        floatValue === undefined || floatValue <= 2100
                    }
                    registerOptions={{
                        validate: (v: string | number) => {
                            if (v === "" || v === null || v === undefined) return true
                            const maxYear = new Date().getFullYear() + 1
                            const year = Number(v)
                            return (year >= MIN_VEHICLE_YEAR && year <= maxYear) ||
                                `Ishlab chiqarilgan yil ${MIN_VEHICLE_YEAR} va ${maxYear} orasida bo'lishi kerak.`
                        },
                    }}
                />
                <FormNumberInput
                    name="consumption"
                    label={consumptionLabel}
                    control={control}
                    decimalScale={0}
                    allowNegative={false}
                />
                <FormDatePicker
                    name="registered_date"
                    label={t("form.registration_date")}
                    control={control}
                    fullWidth
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:col-span-2 pt-4">
                    <FormImagePicker
                        name="truck_front"
                        label={t("form.vehicle") + " " + t("actions.save").toLowerCase()}
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="truck_back"
                        label={t("form.vehicle_number") + " (back)"}
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="license_front"
                        label={t("form.tech_passport") + " (front)"}
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="license_back"
                        label={t("form.tech_passport") + " (back)"}
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="trailer_front"
                        label={t("form.trailer_number") + " (front)"}
                        methods={form}
                        className="w-full h-28 object-cover rounded-md border"
                    />
                    <FormImagePicker
                        name="trailer_back"
                        label={t("form.trailer_number") + " (back)"}
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
                        {t("actions.save")}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddVehicleSettingsModal
