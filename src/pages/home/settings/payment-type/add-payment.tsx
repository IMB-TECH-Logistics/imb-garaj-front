import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const AddPaymentTypeModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentPayment = getData<RolesType>(SETTINTS_PAYMENT_TYPE)

    const form = useForm<RolesType>({
        defaultValues: currentPayment,
    })

    const { handleSubmit, reset, control } = form

    const methodOptions = [
        { id: 1, name: "Naqd" },
        { id: 2, name: "Plastik" },
        { id: 3, name: "Kassa" },
    ]

    const onSuccess = () => {
        toast.success(
            currentPayment?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        reset()
        clearKey(SETTINTS_PAYMENT_TYPE)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINTS_PAYMENT_TYPE] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: RolesType) => {
        if (currentPayment?.id) {
            updateMutate(
                `${SETTINTS_PAYMENT_TYPE}/${currentPayment.id}`,
                values,
            )
        } else {
            postMutate(SETTINTS_PAYMENT_TYPE, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-1">
            <FormInput
                required
                name="name"
                label={t("form.payment_type")}
                methods={form}
            />

            <FormCombobox
                required
                name="method"
                label={t("form.method")}
                control={control}
                options={methodOptions}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.method")}
            />

            <div className="flex items-center justify-end">
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

export default AddPaymentTypeModal
