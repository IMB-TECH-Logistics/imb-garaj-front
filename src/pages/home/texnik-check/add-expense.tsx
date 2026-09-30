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
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { FormDatePicker } from "@/components/form/date-picker"
import { VehicleExpenseRow } from "./cols"
import { useTranslation } from "react-i18next"
import {
    TECH_INSPECTION_CODE,
    type ExpenseCategory,
    type ExpenseForm,
} from "./types"
import { useLineCheck } from "./use-line-check"
import WarehouseLines from "./warehouse-lines"

type SelectItem = { id: number | string; name: string }

type Props = {
    modalKey?: string
    vehicleId?: number
}

const AddExpenseModal = ({ modalKey = "add-expense", vehicleId }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(modalKey)
    const { getData, clearKey } = useGlobalStore()
    const current = getData<VehicleExpenseRow>(TECHNICAL_INSPECT) ?? null

    const form = useForm<ExpenseForm>({
        defaultValues: {
            vehicle: current?.vehicle ?? vehicleId ?? null,
            category: current?.category ?? null,
            amount: current?.amount ? String(current.amount) : null,
            date: current?.date ?? new Date().toISOString().split("T")[0],
            comment: current?.comment ?? "",
            items: (current?.items ?? []).map((item) => ({
                product: item.product,
                lot: item.lot,
                quantity: String(Number(item.quantity)),
                source: item.source ?? "manual",
            })),
        },
    })

    const { handleSubmit, control, reset } = form
    const category = useWatch({ control, name: "category" })
    const items = useWatch({ control, name: "items" })

    const { data: vehicles } = useGet<SelectItem[]>("selectable/vehicle", {
        params: { model_name: "vehicle" },
    })

    const { data: categoriesData } = useGet<ListResponse<ExpenseCategory>>(
        SETTINGS_EXPENSES,
        { params: { type: 1, page_size: 100 } },
    )
    const categories = categoriesData?.results

    const categoryCode =
        categories?.find((c) => c.id === category)?.code ??
        (category === current?.category ? current?.category_code : null)
    const isWarehouse = categoryCode === TECH_INSPECTION_CODE
    const check = useLineCheck(items, current, isWarehouse)
    const error = isWarehouse ? check.error : ""

    const onSuccess = () => {
        toast.success(current?.id ? t("messages.success_edit") : t("messages.success_add"))
        reset()
        clearKey(TECHNICAL_INSPECT)
        closeModal()
        queryClient.refetchQueries({ queryKey: [TECHNICAL_INSPECT] })
        if (isWarehouse) {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    String(query.queryKey[0]).startsWith("warehouse/"),
            })
        }
    }

    const { mutate: postMutate, isPending: creating } = usePost({ onSuccess })
    const { mutate: patchMutate, isPending: updating } = usePatch({ onSuccess })
    const isPending = creating || updating

    const onSubmit = (values: ExpenseForm) => {
        const base = {
            vehicle: values.vehicle,
            category: values.category,
            date: values.date,
            comment: values.comment,
        }
        const payload =
            isWarehouse ?
                {
                    ...base,
                    items: values.items.map((item) => ({
                        lot: item.lot,
                        quantity: item.quantity,
                        source: item.source,
                    })),
                }
            :   { ...base, amount: values.amount }

        if (current?.id) {
            patchMutate(`${TECHNICAL_INSPECT}/${current.id}`, payload)
        } else {
            postMutate(TECHNICAL_INSPECT, payload)
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
            {isWarehouse ?
                <WarehouseLines form={form} current={current} check={check} />
            :   <FormNumberInput
                    required
                    name="amount"
                    label={t("form.amount")}
                    control={control}
                    wrapperClassName="col-span-2"
                    thousandSeparator=" "
                    decimalScale={2}
                    allowNegative={false}
                    registerOptions={{
                        validate: (v) =>
                            Number(v) > 0 || "Summa 0 dan katta bo'lishi kerak",
                    }}
                    placeholder="Ex: 1 000 000"
                />
            }
            <FormDatePicker
                required
                label={t("form.date")}
                control={control}
                name="date"
                placeholder={t("form.select_date")}
                className="w-full"
            />
            <FormInput
                name="comment"
                label={t("form.comment")}
                methods={form}
                placeholder="Qo'shimcha izoh..."
            />

            <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
                {error && (
                    <span className="text-xs text-destructive">{error}</span>
                )}
                <Button
                    type="submit"
                    loading={isPending}
                    disabled={!!error}
                    className="min-w-36"
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddExpenseModal
