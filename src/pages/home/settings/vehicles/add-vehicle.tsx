import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { FormCombobox } from "@/components/form/combobox"
import { Button } from "@/components/ui/button"
import { VEHICLES, SETTINGS_VEHICLE_TYPE, SETTINGS_DRIVERS, SETTINGS_SELECTABLE_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const FUEL_OPTIONS = [
    { value: "methane", label: "Metan" },
    { value: "diesel", label: "Dizel" },
]

const STATUS_OPTIONS = [
    { value: 1, label: "Band" },
    { value: 2, label: "Bo'sh" },
    { value: 3, label: "Ta'mirda" },
]

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
        defaultValues: current || {},
    })

    const { handleSubmit, reset, control } = form

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
        if (current?.id) {
            updateMutate(`${VEHICLES}/${current.id}`, values)
        } else {
            postMutate(VEHICLES, values)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="truck_number"
                    label="Avtomobil raqami"
                    methods={form}
                />
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
                <FormCombobox
                    required
                    name="truck_type"
                    label="Avtomobil turi"
                    options={vehicleTypes?.results ?? []}
                    control={control}
                    labelKey="name"
                    valueKey="id"
                />
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
                <FormNumberInput
                    name="year"
                    label="Yili"
                    control={control}
                    decimalScale={0}
                />
                <FormNumberInput
                    name="consumption"
                    label="Sarfi (litr/100km)"
                    control={control}
                    decimalScale={0}
                />

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
