import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { localTodayIso, VILOYAT_TARIFFS, type ViloyatTariffRow } from "./cols"

type FormValues = { amount: string | null; valid_from: string | null }

interface Props {
    selected: ViloyatTariffRow[]
    onApplied: () => void
}

const BulkSalaryModal = ({ selected, onApplied }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("bulk-salary")
    const { handleSubmit, control, reset } = useForm<FormValues>({
        defaultValues: { amount: null, valid_from: localTodayIso() },
    })
    const { mutateAsync, isPending } = usePost()
    const submitting = useRef(false)

    const onSubmit = async ({ amount, valid_from }: FormValues) => {
        if (!amount || !valid_from || selected.length === 0) return
        if (submitting.current) return
        submitting.current = true
        try {
            await mutateAsync(`${VILOYAT_TARIFFS}/bulk`, {
                items: selected.map((r) => ({
                    from_region: r.from_region,
                    to_region: r.to_region,
                    amount,
                    valid_from,
                })),
            })
            toast.success(t("page.vt_updated", { count: selected.length }))
            await queryClient.invalidateQueries({
                queryKey: [VILOYAT_TARIFFS],
            })
            reset({ amount: null, valid_from: localTodayIso() })
            closeModal()
            onApplied()
        } catch {
            return
        } finally {
            submitting.current = false
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                {t("page.vt_bulk_hint", { count: selected.length })}
            </p>
            <FormNumberInput
                required
                thousandSeparator=" "
                name="amount"
                label={t("form.give_salary")}
                placeholder="12 206 000"
                control={control}
            />
            <FormDatePicker
                required
                name="valid_from"
                label={t("page.valid_from")}
                control={control}
                fullWidth
            />
            <div className="flex items-center justify-end mt-2">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default BulkSalaryModal
