import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_VEHICLE_TYPE } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const vehicleTypeOptions = [
    { value: "truck", label: "Avtomobil" },
    { value: "trailer", label: "Tirkama" },
]

const AddVehicleModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<VehicleRoleType>(SETTINGS_VEHICLE_TYPE)

    const form = useForm<VehicleRoleType>({
        defaultValues: currentRole,
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentRole?.id ? t("messages.success_edit") : t("messages.success_add"),
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
                    label={t("form.name")}
                    methods={form}
                />
                <FormCombobox
                    required
                    name="type"
                    label={t("form.vehicle_type")}
                    options={vehicleTypeOptions}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />

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

export default AddVehicleModal
