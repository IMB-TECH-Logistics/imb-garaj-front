import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import {
    CHECKOUT_EXPENSE,
    CHECKOUT_TOP_UP,
    KASSA_OVERVIEW,
    KASSA_SUMMARY,
    TRANSACTIONS,
} from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isWithinMoneyLimit } from "@/lib/money-limit"

type FormValues = { amount: string | number | ""; comment: string }

type Props = { modalKey: string; kind: "income" | "expense" }

const VstGarageModal = ({ modalKey, kind }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)
    const form = useForm<FormValues>({ defaultValues: { amount: "", comment: "" } })
    const { control, handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen) reset({ amount: "", comment: "" })
    }, [isOpen, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("toast.added"))
            queryClient.invalidateQueries({ queryKey: [KASSA_OVERVIEW] })
            queryClient.invalidateQueries({ queryKey: [KASSA_SUMMARY] })
            queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] })
            closeModal()
        },
        meta: { skipGlobalError: true },
    })

    const onSubmit = (v: FormValues) => {
        mutate(
            kind === "income" ? CHECKOUT_TOP_UP : CHECKOUT_EXPENSE,
            { amount: Number(v.amount), comment: v.comment || null, checkout_kind: "garage" },
            { onError: (e: unknown) => handleFormError(e, form) },
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormNumberInput
                required
                control={control}
                name="amount"
                label={t("form.amount")}
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
                <Button className="min-w-32" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default VstGarageModal
