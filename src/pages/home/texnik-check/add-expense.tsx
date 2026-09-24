import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    TECHNICAL_INSPECT,
    SETTINGS_EXPENSES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { startOfDay } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FormDatePicker } from "@/components/form/date-picker"
import { VehicleExpenseRow } from "./cols"
import { useTranslation } from "react-i18next"

type SelectItem = { id: number | string; name: string }

type ExpenseForm = {
    vehicle: number | null
    category: number | null
    amount: string | null
    date: string
    lifespan: string
    comment: string
}

const AddExpenseModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("add-expense")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<VehicleExpenseRow>(TECHNICAL_INSPECT)

    const form = useForm<ExpenseForm>({
        defaultValues: {
            vehicle: current?.vehicle ?? null,
            category: current?.category ?? null,
            amount: current?.amount ? String(current.amount) : null,
            date: current?.date ?? new Date().toISOString().split("T")[0],
            lifespan: current?.lifespan ?? "",
            comment: current?.comment ?? "",
        },
    })

    const { handleSubmit, control, reset, watch } = form
    const dateValue = watch("date")
    const minLifespan = dateValue ? startOfDay(new Date(dateValue)) : undefined

    const { data: vehicles } = useGet<SelectItem[]>("selectable/vehicle", {
        params: { model_name: "vehicle" },
    })

    const { data: categoriesData } = useGet<ListResponse<SelectItem>>(SETTINGS_EXPENSES, {
        params: { type: 1, page_size: 100 },
    })
    const categories = categoriesData?.results

    const onSuccess = () => {
        toast.success(current?.id ? t("messages.success_edit") : t("messages.success_add"))
        reset()
        clearKey(TECHNICAL_INSPECT)
        closeModal()
        queryClient.refetchQueries({ queryKey: [TECHNICAL_INSPECT] })
    }

    const { mutate: postMutate, isPending: creating } = usePost({ onSuccess })
    const { mutate: patchMutate, isPending: updating } = usePatch({ onSuccess })
    const isPending = creating || updating

    const onSubmit = (values: ExpenseForm) => {
        if (current?.id) {
            patchMutate(`${TECHNICAL_INSPECT}/${current.id}`, values)
        } else {
            postMutate(TECHNICAL_INSPECT, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormCombobox
                required
                label={t("form.vehicle")}
                hideError={false}
                name="vehicle"
                control={control}
                options={vehicles || []}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.vehicle")}
            />
            <FormCombobox
                required
                label={t("form.expense_type")}
                hideError={false}
                name="category"
                control={control}
                options={categories || []}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.expense_type")}
            />
            <FormNumberInput
                required
                name="amount"
                label={t("form.amount")}
                control={control}
                thousandSeparator=" "
                decimalScale={2}
                allowNegative={false}
                registerOptions={{
                    validate: (v) =>
                        Number(v) > 0 || "Summa 0 dan katta bo'lishi kerak",
                }}
                placeholder="Ex: 1 000 000"
            />
            <FormDatePicker
                required
                label={t("form.date")}
                control={control}
                name="date"
                placeholder={t("form.select_date")}
                className="w-full"
            />
            <FormDatePicker
                required
                label={t("form.lifespan")}
                control={control}
                name="lifespan"
                placeholder={t("form.select_date")}
                calendarProps={minLifespan ? { disabled: { before: minLifespan } } : undefined}
                className="w-full"
            />
            <FormInput
                name="comment"
                label={t("form.comment")}
                methods={form}
                placeholder="Qo'shimcha izoh..."
            />

            <div className="col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={isPending} className="min-w-36">
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddExpenseModal
