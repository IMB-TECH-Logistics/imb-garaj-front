import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { FormSelect } from "@/components/form/select"
import { Button } from "@/components/ui/button"
import {
    CHECKOUT_BALANCES,
    CHECKOUT_EXPENSE,
    CHECKOUT_LOGS,
    CHECKOUT_PENDING_COUNTS,
    CHECKOUT_SUMMARY,
    CHECKOUT_TOP_UP,
    CHECKOUT_TRANSACTIONS,
} from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { isWithinMoneyLimit } from "@/lib/money-limit"

type CheckoutKind = "cash" | "card"

type FormValues = {
    amount: string | number | ""
    comment: string
    checkout_kind: CheckoutKind
}

export type CheckoutEditing = {
    id: number
    amount: string
    comment: string | null
    checkout_kind?: CheckoutKind
}

type Props = {
    modalKey: string
    kind: "income" | "expense"
    editing?: CheckoutEditing
    defaultCheckoutKind?: CheckoutKind
}

const CheckoutAdjustModal = ({
    modalKey,
    kind,
    editing,
    defaultCheckoutKind = "cash",
}: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)
    const isIncome = kind === "income"
    const url = isIncome ? CHECKOUT_TOP_UP : CHECKOUT_EXPENSE

    const kindOptions = useMemo(
        () => [
            { id: "cash", name: t("kassa.cash") },
            { id: "card", name: t("kassa.card") },
        ],
        [t],
    )

    const form = useForm<FormValues>({
        defaultValues: {
            amount: "",
            comment: "",
            checkout_kind: defaultCheckoutKind,
        },
    })
    const { control, handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen)
            reset({
                amount: "",
                comment: "",
                checkout_kind: defaultCheckoutKind,
            })
        else if (editing)
            reset({
                amount: editing.amount,
                comment: editing.comment ?? "",
                checkout_kind: editing.checkout_kind ?? "cash",
            })
    }, [isOpen, editing, reset, defaultCheckoutKind])

    const onSuccess = () => {
        toast.success(
            editing ? t("toast.record_updated")
            : isIncome ? t("toast.balance_topped_up")
            : t("toast.expense_added"),
        )
        queryClient.refetchQueries({ queryKey: [CHECKOUT_BALANCES] })
        queryClient.invalidateQueries({ queryKey: [CHECKOUT_SUMMARY] })
        queryClient.refetchQueries({ queryKey: ["transaction"] })
        queryClient.invalidateQueries({ queryKey: [CHECKOUT_LOGS] })
        queryClient.invalidateQueries({ queryKey: [CHECKOUT_PENDING_COUNTS] })
        closeModal()
    }

    const { mutate: create, isPending: isCreating } = usePost({ onSuccess, meta: { skipGlobalError: true } })
    const { mutate: update, isPending: isUpdating } = usePatch({ onSuccess, meta: { skipGlobalError: true } })

    const onSubmit = (values: FormValues) => {
        const payload = {
            amount: Number(values.amount),
            comment: values.comment || null,
            checkout_kind: values.checkout_kind,
        }
        const options = { onError: (e: unknown) => handleFormError(e, form) }
        if (editing) update(`${CHECKOUT_TRANSACTIONS}/${editing.id}`, payload, options)
        else create(url, payload, options)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormSelect
                required
                control={control}
                label={t("kassa.checkout_kind")}
                name="checkout_kind"
                options={kindOptions}
                valueKey="id"
                labelKey="name"
            />
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
                        Number(v) > 0
                            ? isWithinMoneyLimit(v) || t("validation.max_amount")
                            : t("kassa.amount_gt_zero"),
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
