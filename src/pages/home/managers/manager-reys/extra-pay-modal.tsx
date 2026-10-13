import Modal from "@/components/custom/modal"
import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MANAGERS_EMPTY_LEGS, MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const EXTRA_PAY_MODAL_KEY = "extra-pay"

export type ExtraPayTarget = {
    kind: "order" | "idle"
    id: number
    title: string
    route: string
    amount: number | string | null | undefined
    comment: string | null | undefined
}

type FormValues = {
    amount: string | number | null
    comment: string
}

export default function ExtraPayModal({ target }: { target: ExtraPayTarget | null }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(EXTRA_PAY_MODAL_KEY)
    const form = useForm<FormValues>({ defaultValues: { amount: null, comment: "" } })

    useEffect(() => {
        if (!isOpen || !target) return
        form.reset({
            amount: target.amount != null ? Number(target.amount) : null,
            comment: target.comment ?? "",
        })
    }, [isOpen, target])

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            queryClient.invalidateQueries({
                predicate: (q) => {
                    const key = String(q.queryKey[0])
                    return key.includes("empty-legs") || key.includes(MANAGERS_ORDERS) || key.includes("close-preview")
                },
            })
            closeModal()
        },
        onError: (error: unknown) => handleFormError(error, form),
    })

    const onSubmit = (values: FormValues) => {
        if (!target) return
        const amount = values.amount === "" || values.amount == null ? null : Number(values.amount)
        const comment = values.comment.trim() ? values.comment.trim() : null
        if (target.kind === "order") {
            mutate(`${MANAGERS_ORDERS}/${target.id}/extra-pay`, { extra_pay_amount: amount, extra_pay_comment: comment })
        } else {
            mutate(`${MANAGERS_EMPTY_LEGS}/${target.id}`, { idle_payment_amount: amount, idle_payment_comment: comment })
        }
    }

    return (
        <Modal size="max-w-md" modalKey={EXTRA_PAY_MODAL_KEY} titleInChildren>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="font-normal">{target?.title}</DialogTitle>
                    <DialogDescription>{target?.route}</DialogDescription>
                </DialogHeader>
                <FormNumberInput
                    control={form.control}
                    name="amount"
                    label={t("trips.empty_leg.payment_amount")}
                    thousandSeparator=" "
                    allowNegative={false}
                    decimalScale={2}
                />
                <FormTextarea methods={form} name="comment" label={t("form.comment")} />
                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                        {t("actions.cancel")}
                    </Button>
                    <Button type="submit" loading={isPending}>
                        {t("actions.save")}
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    )
}
