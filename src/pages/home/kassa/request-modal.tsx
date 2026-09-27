import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { FormSelect } from "@/components/form/select"
import { Button } from "@/components/ui/button"
import { CHECKOUT_PENDING_COUNTS, CHECKOUT_REQUESTS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type CheckoutKind = "cash" | "card"

type FormValues = {
    type: "1" | "-1"
    checkout_kind: CheckoutKind
    amount: string | number | ""
    comment: string
}

type Props = {
    modalKey: string
}

const CheckoutRequestModal = ({ modalKey }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)

    const typeOptions = useMemo(
        () => [
            { id: "1", name: t("form.income") },
            { id: "-1", name: t("form.expense") },
        ],
        [t],
    )
    const kindOptions = useMemo(
        () => [
            { id: "cash", name: t("kassa.cash") },
            { id: "card", name: t("kassa.card") },
        ],
        [t],
    )

    const form = useForm<FormValues>({
        defaultValues: { type: "1", checkout_kind: "cash", amount: "", comment: "" },
    })
    const { control, handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen)
            reset({ type: "1", checkout_kind: "cash", amount: "", comment: "" })
    }, [isOpen, reset])

    const onSuccess = () => {
        toast.success(t("toast.added"))
        queryClient.refetchQueries({ queryKey: [CHECKOUT_REQUESTS] })
        queryClient.invalidateQueries({ queryKey: [CHECKOUT_PENDING_COUNTS] })
        closeModal()
    }

    const { mutate: create, isPending } = usePost({ onSuccess, meta: { skipGlobalError: true } })

    const onSubmit = (values: FormValues) => {
        const payload = {
            type: Number(values.type),
            checkout_kind: values.checkout_kind,
            amount: Number(values.amount),
            comment: values.comment || null,
        }
        create(CHECKOUT_REQUESTS, payload, {
            onError: (e: unknown) => handleFormError(e, form),
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormSelect
                required
                control={control}
                label={t("kassa.request")}
                name="type"
                options={typeOptions}
                valueKey="id"
                labelKey="name"
            />
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

export default CheckoutRequestModal
