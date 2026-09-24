import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {  SETTINGS_CARGO_TYPE } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const AddCargoModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<RolesType>( SETTINGS_CARGO_TYPE)

    const form = useForm<RolesType>({
        defaultValues: currentRole,
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentRole?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        reset()
        clearKey( SETTINGS_CARGO_TYPE)
        closeModal()
        queryClient.refetchQueries({ queryKey: [ SETTINGS_CARGO_TYPE] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: RolesType) => {
        if (currentRole?.id) {
            updateMutate(`${ SETTINGS_CARGO_TYPE}/${currentRole.id}`, values)
        } else {
            postMutate( SETTINGS_CARGO_TYPE, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-1">
            <FormInput required name="name" label={t("form.cargo_type")} methods={form} />

            <div className="flex items-center justify-end  mt-3">
                <Button
                    className="min-w-36 w-full md:w-max"
                    type="submit"
                    loading={isPending}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddCargoModal
