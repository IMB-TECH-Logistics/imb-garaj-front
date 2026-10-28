import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { InvestmentKind, LoanRow, useInvestorsStore, usd } from "./store"

const today = () => format(new Date(), "yyyy-MM-dd")

const SubmitRow = () => {
    const { t } = useTranslation()
    return (
        <div className="flex justify-end mt-1">
            <Button className="min-w-32" type="submit">
                {t("actions.save")}
            </Button>
        </div>
    )
}

const AmountField = ({ control, label, max }: { control: any; label: string; max?: number }) => {
    const { t } = useTranslation()
    return (
        <FormNumberInput
            required
            control={control}
            name="amount"
            label={label}
            placeholder={`${t("form.example")}: 10 000`}
            thousandSeparator=" "
            decimalScale={0}
            allowNegative={false}
            registerOptions={{
                validate: (v: unknown) => {
                    const n = Number(v)
                    if (!(n > 0)) return t("investors.errors.gt_zero")
                    if (max !== undefined && n > max) return t("investors.errors.max_left", { amount: usd(max) })
                    return true
                },
            }}
        />
    )
}

type InvestorForm = { name: string; phone: string; comment: string }

export const AddInvestorForm = ({ onCreated }: { onCreated?: (id: number) => void }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal("investor-create")
    const addInvestor = useInvestorsStore((s) => s.addInvestor)
    const form = useForm<InvestorForm>({ defaultValues: { name: "", phone: "", comment: "" } })

    const onSubmit = (v: InvestorForm) => {
        const id = addInvestor(v)
        toast.success(t("messages.success_add"))
        form.reset()
        closeModal()
        onCreated?.(id)
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormInput required name="name" label={t("investors.fields.name")} methods={form} />
            <FormInput name="phone" label={t("investors.fields.phone")} placeholder="+998" methods={form} />
            <FormTextarea name="comment" label={t("investors.fields.comment")} methods={form} rows={3} />
            <SubmitRow />
        </form>
    )
}

type InvestmentForm = { date: string; kind: InvestmentKind; vehicle: string; amount: number | ""; comment: string }

export const AddInvestmentForm = ({ investorId }: { investorId: number }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal("investment-create")
    const addInvestment = useInvestorsStore((s) => s.addInvestment)
    const form = useForm<InvestmentForm>({
        defaultValues: { date: today(), kind: "cash", vehicle: "", amount: "", comment: "" },
    })
    const kind = form.watch("kind")

    const kinds = [
        { id: "cash", name: t("investors.kind.cash") },
        { id: "vehicle", name: t("investors.kind.vehicle") },
    ]

    const onSubmit = (v: InvestmentForm) => {
        addInvestment({
            investor_id: investorId,
            date: v.date,
            kind: v.kind,
            vehicle: v.kind === "vehicle" ? v.vehicle : "",
            amount: Number(v.amount),
            comment: v.comment,
        })
        toast.success(t("messages.success_add"))
        form.reset()
        closeModal()
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("investors.fields.date")} />
                <FormCombobox
                    required
                    isClearIcon={false}
                    isSearch={false}
                    control={form.control}
                    name="kind"
                    label={t("investors.fields.kind")}
                    options={kinds}
                    labelKey="name"
                    valueKey="id"
                />
            </div>
            {kind === "vehicle" && (
                <FormInput required name="vehicle" label={t("investors.fields.vehicle")} placeholder="01 A 123 BC" methods={form} />
            )}
            <AmountField control={form.control} label={t("investors.fields.amount_usd")} />
            <FormTextarea name="comment" label={t("investors.fields.comment")} methods={form} rows={3} />
            <SubmitRow />
        </form>
    )
}

type LoanForm = { date: string; due_date: string | null; amount: number | ""; comment: string }

export const AddLoanForm = ({ investorId }: { investorId: number }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal("loan-create")
    const addLoan = useInvestorsStore((s) => s.addLoan)
    const form = useForm<LoanForm>({ defaultValues: { date: today(), due_date: null, amount: "", comment: "" } })

    const onSubmit = (v: LoanForm) => {
        addLoan({
            investor_id: investorId,
            date: v.date,
            due_date: v.due_date || null,
            amount: Number(v.amount),
            comment: v.comment,
        })
        toast.success(t("messages.success_add"))
        form.reset()
        closeModal()
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("investors.fields.loan_date")} />
                <FormDatePicker fullWidth control={form.control} name="due_date" label={t("investors.fields.due_date")} />
            </div>
            <AmountField control={form.control} label={t("investors.fields.amount_usd")} />
            <FormTextarea name="comment" label={t("investors.fields.comment")} methods={form} rows={3} />
            <SubmitRow />
        </form>
    )
}

type RepayForm = { date: string; amount: number | ""; comment: string }

export const RepayLoanForm = ({ loan }: { loan: LoanRow }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal("loan-repay")
    const addRepayment = useInvestorsStore((s) => s.addRepayment)
    const form = useForm<RepayForm>({ defaultValues: { date: today(), amount: loan.left, comment: "" } })

    const onSubmit = (v: RepayForm) => {
        addRepayment({ loan_id: loan.id, date: v.date, amount: Number(v.amount), comment: v.comment })
        toast.success(t("messages.success_add"))
        form.reset()
        closeModal()
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{t("investors.loans.amount")}</span>
                    <span className="font-medium tabular-nums">{usd(loan.amount)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{t("investors.loans.paid")}</span>
                    <span className="font-medium tabular-nums">{usd(loan.paid)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{t("investors.loans.left")}</span>
                    <span className="font-semibold tabular-nums">{usd(loan.left)}</span>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("investors.fields.repay_date")} />
                <AmountField control={form.control} label={t("investors.fields.amount_usd")} max={loan.left} />
            </div>
            <FormTextarea name="comment" label={t("investors.fields.comment")} methods={form} rows={3} />
            <SubmitRow />
        </form>
    )
}
