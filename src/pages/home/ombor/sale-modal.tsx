import Modal from "@/components/custom/modal"
import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoneyText } from "@/lib/format-money"
import { useContragentStore } from "@/pages/home/kontragent/store"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { WhProduct } from "./types"

export const SALE_MODAL_KEY = "wh-sale"

const GRID = "grid grid-cols-[28px_minmax(0,1fr)_120px_160px_150px_36px] items-center gap-2"
const MAX_PRICE = 10_000_000_000

type Line = { product: number | ""; quantity: number | ""; price: number | "" }
type F = { contragent: number | ""; date: string; lines: Line[]; paid_now: number | ""; comment: string }

const SaleForm = () => {
    const { t } = useTranslation()
    const { closeModal } = useModal(SALE_MODAL_KEY)
    const contragents = useContragentStore((s) => s.contragents)
    const addTx = useContragentStore((s) => s.addTx)
    const [error, setError] = useState("")
    const { data } = useGet<ListResponse<WhProduct>>(WAREHOUSE_PRODUCTS, { params: { received: 1, page_size: 1000 } })
    const products = data?.results ?? []

    const form = useForm<F>({
        defaultValues: { contragent: "", date: format(new Date(), "yyyy-MM-dd"), lines: [{ product: "", quantity: 1, price: "" }], paid_now: "", comment: "" },
    })
    const { control } = form
    const { fields, append, remove } = useFieldArray({ control, name: "lines" })
    const lines = useWatch({ control, name: "lines" }) ?? []
    const total = lines.reduce((s, l) => s + (Number(l?.quantity) || 0) * (Number(l?.price) || 0), 0)
    const paidRaw = useWatch({ control, name: "paid_now" })
    const paid = Math.min(Number(paidRaw) || 0, total)
    const debt = Math.max(total - paid, 0)

    const productOf = (id: number | "") => products.find((p) => p.id === Number(id))

    const onSubmit = (v: F) => {
        setError("")
        if (!v.contragent) return setError(t("wh.sale.err_contragent"))
        if (!v.lines.length || v.lines.some((l) => !l.product)) return setError(t("wh.receipt.err_product"))
        if (v.lines.some((l) => !(Number(l.quantity) > 0) || !(Number(l.price) > 0))) return setError(t("wh.sale.err_qty_price"))
        const over = v.lines.find((l) => Number(l.quantity) > Number(productOf(l.product)?.qty_left ?? 0))
        if (over) return setError(t("wh.sale.err_stock", { name: productOf(over.product)?.name }))
        const names = v.lines.map((l) => `${productOf(l.product)?.name} × ${l.quantity}`).join(", ")
        addTx({ contragent_id: Number(v.contragent), date: v.date, dir: "out", kind: "goods", amount: total, comment: [t("wh.sale.tx_comment"), names, v.comment.trim()].filter(Boolean).join(" · ") })
        if (paid > 0) {
            addTx({ contragent_id: Number(v.contragent), date: v.date, dir: "in", kind: "cash", amount: paid, comment: t("wh.sale.paid_comment") })
        }
        toast.success(t("wh.sale.saved"))
        form.reset()
        closeModal()
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 p-0.5">
            <section className="rounded-lg border bg-muted/20 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormCombobox
                    required
                    control={control}
                    name="contragent"
                    label={t("wh.sale.contragent")}
                    options={contragents.map((c) => ({ id: c.id, name: `${c.name} · ${t(`contragent.type.${c.type}`)}` }))}
                    valueKey="id"
                    labelKey="name"
                />
                <FormDatePicker required fullWidth control={control} name="date" label={t("form.date")} />
            </section>

            <section className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{t("wh.products")}</span>
                    <Button type="button" size="sm" icon={<Plus size={16} />} onClick={() => append({ product: "", quantity: 1, price: "" })}>
                        {t("wh.sale.add_line")}
                    </Button>
                </div>
                <div className={`${GRID} px-2 text-xs text-muted-foreground`}>
                    <span className="text-center">№</span>
                    <span>{t("wh.product")}</span>
                    <span>{t("form.quantity")}</span>
                    <span>{t("wh.sale.price")}</span>
                    <span className="text-right">{t("page.total")}</span>
                    <span />
                </div>
                {fields.map((field, index) => {
                    const line = lines[index]
                    const p = productOf(line?.product ?? "")
                    const sum = (Number(line?.quantity) || 0) * (Number(line?.price) || 0)
                    return (
                        <div key={field.id} className={`${GRID} rounded-lg border bg-card px-2 py-2`}>
                            <span className="text-xs text-muted-foreground text-center">{index + 1}</span>
                            <FormCombobox
                                control={control}
                                name={`lines.${index}.product`}
                                placeholder={t("wh.receipt.choose_from_catalog")}
                                options={products.map((x) => ({ id: x.id, name: `${x.name} · ${formatMoneyText(x.qty_left)} ${x.unit_name}` }))}
                                valueKey="id"
                                labelKey="name"
                            />
                            <FormNumberInput
                                control={control}
                                name={`lines.${index}.quantity`}
                                placeholder={p?.unit_name ?? t("form.quantity")}
                                allowNegative={false}
                                decimalScale={2}
                                isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= Number(p?.qty_left ?? Infinity)}
                            />
                            <FormNumberInput
                                control={control}
                                name={`lines.${index}.price`}
                                placeholder={p?.avg_price ? formatMoneyText(p.avg_price) : t("wh.sale.price")}
                                thousandSeparator=" "
                                allowNegative={false}
                                decimalScale={0}
                                isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= MAX_PRICE}
                            />
                            <span className="text-sm font-medium tabular-nums whitespace-nowrap text-right">{formatMoneyText(sum)}</span>
                            <div className="flex justify-end">
                                <Button type="button" variant="ghost" size="icon" className="size-8 !text-red-500" icon={<Trash2 size={16} />} onClick={() => remove(index)} />
                            </div>
                        </div>
                    )
                })}
                <div className="flex items-baseline justify-end gap-2 px-2 pt-2 pr-[52px] border-t">
                    <span className="text-sm text-muted-foreground">{t("page.total")}:</span>
                    <span className="font-semibold tabular-nums whitespace-nowrap">{formatMoneyText(total)} {t("page.som")}</span>
                </div>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <FormNumberInput
                    name="paid_now"
                    label={t("wh.sale.paid_now")}
                    placeholder="0"
                    control={control}
                    allowNegative={false}
                    decimalScale={0}
                    thousandSeparator=" "
                    isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= total}
                />
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">{t("wh.sale.left_as_debt")}</span>
                    <span className={`h-10 flex items-center gap-1 font-semibold tabular-nums ${debt > 0 ? "text-green-600" : ""}`}>
                        {formatMoneyText(debt)} {t("page.som")}
                    </span>
                </div>
                <p className="sm:col-span-2 text-xs text-muted-foreground">{t("wh.sale.hint")}</p>
            </section>

            <FormTextarea name="comment" label={t("form.comment")} methods={form} rows={2} />

            <div className="flex items-center justify-end gap-3">
                {error && <span className="text-xs text-destructive">{error}</span>}
                <Button type="submit" className="min-w-36">{t("wh.sale.submit")}</Button>
            </div>
        </form>
    )
}

const SaleModal = () => {
    const { t } = useTranslation()
    return (
        <Modal modalKey={SALE_MODAL_KEY} title={t("wh.sale.title")} size="max-w-5xl">
            <SaleForm />
        </Modal>
    )
}

export default SaleModal
