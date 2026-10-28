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
import { CONTRAGENT_TYPES, ContragentTxDir, ContragentTxKind, ContragentType, useContragentStore } from "./store"

export const CONTRAGENT_CREATE = "contragent-create"
export const CONTRAGENT_TX = "contragent-tx"

const MAX_AMOUNT = 10_000_000_000

export const AddContragentForm = ({ onCreated }: { onCreated?: (id: number) => void }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(CONTRAGENT_CREATE)
    const add = useContragentStore((s) => s.addContragent)
    const form = useForm<{ name: string; phone: string; type: ContragentType | ""; comment: string }>({
        defaultValues: { name: "", phone: "", type: "", comment: "" },
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                const id = add({ name: v.name.trim(), phone: v.phone.trim(), type: v.type as ContragentType, comment: v.comment.trim() })
                toast.success(t("messages.success_add"))
                form.reset()
                closeModal()
                onCreated?.(id)
            })}
        >
            <FormInput required name="name" label={t("contragent.fields.name")} methods={form} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <FormInput name="phone" label={t("contragent.fields.phone")} placeholder="+998" methods={form} />
            </div>
            <FormTextarea name="comment" label={t("contragent.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit">{t("actions.save")}</Button>
            </div>
        </form>
    )
}

export const ContragentTxForm = ({ contragentId, dir }: { contragentId: number; dir: ContragentTxDir }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(CONTRAGENT_TX)
    const addTx = useContragentStore((s) => s.addTx)
    const form = useForm<{ date: string; kind: ContragentTxKind; amount: number | ""; comment: string }>({
        defaultValues: { date: format(new Date(), "yyyy-MM-dd"), kind: "cash", amount: "", comment: "" },
    })
    const kinds: ContragentTxKind[] = ["cash", "goods", "service", "trip"]

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                addTx({ contragent_id: contragentId, date: v.date, dir, kind: v.kind, amount: Number(v.amount), comment: v.comment.trim() })
                toast.success(t("messages.success_add"))
                form.reset()
                closeModal()
            })}
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
                <Button className="min-w-32" type="submit">{t("actions.save")}</Button>
            </div>
        </form>
    )
}
