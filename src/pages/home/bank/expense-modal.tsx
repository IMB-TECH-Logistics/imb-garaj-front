import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { FormSelect } from "@/components/form/select"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { isWithinMoneyLimit } from "@/lib/money-limit"
import { handleFormError } from "@/lib/show-form-errors"
import { useKontragents } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const BANK_EXPENSE = "checkout/bank/expense"
export const BANK_EXPENSE_MODAL = "bank-expense"
const SELECT_BORDER = "border border-input shadow-sm"

export type ExpenseType = "bank_zapravka" | "bank_kontr_out" | "bank_xizmat" | "bank_kassaga" | "bank_xarajat"

export const useExpenseTypeOptions = () => {
    const { t } = useTranslation()
    return useMemo(
        () => [
            { id: "bank_zapravka", name: t("bank_page.expense_type_station") },
            { id: "bank_kontr_out", name: t("bank_page.expense_type_kontragent") },
            { id: "bank_xizmat", name: t("bank_page.expense_type_fee") },
            { id: "bank_kassaga", name: t("bank_page.expense_type_kassa") },
            { id: "bank_xarajat", name: t("bank_page.expense_type_other") },
        ],
        [t],
    )
}

type FormValues = {
    expense_type: ExpenseType
    petrol_station: number | null
    kontragent: number | null
    category: number | null
    source: string
    amount: string | number | ""
    date: Date | string | null
    comment: string
}

const emptyValues = (): FormValues => ({
    expense_type: "bank_zapravka",
    petrol_station: null,
    kontragent: null,
    category: null,
    source: "",
    amount: "",
    date: new Date(),
    comment: "",
})

const BankExpenseModal = ({ refetchKeys }: { refetchKeys: string[] }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(BANK_EXPENSE_MODAL)
    const form = useForm<FormValues>({ defaultValues: emptyValues() })
    const { control, handleSubmit, reset, watch } = form
    const type = watch("expense_type")
    const typeOptions = useExpenseTypeOptions()

    const { data: stations } = useGet<ListResponse<{ id: number; name: string }>>(SETTINGS_PETROL_STATIONS, {
        params: { is_cash: false, page_size: 1000 },
        enabled: isOpen && type === "bank_zapravka",
    })
    const { data: kontragents } = useKontragents(undefined, isOpen && type === "bank_kontr_out")
    const { data: categories } = useGet<{ id: number; name: string }[]>("checkout/kassa-v2/expense-categories", {
        enabled: isOpen && type === "bank_xarajat",
    })

    useEffect(() => {
        if (!isOpen) reset(emptyValues())
    }, [isOpen, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("bank_page.expense_added"))
            refetchKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
            queryClient.invalidateQueries({
                predicate: (q) => {
                    const key = String(q.queryKey[0])
                    return key.includes("petrol-stations") || key.startsWith("kontragent") || key.startsWith("checkout/kassa")
                },
            })
            closeModal()
        },
        meta: { skipGlobalError: true },
    })

    const onSubmit = (v: FormValues) => {
        mutate(
            BANK_EXPENSE,
            {
                expense_type: v.expense_type,
                amount: Number(v.amount),
                date: v.date ? format(new Date(v.date), "yyyy-MM-dd") : null,
                petrol_station: v.expense_type === "bank_zapravka" ? v.petrol_station : null,
                kontragent: v.expense_type === "bank_kontr_out" ? v.kontragent : null,
                category: v.expense_type === "bank_xarajat" ? v.category : null,
                source: v.expense_type === "bank_xarajat" || v.expense_type === "bank_xizmat" ? v.source || null : null,
                comment: v.comment || null,
            },
            { onError: (e: unknown) => handleFormError(e, form) },
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormSelect
                required
                control={control}
                label={t("bank_page.expense_type")}
                name="expense_type"
                options={typeOptions}
                valueKey="id"
                labelKey="name"
                className={SELECT_BORDER}
            />
            {type === "bank_zapravka" && (
                <FormSelect
                    required
                    control={control}
                    label={t("bank_page.station")}
                    name="petrol_station"
                    options={stations?.results ?? []}
                    valueKey="id"
                    labelKey="name"
                    className={SELECT_BORDER}
                />
            )}
            {type === "bank_kontr_out" && (
                <FormSelect
                    required
                    control={control}
                    label={t("bank_page.income_type_kontragent")}
                    name="kontragent"
                    options={kontragents ?? []}
                    valueKey="id"
                    labelKey="name"
                    className={SELECT_BORDER}
                />
            )}
            {type === "bank_xarajat" && (
                <FormSelect
                    control={control}
                    label={t("bank_page.expense_category")}
                    name="category"
                    options={categories ?? []}
                    valueKey="id"
                    labelKey="name"
                    className={SELECT_BORDER}
                />
            )}
            {(type === "bank_xarajat" || type === "bank_xizmat") && (
                <FormInput
                    name="source"
                    label={t("bank_page.expense_to")}
                    placeholder={t("bank_page.expense_to_hint")}
                    methods={form}
                />
            )}
            {type === "bank_kassaga" && (
                <p className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {t("bank_page.expense_kassa_hint")}
                </p>
            )}
            <FormNumberInput
                required
                control={control}
                label={t("form.amount")}
                name="amount"
                placeholder={`${t("form.example")}: 1 000 000`}
                thousandSeparator=" "
                decimalScale={2}
                allowNegative={false}
                registerOptions={{
                    validate: (v) =>
                        Number(v) > 0 ?
                            isWithinMoneyLimit(v) || t("validation.max_amount")
                        :   t("kassa.amount_gt_zero"),
                }}
            />
            <FormDatePicker
                fullWidth
                label={t("form.date")}
                control={control}
                name="date"
                placeholder={t("form.select_date")}
            />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button className="min-w-32" type="submit" variant="destructive" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default BankExpenseModal
