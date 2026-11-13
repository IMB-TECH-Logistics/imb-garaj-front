import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { isWithinMoneyLimit } from "@/lib/money-limit"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import OrderPicker, { BANK_ORDERS, type PickedOrder } from "./order-picker"

export const BANK_INCOME = "checkout/bank/income"
export const BANK_INCOME_MODAL = "bank-income"

type FormValues = {
    amount: string | number | ""
    date: Date | string | null
    source: string
    comment: string
}

const emptyValues = (): FormValues => ({ amount: "", date: new Date(), source: "", comment: "" })

const BankIncomeModal = ({ refetchKeys }: { refetchKeys: string[] }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(BANK_INCOME_MODAL)
    const form = useForm<FormValues>({ defaultValues: emptyValues() })
    const { control, handleSubmit, reset } = form
    const [order, setOrder] = useState<PickedOrder | null>(null)

    useEffect(() => {
        if (!isOpen) {
            reset(emptyValues())
            setOrder(null)
        }
    }, [isOpen, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("bank_page.income_added"))
            ;[...refetchKeys, BANK_ORDERS].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
            closeModal()
        },
        meta: { skipGlobalError: true },
    })

    const onSubmit = (values: FormValues) => {
        mutate(
            BANK_INCOME,
            {
                amount: Number(values.amount),
                date: values.date ? format(new Date(values.date), "yyyy-MM-dd") : null,
                source: values.source || null,
                comment: values.comment || null,
                order: order?.id ?? null,
            },
            { onError: (e: unknown) => handleFormError(e, form) },
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormNumberInput
                required
                control={control}
                label={t("form.amount")}
                name="amount"
                placeholder={`${t("form.example")}: 1 000 000`}
                thousandSeparator=" "
                decimalScale={2}
                allowNegative={false}
                registerOptions={{
                    validate: (v) =>
                        Number(v) > 0 ?
                            isWithinMoneyLimit(v) || t("validation.max_amount")
                        :   t("kassa.amount_gt_zero"),
                }}
            />
            <FormDatePicker
                fullWidth
                label={t("form.date")}
                control={control}
                name="date"
                placeholder={t("form.select_date")}
            />
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t("bank_page.order_field")}</span>
                <OrderPicker value={order} onChange={setOrder} />
                <span className="text-xs text-muted-foreground">{t("bank_page.order_hint")}</span>
            </div>
            <FormInput
                name="source"
                label={t("bank_page.income_source")}
                placeholder={t("bank_page.income_source_hint")}
                methods={form}
            />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button className="min-w-32" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default BankIncomeModal
