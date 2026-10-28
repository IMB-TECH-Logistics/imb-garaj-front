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
import { formatMoney, formatMoneyText } from "@/lib/format-money"
import { KV2_REQUESTS, WAREHOUSES } from "@/pages/home/kassa/v2/api"
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
    paid_now?: number | ""
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

const MAX_QTY = 1_000_000
const MAX_PRICE = 100_000_000_000

const LINE_GRID = "grid grid-cols-[28px_minmax(0,1fr)_110px_160px_150px_36px] items-center gap-2"

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
        <div className="rounded-lg border bg-card px-2 py-2 flex flex-col gap-2">
            <div className={LINE_GRID}>
                <span className="text-xs text-muted-foreground text-center tabular-nums">{index + 1}</span>
                <div className="min-w-0 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                        <FormCombobox
                            required
                            name={`lines.${index}.product`}
                            placeholder={t("wh.receipt.choose_from_catalog")}
                            control={control}
                            options={products}
                            valueKey="id"
                            labelKey="name"
                            addButtonProps={used ? { disabled: true } : undefined}
                        />
                    </div>
                    {serialized && <Badge className="shrink-0">{t("wh.serialized_yes")}</Badge>}
                </div>
                <FormNumberInput
                    required
                    name={`lines.${index}.quantity`}
                    placeholder={unit || t("form.quantity")}
                    control={control}
                    allowNegative={false}
                    decimalScale={serialized ? 0 : 2}
                    isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= MAX_QTY}
                    disabled={fixedQty}
                />
                <FormNumberInput
                    required
                    name={`lines.${index}.unit_price`}
                    placeholder={t("form.unit_price")}
                    control={control}
                    allowNegative={false}
                    decimalScale={2}
                    thousandSeparator=" "
                    isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= MAX_PRICE}
                    disabled={used}
                />
                <span className="text-sm font-medium tabular-nums text-right truncate min-w-0" title={formatMoneyText(sum)}>
                    {formatMoneyText(sum)}
                </span>
                <div className="flex justify-end">{remove}</div>
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
    const pendingSupplier = useRef<{ supplier: number | null; date: string; amount: number; paid: number; comment: string; products: string } | null>(null)
    const kassaRequest = usePost({
        onSuccess: () => toast.success(t("wh.receipt.kassa_request_sent")),
        onError: () => toast.error(t("wh.receipt.kassa_request_failed")),
    })

    const form = useForm<FormValues>({
        defaultValues: { date: todayISO(), comment: "", lines: [], supplier: "", paid_now: "" },
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

    const paidNowRaw = useWatch({ control, name: "paid_now" })
    const paidNow = Math.min(Number(paidNowRaw === "" || paidNowRaw === undefined ? total : paidNowRaw) || 0, total)
    const debtLeft = Math.max(total - paidNow, 0)

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
                if (pending.supplier) {
                    addSupplierTx({ supplier_id: pending.supplier, date: pending.date, dir: "in", amount: pending.amount, comment: pending.comment })
                    if (pending.paid > 0) {
                        addSupplierTx({ supplier_id: pending.supplier, date: pending.date, dir: "out", amount: pending.paid, comment: t("wh.receipt.paid_via_kassa") })
                    }
                }
                if (pending.paid > 0) {
                    const supplierName = suppliers.find((x) => x.id === pending.supplier)?.name
                    kassaRequest.mutate(KV2_REQUESTS, {
                        kind: "garaj_xarajat",
                        amount: pending.paid,
                        comment: [t("wh.receipt.kassa_request_comment"), supplierName, pending.comment].filter(Boolean).join(" · "),
                        expense_type: "ombor",
                        warehouse: WAREHOUSES[0],
                        product: pending.products,
                    })
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
        const paid = Math.min(Number(values.paid_now === "" ? total : values.paid_now) || 0, total)
        if (!receiptId && paid < total && !values.supplier) {
            setServerError(t("wh.receipt.err_debt_needs_supplier"))
            return
        }
        pendingSupplier.current =
            !receiptId ?
                {
                    supplier: values.supplier ? Number(values.supplier) : null,
                    date: values.date,
                    amount: total,
                    paid,
                    comment: values.comment.trim(),
                    products: values.lines
                        .map((l) => products.find((x) => x.id === Number(l.product))?.name)
                        .filter(Boolean)
                        .join(", "),
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

                    {!!fields.length && (
                        <div className={`${LINE_GRID} px-2 text-xs text-muted-foreground`}>
                            <span className="text-center">№</span>
                            <span>{t("wh.product")}</span>
                            <span>{t("form.quantity")}</span>
                            <span>{t("form.unit_price")}</span>
                            <span className="text-right">{t("page.total")}</span>
                            <span />
                        </div>
                    )}
                    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar-x">
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
                    </div>

                    <FormTextarea
                        name="comment"
                        label={t("form.comment")}
                        methods={form}
                    />
                </div>
            </section>

            {!receiptId ?
                <section className="rounded-lg border bg-muted/20 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t("page.total")}</span>
                        <span className="h-10 flex items-center gap-1 font-semibold tabular-nums">{formatMoney(total)} {t("page.som")}</span>
                    </div>
                    <FormNumberInput
                        name="paid_now"
                        label={t("wh.receipt.paid_now")}
                        placeholder={formatMoneyText(total)}
                        control={control}
                        allowNegative={false}
                        decimalScale={0}
                        thousandSeparator=" "
                    />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t("wh.receipt.left_as_debt")}</span>
                        <span className={`h-10 flex items-center gap-1 font-semibold tabular-nums ${debtLeft > 0 ? "text-amber-600" : ""}`}>
                            {formatMoney(debtLeft)} {t("page.som")}
                        </span>
                    </div>
                    <p className="sm:col-span-3 text-xs text-muted-foreground">{t("wh.receipt.paid_now_hint")}</p>
                </section>
            :   <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between gap-3">
                    <div className="font-medium">{t("page.total")}</div>
                    <div className="text-right">
                        <div className="font-medium tabular-nums">
                            {formatMoney(total)} {t("page.som")}
                        </div>
                    </div>
                </div>
            }
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
                size="max-w-5xl"
            >
                {receiptId > 0 && <ReceiptForm key={receiptId} receiptId={receiptId} />}
            </Modal>
        )
    }
    return (
        <Modal
            modalKey={RECEIPT_MODAL_KEY}
            title={t("wh.receipt.title")}
            size="max-w-5xl"
        >
            <ReceiptForm />
        </Modal>
    )
}

export default ReceiptModal
