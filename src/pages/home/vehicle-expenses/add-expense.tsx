import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { VEHICLES_CASHFLOWS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { todayIso } from "@/lib/today-iso"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const VEHICLE_EXPENSE_MODAL = "vehicle-expense"

export type VehicleExpense = {
    id: number
    vehicle: number
    vehicle_number: string | null
    category: number
    category_name: string | null
    amount: string | number
    comment: string | null
    date: string | null
    executor_name: string | null
}

type SelectItem = { id: number | string; name: string }
type F = { vehicle: number | null; category: number | null; amount: number | ""; date: string; comment: string }

const empty = (): F => ({ vehicle: null, category: null, amount: "", date: todayIso(), comment: "" })

export default function AddVehicleExpenseModal({ editing, vehicles, categories }: { editing: VehicleExpense | null; vehicles: SelectItem[]; categories: SelectItem[] }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(VEHICLE_EXPENSE_MODAL)
    const form = useForm<F>({ defaultValues: empty() })

    useEffect(() => {
        if (!isOpen) return
        form.reset(
            editing
                ? {
                      vehicle: editing.vehicle,
                      category: editing.category,
                      amount: Number(editing.amount),
                      date: editing.date ? editing.date.slice(0, 10) : todayIso(),
                      comment: editing.comment ?? "",
                  }
                : empty(),
        )
    }, [isOpen, editing])

    const onSuccess = () => {
        toast.success(editing ? t("messages.success_edit") : t("messages.success_add"))
        closeModal()
        queryClient.invalidateQueries({ queryKey: [VEHICLES_CASHFLOWS] })
    }
    const post = usePost({ onSuccess })
    const patch = usePatch({ onSuccess })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                const body = {
                    vehicle: v.vehicle,
                    category: v.category,
                    amount: Number(v.amount),
                    date: `${v.date}T12:00:00`,
                    comment: v.comment.trim() || "-",
                }
                if (editing) patch.mutate(`${VEHICLES_CASHFLOWS}/${editing.id}`, body)
                else post.mutate(VEHICLES_CASHFLOWS, body)
            })}
        >
            <FormCombobox required control={form.control} name="vehicle" label={t("form.truck_number")} options={vehicles} valueKey="id" labelKey="name" disabled={!!editing} />
            <FormCombobox required control={form.control} name="category" label={t("form.expense_type")} options={categories} valueKey="id" labelKey="name" isSearch={false} />
            <FormNumberInput required control={form.control} name="amount" label={t("table.amount")} thousandSeparator=" " allowNegative={false} decimalScale={2} placeholder="0" />
            <FormDatePicker fullWidth required control={form.control} name="date" label={t("form.date")} className="w-full" />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <p className="text-xs text-muted-foreground">{t("fin.vehicle_expenses.kassa_hint")}</p>
            <Button type="submit" loading={post.isPending || patch.isPending}>
                {t("actions.save")}
            </Button>
        </form>
    )
}
