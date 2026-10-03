import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
    formatDate,
    localTodayIso,
    VILOYAT_TARIFFS,
    type ViloyatTariffRow,
} from "./cols"

type FormValues = { amount: string | null; valid_from: string | null }

interface Props {
    row: ViloyatTariffRow
    title: string
}

const EditSalaryModal = ({ row, title }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("edit-salary")
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            amount: row.amount ?? null,
            valid_from: localTodayIso(),
        },
    })
    const { mutateAsync, isPending } = usePost()
    const submitting = useRef(false)

    const today = localTodayIso()
    const history = [...(row.history ?? [])].sort((a, b) =>
        b.valid_from.localeCompare(a.valid_from),
    )
    const currentFrom = history.find((h) => h.valid_from <= today)?.valid_from

    const onSubmit = async ({ amount, valid_from }: FormValues) => {
        if (!amount || !valid_from) return
        if (submitting.current) return
        submitting.current = true
        try {
            await mutateAsync(VILOYAT_TARIFFS, {
                from_region: row.from_region,
                to_region: row.to_region,
                amount,
                valid_from,
            })
            toast.success(t("page.vt_updated", { count: 1 }))
            await queryClient.invalidateQueries({
                queryKey: [VILOYAT_TARIFFS],
            })
            closeModal()
        } catch {
            return
        } finally {
            submitting.current = false
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">
                    {t("page.vt_both_sides")}
                </p>
            </div>
            <FormNumberInput
                required
                thousandSeparator=" "
                name="amount"
                label={t("form.amount")}
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
            <div className="rounded-md border">
                <div className="px-3 py-2 border-b text-sm font-medium">
                    {t("page.salary_history")}
                </div>
                {history.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                        {t("page.salary_history_empty")}
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto divide-y">
                        {history.map((h) => (
                            <div
                                key={h.valid_from}
                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                            >
                                <span className="font-semibold tabular-nums">
                                    {formatMoney(h.amount)}
                                </span>
                                <div className="flex items-center gap-2">
                                    {h.valid_from > today && (
                                        <Badge variant="outline">
                                            {t("page.salary_upcoming")}
                                        </Badge>
                                    )}
                                    {h.valid_from === currentFrom && (
                                        <Badge variant="secondary">
                                            {t("page.salary_current")}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(h.valid_from)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-end">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default EditSalaryModal
