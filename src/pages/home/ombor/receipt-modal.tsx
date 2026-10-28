import Modal from "@/components/custom/modal"
import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WAREHOUSE_RECEIPTS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { Package, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useSuppliersStore } from "./suppliers-store"
import type { WhProduct } from "./types"
import { useCatalog } from "./use-catalog"
import {
    centsToNumber,
    collectErrors,
    lineAmountCents,
    toNumber,
    todayISO,
} from "./utils"

export const RECEIPT_MODAL_KEY = "wh-receipt"
export const RECEIPT_EDIT_MODAL_KEY = "wh-receipt-edit"

type LineValues = {
    lot?: number
    used?: boolean
    product: number | ""
    quantity: string
    unit_price: string
    factory_numbers: string[]
}

type FormValues = {
    date: string
    comment: string
    lines: LineValues[]
    supplier?: number | ""
    pay_type?: "cash" | "debt"
}

type ReceiptLot = {
    id: number
    product: number
    unit_price: string
    qty_in: string
    qty_left: string
    factory_number: string | null
    is_used: boolean
}

type ReceiptDetail = {
    id: number
    date: string
    comment: string | null
    lots: ReceiptLot[]
}

const emptyLine = (): LineValues => ({
    product: "",
    quantity: "1",
    unit_price: "",
    factory_numbers: [],
})

const MAX_SERIAL_QTY = 500

const serialCount = (quantity: string) =>
    Math.min(Math.max(Math.trunc(toNumber(quantity)), 0), MAX_SERIAL_QTY)

const cleanNumbers = (line: LineValues) =>
    Array.from({ length: serialCount(line.quantity) }, (_, i) =>
        (line.factory_numbers?.[i] ?? "").trim(),
    ).filter(Boolean)

type CardProps = {
    index: number
    form: UseFormReturn<FormValues>
    products: WhProduct[]
    onRemove: () => void
}

const ReceiptLineCard = ({ index, form, products, onRemove }: CardProps) => {
    const { t } = useTranslation()
    const { control, setValue } = form
    const line = useWatch({ control, name: `lines.${index}` })
    const product = products.find((p) => p.id === Number(line?.product))

    useEffect(() => {
        if (product && !line?.unit_price && product.avg_price !== null) {
            setValue(
                `lines.${index}.unit_price`,
                String(toNumber(product.avg_price)),
            )
        }
    }, [product?.id])

    const used = !!line?.used
    const fixedQty = !!line?.lot && !!line?.factory_numbers?.length
    const remove = used ? null : (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 !text-red-500"
            title={t("actions.delete")}
            icon={<Trash2 size={16} />}
            onClick={onRemove}
        />
    )

    if (!line) return null

    const unit = product?.unit_name ?? ""
    const serialized = !!product?.is_serialized
    const count = serialized ? serialCount(line.quantity) : 0
    const sum = centsToNumber(lineAmountCents(line.quantity, line.unit_price))

    return (
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                        {index + 1}
                    </span>
                    <Package size={16} className="text-primary shrink-0" />
                    <span className="font-medium">
                        {product?.name ?? (
                            <span className="text-muted-foreground">
                                {t("wh.receipt.no_product")}
                            </span>
                        )}
                    </span>
                    {serialized && (
                        <Badge>{t("wh.serialized_yes")}</Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                        {formatMoney(sum)} {t("page.som")}
                    </span>
                    {remove}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_130px_160px]">
                <FormCombobox
                    required
                    name={`lines.${index}.product`}
                    label={t("wh.product")}
                    placeholder={t("wh.receipt.choose_from_catalog")}
                    control={control}
                    options={products}
                    valueKey="id"
                    labelKey="name"
                    addButtonProps={used ? { disabled: true } : undefined}
                />
                <FormNumberInput
                    required
                    name={`lines.${index}.quantity`}
                    label={unit ? `${t("form.quantity")} (${unit})` : t("form.quantity")}
                    control={control}
                    allowNegative={false}
                    decimalScale={serialized ? 0 : 2}
                    disabled={fixedQty}
                />
                <FormNumberInput
                    required
                    name={`lines.${index}.unit_price`}
                    label={t("form.unit_price")}
                    control={control}
                    allowNegative={false}
                    decimalScale={2}
                    disabled={used}
                />
            </div>

            {used && (
                <div className="text-xs text-muted-foreground">
                    {t("wh.receipt.used_line_hint")}
                </div>
            )}

            {serialized && count > 0 && !line.lot && (
                <div className="rounded-md bg-muted/60 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                        {t("wh.receipt.factory_numbers")}
                        <span className="ml-2 font-normal">
                            {t("wh.receipt.factory_auto_hint")}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.from({ length: count }, (_, i) => (
                            <FormInput
                                key={i}
                                name={`lines.${index}.factory_numbers.${i}`}
                                placeholder={`${t("wh.factory_number")} ${i + 1}`}
                                className="font-mono"
                                methods={form}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

const lotToLine = (lot: ReceiptLot): LineValues => ({
    lot: lot.id,
    used: lot.is_used,
    product: lot.product,
    quantity: String(toNumber(lot.qty_in)),
    unit_price: String(toNumber(lot.unit_price)),
    factory_numbers: lot.factory_number ? [lot.factory_number] : [],
})

const ReceiptForm = ({ receiptId }: { receiptId?: number }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(
        receiptId ? RECEIPT_EDIT_MODAL_KEY : RECEIPT_MODAL_KEY,
    )
    const { data: catalog } = useCatalog()
    const products = useMemo(() => catalog?.results ?? [], [catalog])
    const [serverError, setServerError] = useState("")
    const suppliers = useSuppliersStore((s) => s.suppliers)
    const addSupplierTx = useSuppliersStore((s) => s.addTx)
    const pendingSupplier = useRef<{ supplier: number; pay_type: "cash" | "debt"; date: string; amount: number; comment: string } | null>(null)

    const form = useForm<FormValues>({
        defaultValues: { date: todayISO(), comment: "", lines: [], supplier: "", pay_type: "debt" },
    })
    const { control, handleSubmit } = form
    const { fields, append, remove } = useFieldArray({ control, name: "lines" })

    const { data: detail } = useGet<ReceiptDetail>(
        `${WAREHOUSE_RECEIPTS}/${receiptId}`,
        { enabled: !!receiptId },
    )
    useEffect(() => {
        if (!detail) return
        form.reset({
            date: detail.date,
            comment: detail.comment ?? "",
            lines: detail.lots.map(lotToLine),
        })
    }, [detail])

    const lines = useWatch({ control, name: "lines" })

    const total = centsToNumber(
        lines.reduce(
            (sum, line) => sum + lineAmountCents(line.quantity, line.unit_price),
            0n,
        ),
    )

    const serializedOf = (id: number | "") =>
        !!products.find((p) => p.id === Number(id))?.is_serialized

    const validationError = (() => {
        if (!lines.length) return t("wh.receipt.err_empty")
        if (lines.some((l) => !l.product)) return t("wh.receipt.err_product")
        if (lines.some((l) => !(toNumber(l.quantity) > 0))) {
            return t("wh.receipt.err_quantity")
        }
        const numbers = lines.flatMap((l) =>
            serializedOf(l.product) && !l.lot ? cleanNumbers(l) : [],
        )

        if (new Set(numbers).size !== numbers.length) {
            return t("wh.receipt.err_factory_dup")
        }
        if (lines.some((l) => l.unit_price === "")) {
            return t("wh.receipt.err_price")
        }
        return ""
    })()

    const onSaved = {
        onSuccess: () => {
            const pending = pendingSupplier.current
            if (pending) {
                addSupplierTx({ supplier_id: pending.supplier, date: pending.date, dir: "in", amount: pending.amount, comment: pending.comment })
                if (pending.pay_type === "cash") {
                    addSupplierTx({ supplier_id: pending.supplier, date: pending.date, dir: "out", amount: pending.amount, comment: "" })
                }
                pendingSupplier.current = null
            }
            toast.success(t("wh.receipt.saved"))
            closeModal()
            queryClient.invalidateQueries({
                predicate: (query) =>
                    String(query.queryKey[0]).startsWith("warehouse/"),
            })
        },
        onError: (error: any) => {
            const messages = collectErrors(error?.response?.data)
            setServerError(messages.join(" · ") || t("messages.error"))
        },
    }
    const { mutate, isPending } = usePost(onSaved)
    const patch = usePatch(onSaved)

    const onSubmit = (values: FormValues) => {
        setServerError("")
        pendingSupplier.current =
            !receiptId && values.supplier ?
                {
                    supplier: Number(values.supplier),
                    pay_type: values.pay_type ?? "debt",
                    date: values.date,
                    amount: total,
                    comment: values.comment.trim(),
                }
            :   null
        const payload = {
            date: values.date,
            comment: values.comment.trim() || (receiptId ? null : undefined),
            lines: values.lines.map((line) => ({
                ...(line.lot && { lot: line.lot }),
                product: Number(line.product),
                quantity:
                    serializedOf(line.product) ?
                        serialCount(line.quantity)
                    :   line.quantity,
                unit_price: line.unit_price,
                ...(serializedOf(line.product) &&
                    !line.lot && {
                        factory_numbers: cleanNumbers(line),
                    }),
            })),
        }
        if (receiptId) patch.mutate(`${WAREHOUSE_RECEIPTS}/${receiptId}`, payload)
        else mutate(WAREHOUSE_RECEIPTS, payload)
    }

    const error = validationError || serverError

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 p-0.5"
        >
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-sm">{t("wh.products")}</span>
                        <Button
                            type="button"
                            size="sm"
                            icon={<Plus size={16} />}
                            onClick={() => {
                                setServerError("")
                                append(emptyLine())
                            }}
                        >
                            {t("wh.receipt.add_manual")}
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto no-scrollbar-x">
                        {fields.length ?
                            fields.map((field, index) => (
                                <ReceiptLineCard
                                    key={field.id}
                                    index={index}
                                    form={form}
                                    products={products}
                                    onRemove={() => remove(index)}
                                />
                            ))
                        :   <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                <Package size={28} className="text-primary" />
                                <div>{t("wh.receipt.no_lines")}</div>
                            </div>
                        }
                    </div>
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormDatePicker
                            required
                            fullWidth
                            name="date"
                            label={t("form.date")}
                            control={control}
                        />
                        {!receiptId && (
                            <FormCombobox
                                control={control}
                                name="supplier"
                                label={t("suppliers.fields.supplier")}
                                options={suppliers}
                                labelKey="name"
                                valueKey="id"
                            />
                        )}
                        {!receiptId && !!form.watch("supplier") && (
                            <FormCombobox
                                required
                                isClearIcon={false}
                                isSearch={false}
                                control={control}
                                name="pay_type"
                                label={t("suppliers.fields.pay_type")}
                                options={[
                                    { id: "debt", name: t("suppliers.pay.debt") },
                                    { id: "cash", name: t("suppliers.pay.cash") },
                                ]}
                                labelKey="name"
                                valueKey="id"
                            />
                        )}
                    </div>

                    <FormTextarea
                        name="comment"
                        label={t("form.comment")}
                        methods={form}
                    />
                </div>
            </section>

            <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between gap-3">
                <div className="font-medium">{t("page.total")}</div>
                <div className="text-right">
                    <div className="font-medium tabular-nums">
                        {formatMoney(total)} {t("page.som")}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
                {error && (
                    <span className="text-xs text-destructive">{error}</span>
                )}
                <Button
                    type="submit"
                    className="min-w-36"
                    disabled={!!validationError || (!!receiptId && !detail)}
                    loading={isPending || patch.isPending}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

const ReceiptModal = ({ receiptId }: { receiptId?: number }) => {
    const { t } = useTranslation()
    if (receiptId !== undefined) {
        return (
            <Modal
                modalKey={RECEIPT_EDIT_MODAL_KEY}
                title={t("wh.receipt.edit_title", { id: receiptId })}
                size="max-w-2xl"
            >
                {receiptId > 0 && <ReceiptForm key={receiptId} receiptId={receiptId} />}
            </Modal>
        )
    }
    return (
        <Modal
            modalKey={RECEIPT_MODAL_KEY}
            title={t("wh.receipt.title")}
            size="max-w-2xl"
        >
            <ReceiptForm />
        </Modal>
    )
}

export default ReceiptModal
