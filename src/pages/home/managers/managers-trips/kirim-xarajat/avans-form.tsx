import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { FormDatePicker } from "@/components/form/date-picker"
import FormTextarea from "@/components/form/textarea"
import { useModal } from "@/hooks/useModal"
import { toast } from "sonner"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { MANAGERS_CASHFLOW, MANAGERS_TRIPS, SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { isWithinMoneyLimit } from "@/lib/money-limit"

// ──── Avans form ────

export function AvansForm({ tripId }: { tripId?: number }) {
    const { t } = useTranslation()
    const { closeModal } = useModal("avans-berish")
    const form = useForm({ defaultValues: { amount: "", payment_type: "", comment: "", date: "" } })
    const { handleSubmit, control, reset, watch, setValue } = form
    const { mutate, isPending } = usePost()
    const queryClient = useQueryClient()
    const { data: paymentTypes } = useGet(SETTINTS_PAYMENT_TYPE, {
        params: { page_size: 1000000 },
    })

    const onSubmit = (data: any) => {
        mutate(MANAGERS_CASHFLOW, {
            trip: tripId ?? null,
            amount: Number(data.amount),
            payment_type: data.payment_type || null,
            comment: data.comment || null,
            date: data.date || null,
            action: 2,
            currency: 1,
        }, {
            onSuccess: (res: any) => {
                // Haydovchi-kassa rejimida server pul bermaydi — kassirga so'rov (PaymentRequest, 202) yaratadi
                const isRequest = res != null && typeof res === "object" && "recipient_type" in res
                toast.success(isRequest ? t("trips.kirim.advance_request_sent") : t("toast.advance_given"))
                queryClient.invalidateQueries({
                    predicate: (q) => {
                        const k = String(q.queryKey[0])
                        return k.includes("cashflow") || k.startsWith("checkout/kassa-v2") || k.startsWith(MANAGERS_TRIPS)
                    },
                })
                reset()
                closeModal()
            },
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <FormNumberInput
                        required
                        control={control}
                        label={t("form.amount")}
                        name="amount"
                        placeholder={t("trips.common.example_value", { value: "5 000 000" })}
                        thousandSeparator=" "
                        decimalScale={2}
                        registerOptions={{
                            // backend v1 (ExpenseCashFlowSerializer) matni; v2 so'rov yo'li 0 ni jim tashlab 202 qaytaradi
                            validate: (v) =>
                                Number(String(v ?? "").replace(/\s/g, "")) > 0 ? isWithinMoneyLimit(v) || t("validation.max_amount") : t("kassa.amount_gt_zero"),
                        }}
                    />
                </div>
            </div>
            <FormCombobox
                control={control}
                required
                labelKey="name"
                valueKey="id"
                name="payment_type"
                options={paymentTypes?.results ?? []}
                label={t("form.payment_type")}
            />
            <FormDatePicker
                required
                label={t("form.date")}
                control={control}
                name="date"
            />
            <FormTextarea label={t("form.comment")} methods={form} name="comment" />
            <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? t("messages.loading") : t("actions.save")}
            </Button>
        </form>
    )
}
