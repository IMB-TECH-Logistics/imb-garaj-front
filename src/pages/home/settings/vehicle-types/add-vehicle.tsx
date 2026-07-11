import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    SETTINGS_SELECTABLE_USERS,
    SETTINGS_VEHICLE_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const vehicleTypeOptions = [
    { value: "truck", label: "Avtomobil" },
    { value: "trailer", label: "Tirkama" },
]

const AddVehicleModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<VehicleRoleType>(SETTINGS_VEHICLE_TYPE)

    const { data: drivers } = useGet(SETTINGS_SELECTABLE_USERS)
    const form = useForm<VehicleRoleType>({
        defaultValues: currentRole,
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Rol muvaffaqiyatli ${currentRole?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(SETTINGS_VEHICLE_TYPE)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_VEHICLE_TYPE] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: VehicleRoleType) => {
        if (currentRole?.id) {
            updateMutate(`${SETTINGS_VEHICLE_TYPE}/${currentRole.id}`, values)
        } else {
            postMutate(SETTINGS_VEHICLE_TYPE, values)
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
                    name="name"
                    label="Avtomobil nomi"
                    methods={form}
                />
                <FormCombobox
                    required
                    name="type"
                    label="Avtomobil turi"
                    options={vehicleTypeOptions}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />
                <FormCombobox
                    required
                    name="owner"
                    label="Egasi"
                    options={drivers || []}
                    control={form.control}
                    labelKey="first_name"
                    valueKey="id"
                />

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {"Saqlash"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddVehicleModal
