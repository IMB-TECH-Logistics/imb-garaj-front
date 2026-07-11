import { FormCombobox } from "@/components/form/combobox"
import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    MANAGERS_CASHFLOW,
    MANAGERS_CASHFLOW_CURRENCY,
    MANAGERS_EXPENSES,
    SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    SETTINTS_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export const EXPENSE_EDIT_MODAL_KEY = "trip-expense-edit"
export const EXPENSE_EDIT_STORE_KEY = "trip-expense-edit-row"

type EditFormValues = {
    amount: number | string
    category: number | string
    payment_type: number | string
    comment: string
    currency: number
    currency_course: number | string
}

export default function ExpenseEditForm() {
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal(EXPENSE_EDIT_MODAL_KEY)

    const editItem = getData<EditFormValues & { id?: number }>(EXPENSE_EDIT_STORE_KEY)

    const form = useForm<EditFormValues>({
        defaultValues: {
            amount: editItem?.amount ?? "",
            category: editItem?.category ?? "",
            payment_type: editItem?.payment_type ?? "",
            comment: editItem?.comment ?? "",
            currency: editItem?.currency ?? 1,
            currency_course: editItem?.currency_course ?? "",
        },
    })
    const { handleSubmit, control, reset, watch, setValue } = form
    const currency = watch("currency")

    useEffect(() => {
        reset({
            amount: editItem?.amount ?? "",
            category: editItem?.category ?? "",
            payment_type: editItem?.payment_type ?? "",
            comment: editItem?.comment ?? "",
            currency: editItem?.currency ?? 1,
            currency_course: editItem?.currency_course ?? "",
        })
    }, [editItem?.id, reset])

    const { data: paymentTypes } = useGet<ListResponse<RolesType>>(
        SETTINTS_PAYMENT_TYPE,
        { params: { page_size: 1000000 } },
    )
    const { data: categoryData } = useGet<ExpenseCategory[]>(
        SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    )
    const { data: currencyData } = useGet(MANAGERS_CASHFLOW_CURRENCY, {
        enabled: currency === 2,
        options: { staleTime: 0, gcTime: 0, refetchOnMount: "always" },
    })

    useEffect(() => {
        if (currency === 2 && currencyData?.currency_course && !editItem?.currency_course) {
            setValue("currency_course", currencyData.currency_course)
        }
    }, [currency, currencyData, editItem?.currency_course, setValue])

    const { mutate: update, isPending } = usePatch()

    const onSubmit = (data: EditFormValues) => {
        if (!editItem?.id) return

        const payload = {
            amount: Number(data.amount),
            category: data.category || null,
            payment_type: data.payment_type || null,
            comment: data.comment || null,
            currency: data.currency || 1,
            currency_course: data.currency === 2 ? data.currency_course || null : null,
        }

        update(`${MANAGERS_EXPENSES}/${editItem.id}`, payload, {
            onSuccess: () => {
                toast.success("Xarajat tahrirlandi")
                queryClient.invalidateQueries({ queryKey: [MANAGERS_CASHFLOW] })
                clearKey(EXPENSE_EDIT_STORE_KEY)
                closeModal()
            },
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormCombobox
                control={control}
                label="Valyuta"
                name="currency"
                options={[
                    { id: 1, name: "UZS" },
                    { id: 2, name: "USD" },
                ]}
                valueKey="id"
                labelKey="name"
            />
            <FormNumberInput
                required
                control={control}
                label="Summa"
                name="amount"
                placeholder="Ex: 123 000"
                thousandSeparator=" "
                decimalScale={currency === 2 ? 2 : 0}
            />
            {currency === 2 && (
                <FormNumberInput
                    required
                    control={control}
                    label="Valyuta kursi"
                    name="currency_course"
                    placeholder="Ex: 12 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}
            <FormCombobox
                required
                control={control}
                label="Kategoriya"
                name="category"
                options={categoryData}
                valueKey="id"
                labelKey="name"
            />
            <FormCombobox
                control={control}
                label="To'lov turi"
                name="payment_type"
                options={paymentTypes?.results ?? []}
                valueKey="id"
                labelKey="name"
            />
            <FormTextarea label="Izoh" methods={form} name="comment" />
            <Button type="submit" loading={isPending} disabled={isPending} className="w-full">
                Saqlash
            </Button>
        </form>
    )
}
