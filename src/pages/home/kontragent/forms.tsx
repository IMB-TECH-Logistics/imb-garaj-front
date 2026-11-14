import { useState } from "react"
import { FormCombobox } from "@/components/form/combobox"
import PaymentMethodToggle, { type PaymentMethod, useBankEnabled } from "@/components/custom/payment-method"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { format } from "date-fns"
import { Info } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { CONTRAGENT_TYPES, ContragentType, EntryDir, EntryKind, KONTRAGENT, Kontragent, LedgerRow, kontragentUrl, num, onApiError, som, useRefreshFinance } from "./api"

export const CONTRAGENT_CREATE = "contragent-create"
export const CONTRAGENT_EDIT = "contragent-edit"
export const CONTRAGENT_DELETE = "contragent-delete"
export const CONTRAGENT_TX = "contragent-tx"
export const CONTRAGENT_CASH = "contragent-cash"
export const CONTRAGENT_ENTRY_EDIT = "contragent-entry-edit"

const MAX_AMOUNT = 10_000_000_000
const today = () => format(new Date(), "yyyy-MM-dd")

export const AddContragentForm = ({
    onCreated,
    fixedType,
    modalKey = CONTRAGENT_CREATE,
    initial,
}: {
    onCreated?: (id: number) => void
    fixedType?: ContragentType
    modalKey?: string
    initial?: Kontragent
}) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const refresh = useRefreshFinance()
    const form = useForm<{ name: string; phone: string; inn: string; type: ContragentType | ""; comment: string }>({
        defaultValues: initial ?
            { name: initial.name, phone: initial.phone, inn: initial.inn ?? "", type: initial.type, comment: initial.comment }
        :   { name: "", phone: "", inn: "", type: fixedType ?? "", comment: "" },
    })
    const { mutate: update, isPending: updating } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            closeModal()
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })
    const { mutate, isPending } = usePost({
        onSuccess: (data: { id: number }) => {
            toast.success(t("messages.success_add"))
            form.reset()
            closeModal()
            refresh()
            onCreated?.(data.id)
        },
        onError: onApiError(t("messages.error")),
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                const payload = { name: v.name.trim(), phone: v.phone.trim(), inn: v.inn.replace(/\s/g, ""), type: fixedType ?? v.type, comment: v.comment.trim() }
                if (initial) update(kontragentUrl(initial.id), payload)
                else mutate(KONTRAGENT, payload)
            })}
        >
            <FormInput required name="name" label={t("contragent.fields.name")} methods={form} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!fixedType && (
                    <FormCombobox
                        required
                        isSearch={false}
                        isClearIcon={false}
                        control={form.control}
                        name="type"
                        label={t("contragent.fields.type")}
                        options={CONTRAGENT_TYPES.map((type) => ({ id: type, name: t(`contragent.type.${type}`) }))}
                        valueKey="id"
                        labelKey="name"
                    />
                )}
                <FormInput name="phone" label={t("contragent.fields.phone")} placeholder="+998" methods={form} />
                <FormInput name="inn" label={t("contragent.fields.inn")} placeholder="123456789" inputMode="numeric" maxLength={14} methods={form} />
            </div>
            <FormTextarea name="comment" label={t("contragent.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending || updating}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}

type DealKind = "cash" | "goods" | "service" | "trip"
const DEAL_KINDS: DealKind[] = ["cash", "goods", "service", "trip"]

export const ContragentTxForm = ({ contragentId, dir, max }: { contragentId: number; dir: EntryDir; max?: number }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(CONTRAGENT_TX)
    const refresh = useRefreshFinance()
    const form = useForm<{ date: string; amount: number | ""; comment: string }>({
        defaultValues: { date: today(), amount: "", comment: "" },
    })
    const [kind, setKind] = useState<DealKind>("cash")
    const isCash = kind === "cash"
    const limit = isCash && dir === "out" ? max : undefined
    const bankEnabled = useBankEnabled()
    const [via, setVia] = useState<PaymentMethod>("kassa")
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t(!isCash ? "messages.success_add" : dir === "in" ? "fin.kv2.cash_in_done" : "fin.kv2.cash_out_done"))
            form.reset()
            closeModal()
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                const base = { dir, amount: Number(v.amount), date: v.date, comment: v.comment.trim() }
                if (isCash) mutate(kontragentUrl(contragentId, "cash"), { ...base, ...(bankEnabled ? { via } : {}) })
                else mutate(kontragentUrl(contragentId, "ledger"), { ...base, kind })
            })}
        >
            <fieldset className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                    {t("contragent.fields.kind")}
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" tabIndex={-1} className="text-muted-foreground hover:text-foreground">
                                    <Info className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-72 font-normal">
                                {t(isCash ? (dir === "in" ? "contragent.cash.in_hint" : "contragent.cash.out_hint") : dir === "in" ? "contragent.tx.in_hint" : "contragent.tx.out_hint")}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEAL_KINDS.map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setKind(k)}
                            className={cn(
                                "flex h-10 items-center justify-center rounded-md border border-input text-sm shadow-sm transition-colors",
                                kind === k ? "border-primary bg-primary/10 text-primary font-medium" : "bg-background hover:bg-muted",
                            )}
                        >
                            {t(`contragent.kind.${k}`)}
                        </button>
                    ))}
                </div>
            </fieldset>
            {isCash && bankEnabled && <PaymentMethodToggle value={via} onChange={setVia} />}
            {limit !== undefined && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("investors.list.loan_left")}</span>
                    <span className="font-semibold tabular-nums">{som(limit)}</span>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("contragent.fields.date")} />
                <FormNumberInput
                    required
                    control={form.control}
                    name="amount"
                    label={t("contragent.fields.amount")}
                    thousandSeparator=" "
                    decimalScale={0}
                    allowNegative={false}
                    isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= MAX_AMOUNT}
                    registerOptions={{
                        validate: (v: unknown) =>
                            Number(v) <= 0 ? t("investors.errors.gt_zero")
                            : limit !== undefined && Number(v) > limit ? `${t("investors.list.loan_left")}: ${som(limit)}`
                            : true,
                    }}
                />
            </div>
            <FormTextarea name="comment" label={t("contragent.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}

export const CashForm = ({
    contragentId,
    dir,
    max,
    modalKey = CONTRAGENT_CASH,
}: {
    contragentId: number
    dir: EntryDir
    max?: number
    modalKey?: string
}) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const refresh = useRefreshFinance()
    const form = useForm<{ date: string; amount: number | ""; comment: string }>({
        defaultValues: { date: today(), amount: dir === "out" && max ? max : "", comment: "" },
    })
    const bankEnabled = useBankEnabled()
    const [via, setVia] = useState<PaymentMethod>("kassa")
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t(dir === "in" ? "fin.kv2.cash_in_done" : "fin.kv2.cash_out_done"))
            form.reset()
            closeModal()
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) =>
                mutate(kontragentUrl(contragentId, "cash"), {
                    dir,
                    amount: Number(v.amount),
                    date: v.date,
                    comment: v.comment.trim(),
                    ...(bankEnabled ? { via } : {}),
                }),
            )}
        >
            {bankEnabled && <PaymentMethodToggle value={via} onChange={setVia} />}
            <p className="text-sm text-muted-foreground">{t(dir === "in" ? "contragent.cash.in_hint" : "contragent.cash.out_hint")}</p>
            {max !== undefined && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("investors.list.loan_left")}</span>
                    <span className="font-semibold tabular-nums">{som(max)}</span>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("contragent.fields.date")} />
                <FormNumberInput
                    required
                    control={form.control}
                    name="amount"
                    label={t("contragent.fields.amount")}
                    thousandSeparator=" "
                    decimalScale={0}
                    allowNegative={false}
                    isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= (max ?? MAX_AMOUNT)}
                    registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("investors.errors.gt_zero") }}
                />
            </div>
            <FormTextarea name="comment" label={t("contragent.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}

export const EntryEditForm = ({ row }: { row: LedgerRow }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(CONTRAGENT_ENTRY_EDIT)
    const refresh = useRefreshFinance()
    const form = useForm<{ date: string; kind: EntryKind; amount: number | ""; comment: string }>({
        defaultValues: { date: row.date.slice(0, 10), kind: row.kind, amount: num(row.amount), comment: row.comment ?? "" },
    })
    const kinds: EntryKind[] = ["goods", "service", "trip"]
    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            closeModal()
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) =>
                mutate(`/kontragent/entries/${row.id}/`, {
                    date: v.date,
                    amount: Number(v.amount),
                    comment: v.comment.trim(),
                    ...(row.is_manual ? { kind: v.kind } : {}),
                }),
            )}
        >
            {!row.is_manual && <p className="text-sm text-muted-foreground">{t("contragent.tx.kassa_edit_hint")}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("contragent.fields.date")} />
                {row.is_manual && (
                    <FormCombobox
                        required
                        isSearch={false}
                        isClearIcon={false}
                        control={form.control}
                        name="kind"
                        label={t("contragent.fields.kind")}
                        options={kinds.map((k) => ({ id: k, name: t(`contragent.kind.${k}`) }))}
                        valueKey="id"
                        labelKey="name"
                    />
                )}
            </div>
            <FormNumberInput
                required
                control={form.control}
                name="amount"
                label={t("contragent.fields.amount")}
                thousandSeparator=" "
                decimalScale={0}
                allowNegative={false}
                isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= MAX_AMOUNT}
                registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("investors.errors.gt_zero") }}
            />
            <FormTextarea name="comment" label={t("contragent.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}
