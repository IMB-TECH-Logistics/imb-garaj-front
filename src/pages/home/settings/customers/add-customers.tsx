import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_CUSTOMERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const AddCustomerModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()

    const currentForwarder = getData<CustomersType>(SETTINGS_CUSTOMERS)
    const form = useForm<CustomersType>({
        defaultValues: {
            name: currentForwarder?.name ?? "",
            code: currentForwarder?.code ?? "",
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentForwarder?.id ? t("messages.success_edit") : t("messages.success_add"),
        )

        reset()
        clearKey(SETTINGS_CUSTOMERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_CUSTOMERS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = async (values: CustomersType) => {
        const isValid = await form.trigger()

        if (!isValid) {
            toast.error(t("toast.error_fields"))
            return
        }

        const payload = { name: values.name, code: values.code }

        if (currentForwarder?.id) {
            updateMutate(`${SETTINGS_CUSTOMERS}/${currentForwarder.id}`, payload)
        } else {
            postMutate(SETTINGS_CUSTOMERS, payload)
        }
    }

    return (
        <>
            <div className="w-full max-w-4xl mx-auto p-1">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid md:grid-cols-2 gap-4"
                >
                    <FormInput
                        required
                        name="name"
                        label={t("form.company_name")}
                        methods={form}
                    />

                    <FormInput
                        name="code"
                        label={t("form.company_code")}
                        methods={form}
                        placeholder="Masalan: 100A"
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
        </>
    )
}

export default AddCustomerModal
