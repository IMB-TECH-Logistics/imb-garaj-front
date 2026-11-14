import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { FormSelect } from "@/components/form/select"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
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
import { BANK_TRANSACTION, type BankEditRow } from "./types"

export const BANK_INCOME = "checkout/bank/income"
export const BANK_INCOME_MODAL = "bank-income"
const SELECT_BORDER = "border border-input shadow-sm"

export type IncomeType = "bank_reys" | "bank_kontragent" | "bank_boshqa"

export const useIncomeTypeOptions = () => {
    const { t } = useTranslation()
    return useMemo(
        () => [
            { id: "bank_reys", name: t("bank_page.income_type_reys") },
            { id: "bank_kontragent", name: t("bank_page.income_type_kontragent") },
            { id: "bank_boshqa", name: t("bank_page.income_type_other") },
        ],
        [t],
    )
}

type FormValues = {
    amount: string | number | ""
    date: Date | string | null
    income_type: IncomeType
    kontragent: number | null
    source: string
    comment: string
}

const emptyValues = (): FormValues => ({
    amount: "",
    date: new Date(),
    income_type: "bank_reys",
    kontragent: null,
    source: "",
    comment: "",
})

const fromRow = (r: BankEditRow): FormValues => ({
    amount: Number(r.amount),
    date: new Date(r.created),
    income_type: (r.income_type as IncomeType) || "bank_boshqa",
    kontragent: r.kontragent?.id ?? null,
    source: r.income_type === "bank_boshqa" ? r.note || "" : "",
    comment: r.comment || "",
})

const BankIncomeModal = ({ refetchKeys, edit }: { refetchKeys: string[]; edit?: BankEditRow | null }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(BANK_INCOME_MODAL)
    const form = useForm<FormValues>({ defaultValues: emptyValues() })
    const { control, handleSubmit, reset, watch } = form
    const incomeType = watch("income_type")
    const typeOptions = useIncomeTypeOptions()
    const { data: kontragents } = useKontragents(undefined, isOpen && incomeType === "bank_kontragent")

    useEffect(() => {
        reset(isOpen && edit ? fromRow(edit) : emptyValues())
    }, [isOpen, edit, reset])

    const onDone = () => {
        refetchKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("kontragent") })
        closeModal()
    }
    const { mutate: patch, isPending: isPatching } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            onDone()
        },
        meta: { skipGlobalError: true },
    })
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("bank_page.income_added"))
            onDone()
        },
        meta: { skipGlobalError: true },
    })

    const onSubmit = (values: FormValues) => {
        const body = {
            amount: Number(values.amount),
            date: values.date ? format(new Date(values.date), "yyyy-MM-dd") : null,
            income_type: values.income_type,
            kontragent: values.income_type === "bank_kontragent" ? values.kontragent : null,
            source: values.income_type === "bank_boshqa" ? values.source || null : null,
            comment: values.comment || null,
        }
        const opts = { onError: (e: unknown) => handleFormError(e, form) }
        if (edit) patch(`${BANK_TRANSACTION}/${edit.id}`, body, opts)
        else mutate(BANK_INCOME, body, opts)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormSelect
                required
                control={control}
                label={t("bank_page.income_type")}
                name="income_type"
                options={typeOptions}
                valueKey="id"
                labelKey="name"
                className={SELECT_BORDER}
            />
            {incomeType === "bank_kontragent" && (
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
            {incomeType === "bank_boshqa" && (
                <FormInput
                    name="source"
                    label={t("bank_page.income_source")}
                    placeholder={t("bank_page.income_source_hint")}
                    methods={form}
                />
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
                <Button className="min-w-32" type="submit" loading={isPending || isPatching}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default BankIncomeModal
