import { FormCombobox } from "@/components/form/combobox"
import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type FormValues = {
    amount: string | number | ""
    currency: 1 | 2
    currency_course: string | number | ""
    comment: string
}

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS" },
    { id: 2, name: "USD" },
]

const TopUpModal = ({ stationId }: { stationId: number }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("petrol-top-up")

    const form = useForm<FormValues>({
        defaultValues: {
            amount: "",
            currency: 1,
            currency_course: "",
            comment: "",
        },
    })
    const { control, handleSubmit, watch, reset } = form
    const currency = watch("currency")

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("toast.income_added"))
            reset()
            queryClient.refetchQueries({ queryKey: [SETTINGS_PETROL_STATIONS] })
            queryClient.refetchQueries({
                predicate: (q) =>
                    String(q.queryKey[0]).includes("petrol-stations"),
            })
            closeModal()
        },
    })

    const onSubmit = (values: FormValues) => {
        mutate(`${SETTINGS_PETROL_STATIONS}/${stationId}/top-up`, {
            amount: Number(values.amount),
            currency: values.currency,
            currency_course:
                values.currency === 2 && values.currency_course !== ""
                    ? Number(values.currency_course)
                    : null,
            comment: values.comment || null,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormCombobox
                control={control}
                label={t("form.currency")}
                name="currency"
                options={CURRENCY_OPTIONS}
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
                        Number(v) > 0 || "Summa 0 dan katta bo'lishi kerak",
                }}
            />
            {currency === 2 && (
                <FormNumberInput
                    required
                    control={control}
                    label={t("form.currency_rate")}
                    name="currency_course"
                    placeholder="Ex: 12 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button className="min-w-32" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default TopUpModal
