import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS, DRIVER_SALARIES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { formatDate, type DirectionRow } from "../route-configs/cols"
import { formatPriceLabel, localTodayIso } from "./cols"

type FormValues = { amount: string | null; valid_from: string | null }

interface Props {
    row: DirectionRow
}

const EditSalaryModal = ({ row }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("edit-salary")
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            amount: row.driver_salary_amount ?? null,
            valid_from: localTodayIso(),
        },
    })
    const { mutateAsync, isPending } = usePatch()

    const today = localTodayIso()
    const history = [...(row.driver_salary_history ?? [])].sort((a, b) =>
        b.valid_from.localeCompare(a.valid_from),
    )
    const currentId = history.find((h) => h.valid_from <= today)?.id

    const onSubmit = async ({ amount, valid_from }: FormValues) => {
        if (!amount || !valid_from) return
        try {
            await mutateAsync(`${DRIVER_SALARIES}/bulk-update`, {
                directions: [row.id],
                amount,
                valid_from,
            })
            toast.success(t("page.directions_salary_updated", { count: 1 }))
            await queryClient.invalidateQueries({
                queryKey: [COMMON_DIRECTIONS],
            })
            closeModal()
        } catch {
            return
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                {row.load_name} → {row.unload_name} · {row.cargo_type_name}
            </p>
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
                                key={h.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                            >
                                <span className="font-semibold tabular-nums">
                                    {formatPriceLabel(String(h.amount))}
                                </span>
                                <div className="flex items-center gap-2">
                                    {h.valid_from > today && (
                                        <Badge variant="outline">
                                            {t("page.salary_upcoming")}
                                        </Badge>
                                    )}
                                    {h.id === currentId && (
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
