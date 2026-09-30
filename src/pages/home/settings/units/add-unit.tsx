import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { WAREHOUSE_PRODUCTS, WAREHOUSE_UNITS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import type { WhUnit } from "@/pages/home/ombor/types"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type FormValues = { name: string }

const AddUnitModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<WhUnit>(WAREHOUSE_UNITS)

    const form = useForm<FormValues>({
        defaultValues: { name: current?.name ?? "" },
    })

    const onSuccess = () => {
        toast.success(
            current?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        clearKey(WAREHOUSE_UNITS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [WAREHOUSE_UNITS] })
        queryClient.invalidateQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
    }

    const onError = (error: unknown) => handleFormError(error, form)

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
        onError,
    })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
        onError,
    })

    const onSubmit = (values: FormValues) => {
        if (current?.id) {
            updateMutate(`${WAREHOUSE_UNITS}/${current.id}`, values)
        } else {
            postMutate(WAREHOUSE_UNITS, values)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-1">
            <FormInput
                required
                name="name"
                label={t("form.name")}
                methods={form}
            />

            <div className="flex items-center justify-end mt-3">
                <Button
                    className="min-w-36 w-full md:w-max"
                    type="submit"
                    loading={isPendingCreate || isPendingUpdate}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddUnitModal
