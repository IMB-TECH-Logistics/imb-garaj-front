import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { FormSelect } from "@/components/form/select"
import { Button } from "@/components/ui/button"
import {
    CHECKOUT_BALANCES,
    CHECKOUT_LOGS,
    CHECKOUT_SUMMARY,
    CHECKOUT_TRANSFER,
} from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type Direction = "cash_to_card" | "card_to_cash"

type FormValues = {
    direction: Direction
    amount: string | number | ""
    comment: string
}

type Props = {
    modalKey: string
}

const CheckoutTransferModal = ({ modalKey }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)

    const directionOptions = useMemo(
        () => [
            { id: "cash_to_card", name: t("kassa.direction_cash_to_card") },
            { id: "card_to_cash", name: t("kassa.direction_card_to_cash") },
        ],
        [t],
    )

    const form = useForm<FormValues>({
        defaultValues: { direction: "cash_to_card", amount: "", comment: "" },
    })
    const { control, handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen) reset({ direction: "cash_to_card", amount: "", comment: "" })
    }, [isOpen, reset])

    const onSuccess = () => {
        toast.success(t("toast.record_updated"))
        queryClient.refetchQueries({ queryKey: [CHECKOUT_BALANCES] })
        queryClient.invalidateQueries({ queryKey: [CHECKOUT_SUMMARY] })
        queryClient.refetchQueries({ queryKey: ["transaction"] })
        queryClient.invalidateQueries({ queryKey: [CHECKOUT_LOGS] })
        closeModal()
    }

    const { mutate: create, isPending } = usePost({ onSuccess, meta: { skipGlobalError: true } })

    const onSubmit = (values: FormValues) => {
        const payload = {
            direction: values.direction,
            amount: Number(values.amount),
            comment: values.comment || null,
        }
        create(CHECKOUT_TRANSFER, payload, {
            onError: (e: unknown) => handleFormError(e, form),
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormSelect
                required
                control={control}
                label={t("kassa.direction")}
                name="direction"
                options={directionOptions}
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
                    validate: (v) => Number(v) > 0 || t("kassa.amount_gt_zero"),
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

export default CheckoutTransferModal
