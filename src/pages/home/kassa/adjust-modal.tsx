import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    CHECKOUT_EXPENSE,
    CHECKOUT_MAIN,
    CHECKOUT_TOP_UP,
    CHECKOUT_TRANSACTIONS,
} from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type FormValues = {
    amount: string | number | ""
    comment: string
}

export type CheckoutEditing = {
    id: number
    amount: string
    comment: string | null
}

type Props = {
    modalKey: string
    kind: "income" | "expense"
    editing?: CheckoutEditing
}

const CheckoutAdjustModal = ({ modalKey, kind, editing }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)
    const isIncome = kind === "income"
    const url = isIncome ? CHECKOUT_TOP_UP : CHECKOUT_EXPENSE

    const form = useForm<FormValues>({
        defaultValues: { amount: "", comment: "" },
    })
    const { control, handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen) reset({ amount: "", comment: "" })
        else if (editing)
            reset({ amount: editing.amount, comment: editing.comment ?? "" })
    }, [isOpen, editing, reset])

    const onSuccess = () => {
        toast.success(
            editing ? t("toast.record_updated")
            : isIncome ? t("toast.balance_topped_up")
            : t("toast.expense_added"),
        )
        queryClient.refetchQueries({ queryKey: [CHECKOUT_MAIN] })
        queryClient.refetchQueries({ queryKey: ["transaction"] })
        closeModal()
    }

    const { mutate: create, isPending: isCreating } = usePost({ onSuccess, meta: { skipGlobalError: true } })
    const { mutate: update, isPending: isUpdating } = usePatch({ onSuccess, meta: { skipGlobalError: true } })

    const onSubmit = (values: FormValues) => {
        const payload = {
            amount: Number(values.amount),
            comment: values.comment || null,
        }
        const options = { onError: (e: unknown) => handleFormError(e, form) }
        if (editing) update(`${CHECKOUT_TRANSACTIONS}/${editing.id}`, payload, options)
        else create(url, payload, options)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormNumberInput
                required
                control={control}
                label={t("form.amount")}
                name="amount"
                placeholder="Ex: 1 000 000"
                thousandSeparator=" "
                decimalScale={2}
                allowNegative={false}
                registerOptions={{
                    validate: (v) =>
                        Number(v) > 0 || "Summa 0 dan katta bo'lishi kerak",
                }}
            />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button
                    className="min-w-32"
                    type="submit"
                    loading={isCreating || isUpdating}
                    variant={isIncome ? "default" : "destructive"}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default CheckoutAdjustModal
