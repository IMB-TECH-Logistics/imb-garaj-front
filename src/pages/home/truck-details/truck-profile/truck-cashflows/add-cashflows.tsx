import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    VEHICLES_CASHFLOWS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const AddVehicleCashflowModal = () => {
    const { t } = useTranslation()
    const params = useParams({ strict: false })
    const id = params.id || ""
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create-vehicle-cashflow")
    const { data: categoryData } = useGet<ExpenseCategory[]>(
        SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    )

    const { getData, clearKey } = useGlobalStore()
    const currentVehicleCashflow =
        getData<VehicleCashFlowAdd>(VEHICLES_CASHFLOWS)

    const form = useForm<VehicleCashFlowAdd>({
        defaultValues: {
            ...currentVehicleCashflow,
            vehicle: parseInt(id),
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentVehicleCashflow?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        reset()
        clearKey(VEHICLES_CASHFLOWS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [VEHICLES_CASHFLOWS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: VehicleCashFlowAdd) => {
        if (currentVehicleCashflow?.id) {
            updateMutate(
                `${VEHICLES_CASHFLOWS}/${currentVehicleCashflow.id}`,
                values,
            )
        } else {
            postMutate(VEHICLES_CASHFLOWS, values)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid md:grid-cols-2 gap-4"
            >
                <FormCombobox
                    required
                    label={t("form.expense_type")}
                    name="category"
                    control={form.control}
                    options={categoryData}
                    valueKey="id"
                    labelKey="name"
                />
                <FormInput
                    required
                    name="comment"
                    label={t("form.comment")}
                    methods={form}
                />
                <FormNumberInput
                    required
                    name="amount"
                    label={t("table.amount")}
                    thousandSeparator=" "
                    control={form.control}
                    placeholder="0"
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

export default AddVehicleCashflowModal
