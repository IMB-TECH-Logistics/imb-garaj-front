import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { SETTINGS_EXPENSES, TECHNICAL_INSPECT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export default function CreateTechnicInspect() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const currentTech = getData(TECHNICAL_INSPECT)
    const { closeModal } = useModal("create")
    const form = useForm({
        defaultValues: {
            ...currentTech,
            vehicle: currentTech?.vehicle,
        },
    })
    const { handleSubmit, reset } = form

    function onSuccess() {
        toast.success(
            currentTech?.id ?
                t("messages.success_edit")
            :   t("messages.success_add"),
        )
        queryClient.invalidateQueries({ queryKey: [TECHNICAL_INSPECT] })
        closeModal()
        reset()
    }
    const { mutate: createMutate } = usePost({
        onSuccess,
    })
    const { mutate: editMutate } = usePatch({
        onSuccess,
    })

    const { data: expenses } =
        useGet<ListResponse<ExpenseCategory>>(SETTINGS_EXPENSES)
        
    function onSubmit(value: TechnicInspect) {
        if (currentTech?.id) {
            editMutate(`${TECHNICAL_INSPECT}/${currentTech?.id}`, value)
        } else {
            createMutate(TECHNICAL_INSPECT, value)
        }
    }
    return (
        <>
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <FormCombobox
                    options={expenses?.results}
                    label={t("form.truck")}
                    control={form.control}
                    name="vehicle"
                    labelKey="name"
                    valueKey="id"
                    required
                />
                <FormCombobox
                    options={expenses?.results}
                    label={t("form.expense_type")}
                    control={form.control}
                    name="category"
                    labelKey="name"
                    valueKey="id"
                    required
                />
                <div className="grid grid-cols-2 gap-2">
                    <FormDatePicker
                        name="date"
                        label={t("form.date")}
                        control={form.control}
                        fullWidth
                        required
                    />
                    <FormDatePicker
                        name="lifespan"
                        label={t("form.license_expiry")}
                        control={form.control}
                        fullWidth
                        required
                    />
                </div>
                <FormNumberInput
                    control={form.control}
                    label={t("form.amount")}
                    name="amount"
                    thousandSeparator=" "
                    decimalScale={0}
                    required
                />
                <FormTextarea
                    methods={form}
                    name="comment"
                    label={t("form.comment")}
                    required
                    placeholder={t("form.comment")}
                />
                <div className="flex items-center justify-end">
                    <Button>{t("actions.save")}</Button>
                </div>
            </form>
        </>
    )
}
