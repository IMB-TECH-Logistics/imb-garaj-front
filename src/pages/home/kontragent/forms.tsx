import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { CONTRAGENT_TYPES, ContragentType, EntryDir, EntryKind, KONTRAGENT, Kontragent, kontragentUrl, onApiError, som, useRefreshFinance } from "./api"

export const CONTRAGENT_CREATE = "contragent-create"
export const CONTRAGENT_EDIT = "contragent-edit"
export const CONTRAGENT_DELETE = "contragent-delete"
export const CONTRAGENT_TX = "contragent-tx"
export const CONTRAGENT_CASH = "contragent-cash"

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
    const form = useForm<{ name: string; phone: string; type: ContragentType | ""; comment: string }>({
        defaultValues: initial ?
            { name: initial.name, phone: initial.phone, type: initial.type, comment: initial.comment }
        :   { name: "", phone: "", type: fixedType ?? "", comment: "" },
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
                const payload = { name: v.name.trim(), phone: v.phone.trim(), type: fixedType ?? v.type, comment: v.comment.trim() }
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
            </div>
            <FormTextarea name="comment" label={t("contragent.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending || updating}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}

export const ContragentTxForm = ({ contragentId, dir }: { contragentId: number; dir: EntryDir }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(CONTRAGENT_TX)
    const refresh = useRefreshFinance()
    const form = useForm<{ date: string; kind: EntryKind; amount: number | ""; comment: string }>({
        defaultValues: { date: today(), kind: "goods", amount: "", comment: "" },
    })
    const kinds: EntryKind[] = ["goods", "service", "trip"]
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_add"))
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
                mutate(kontragentUrl(contragentId, "ledger"), { date: v.date, dir, kind: v.kind, amount: Number(v.amount), comment: v.comment.trim() }),
            )}
        >
            <p className="text-sm text-muted-foreground">{t(dir === "in" ? "contragent.tx.in_hint" : "contragent.tx.out_hint")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("contragent.fields.date")} />
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
                mutate(kontragentUrl(contragentId, "cash"), { dir, amount: Number(v.amount), date: v.date, comment: v.comment.trim() }),
            )}
        >
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
