import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
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
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { FormDatePicker } from "@/components/form/date-picker"
import { VehicleExpenseRow } from "./cols"
import { useTranslation } from "react-i18next"
import { todayIso } from "@/lib/today-iso"
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
            date: current?.date ?? todayIso(),
            lifespan: current?.lifespan ?? "",
            comment: current?.comment ?? "",
            items: (current?.items ?? []).map((item) => ({
                product: item.product,
                lot: item.lot,
                quantity: String(Number(item.quantity)),
                odometer: item.odometer ? String(item.odometer) : "",
            })),
        },
    })

    const { handleSubmit, control, reset, setValue, getValues } = form
    const category = useWatch({ control, name: "category" })
    const items = useWatch({ control, name: "items" })
    const dateValue = useWatch({ control, name: "date" })
    const minLifespan = dateValue ? startOfDay(new Date(dateValue)) : undefined

    const { data: vehicles } = useGet<SelectItem[]>("selectable/vehicle", {
        params: { model_name: "vehicle" },
    })

    const { data: categoriesData } = useGet<ListResponse<ExpenseCategory>>(
        SETTINGS_EXPENSES,
        { params: { type: 1, page_size: 100 } },
    )
    const categories = categoriesData?.results

    useEffect(() => {
        if (current?.id || getValues("category")) return
        const tech = categories?.find((c) => c.code === TECH_INSPECTION_CODE)
        if (tech) setValue("category", tech.id)
    }, [categories])

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
            lifespan: values.lifespan || null,
            comment: values.comment,
        }
        const payload =
            isWarehouse ?
                {
                    ...base,
                    items: check.allocate(values.items).map((item) => ({
                        lot: item.lot,
                        quantity: item.quantity,
                        ...(item.odometer ?
                            { odometer: Number(item.odometer) }
                        :   {}),
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
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormCombobox
                        required
                        label={t("form.vehicle")}
                        hideError={false}
                        wrapperClassName="col-span-2"
                        name="vehicle"
                        control={control}
                        options={vehicles || []}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.vehicle")}
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
                        fullWidth
                        required
                        label={t("form.date")}
                        control={control}
                        name="date"
                        placeholder={t("form.select_date")}
                        className="w-full"
                    />

                    <FormDatePicker
                        fullWidth
                        required
                        label={t("form.lifespan")}
                        control={control}
                        name="lifespan"
                        placeholder={t("form.select_date")}
                        className="w-full"
                        calendarProps={minLifespan ? { disabled: { before: minLifespan } } : undefined}
                    />
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <FormTextarea
                    name="comment"
                    label={t("form.comment")}
                    methods={form}
                    placeholder="Qo'shimcha izoh..."
                    rows={3}
                />
            </section>

            <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
                {error && (
                    <span className="text-xs text-destructive">{error}</span>
                )}
                <Button
                    type="submit"
                    loading={isPending}
                    disabled={isWarehouse ? check.invalid : !!error}
                    className="min-w-36"
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddExpenseModal
