import Modal from "@/components/custom/modal"
import { cn } from "@/lib/utils"
import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { parseGs1 } from "@/components/scanner/gs1"
import { gs1ErrorText } from "@/components/scanner/gs1-message"
import ScannerDialog from "@/components/scanner/scanner-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WAREHOUSE_RECEIPTS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import {
    CircleAlert,
    Package,
    Plus,
    QrCode,
    ScanLine,
    Trash2,
} from "lucide-react"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { WhProduct } from "./types"
import { useCatalog } from "./use-catalog"
import { collectErrors, fmtDate, isPast, toNumber, todayISO } from "./utils"

export const RECEIPT_MODAL_KEY = "wh-receipt"
export const RECEIPT_SCAN_KEY = "wh-receipt-scan"

type LineValues = {
    source: "qr" | "manual"
    product: number | ""
    lot_number: string
    raw_code: string
    gtin: string
    serial: string
    produced_at: string
    expires_at: string
    quantity: string
    unit_price: string
    factory_numbers: string[]
}

type FormValues = {
    date: string
    comment: string
    lines: LineValues[]
}

const emptyLine = (): LineValues => ({
    source: "manual",
    product: "",
    lot_number: "",
    raw_code: "",
    gtin: "",
    serial: "",
    produced_at: "",
    expires_at: "",
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
    )

const KeyValue = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground whitespace-nowrap">
            {label}
        </div>
        <div className="font-mono text-[13px] whitespace-nowrap flex items-center gap-1.5">
            {children}
        </div>
    </div>
)

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
    const isQr = line?.source === "qr"
    const expired = isQr && isPast(line?.expires_at)
    const gtinUnknown = isQr && !products.some((p) => p.gtin === line?.gtin)

    useEffect(() => {
        if (product && !line?.unit_price && product.avg_price !== null) {
            setValue(
                `lines.${index}.unit_price`,
                String(toNumber(product.avg_price)),
            )
        }
    }, [product?.id])

    const remove = (
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

    if (expired) {
        return (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 flex gap-3 items-start">
                <CircleAlert
                    size={18}
                    className="text-red-500 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-500">
                        {t("wh.receipt.expired_title")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {product?.name ? `${product.name} · ` : ""}
                        {t("wh.lot").toLowerCase()}{" "}
                        <span className="font-mono">{line.lot_number || "—"}</span>{" "}
                        · {t("wh.expiry").toLowerCase()} {fmtDate(line.expires_at)}{" "}
                        · GTIN <span className="font-mono">{line.gtin}</span>
                    </div>
                </div>
                {remove}
            </div>
        )
    }

    const unit = product?.unit_name ?? ""
    const serialized = !!product?.is_serialized
    const count = serialized ? serialCount(line.quantity) : 0
    const sum = toNumber(line.quantity) * toNumber(line.unit_price)

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
                    {product && (
                        <Badge variant="secondary">{product.unit_name}</Badge>
                    )}
                    {serialized && (
                        <Badge>{t("wh.serialized_yes")}</Badge>
                    )}
                    {gtinUnknown && (
                        <Badge variant="orange">
                            {t("wh.receipt.gtin_unknown")}
                        </Badge>
                    )}
                    {isQr ?
                        <Badge className="gap-1">
                            <QrCode size={12} />
                            QR
                        </Badge>
                    :   <Badge variant="secondary">{t("wh.manual")}</Badge>}
                </div>
                {remove}
            </div>

            {isQr && (
                <div className="rounded-md bg-muted/60 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                        <ScanLine size={14} className="text-primary" />
                        {t("wh.receipt.from_qr")}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <KeyValue label="GTIN (01)">{line.gtin}</KeyValue>
                        <KeyValue label={`${t("wh.lot")} (10)`}>
                            {line.lot_number || "—"}
                        </KeyValue>
                        <KeyValue label={`${t("wh.produced")} (11)`}>
                            {line.produced_at ? fmtDate(line.produced_at) : "—"}
                        </KeyValue>
                        <KeyValue label={`${t("wh.expiry")} (17)`}>
                            {line.expires_at ?
                                fmtDate(line.expires_at)
                            :   <span className="text-orange-500 font-sans">
                                    {t("wh.receipt.none")}
                                </span>
                            }
                        </KeyValue>
                        <KeyValue label={`${t("wh.serial")} (21)`}>
                            {line.serial || "—"}
                        </KeyValue>
                    </div>
                </div>
            )}

            {gtinUnknown && (
                <FormCombobox
                    required
                    name={`lines.${index}.product`}
                    label={t("wh.product")}
                    placeholder={t("wh.receipt.choose_from_catalog")}
                    control={control}
                    options={products}
                    valueKey="id"
                    labelKey="name"
                />
            )}

            <div
                className={cn(
                    "grid grid-cols-1 gap-3",
                    isQr ? "sm:grid-cols-3" : "sm:grid-cols-[minmax(0,1fr)_130px_160px_auto]",
                )}
            >
                {!isQr && (
                    <FormCombobox
                        required
                        name={`lines.${index}.product`}
                        label={t("wh.product")}
                        placeholder={t("wh.receipt.choose_from_catalog")}
                        control={control}
                        options={products}
                        valueKey="id"
                        labelKey="name"
                    />
                )}
                <FormNumberInput
                    required
                    name={`lines.${index}.quantity`}
                    label={t("form.quantity")}
                    control={control}
                    allowNegative={false}
                    decimalScale={serialized ? 0 : 2}
                    suffix={unit ? ` ${unit}` : undefined}
                />
                <FormNumberInput
                    required
                    name={`lines.${index}.unit_price`}
                    label={t("form.unit_price")}
                    control={control}
                    allowNegative={false}
                    decimalScale={2}
                />
                <div className="flex flex-col justify-end sm:text-right pb-2 whitespace-nowrap">
                    <div className="text-xs text-muted-foreground">
                        {t("form.amount")}
                    </div>
                    <div className="font-medium tabular-nums">
                        {formatMoney(sum)} {t("page.som")}
                    </div>
                </div>
            </div>

            {serialized && count > 0 && (
                <div className="rounded-md bg-muted/60 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                        {t("wh.receipt.factory_numbers")}
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

const ReceiptForm = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(RECEIPT_MODAL_KEY)
    const { openModal: openScan } = useModal(RECEIPT_SCAN_KEY)
    const { data: catalog } = useCatalog()
    const products = useMemo(() => catalog?.results ?? [], [catalog])
    const [serverError, setServerError] = useState("")

    const form = useForm<FormValues>({
        defaultValues: { date: todayISO(), comment: "", lines: [] },
    })
    const { control, handleSubmit } = form
    const { fields, append, remove } = useFieldArray({ control, name: "lines" })

    const lines = useWatch({ control, name: "lines" })

    const total = lines.reduce(
        (sum, line) =>
            isPast(line.expires_at) && line.source === "qr" ?
                sum
            :   sum + toNumber(line.quantity) * toNumber(line.unit_price),
        0,
    )

    const serializedOf = (id: number | "") =>
        !!products.find((p) => p.id === Number(id))?.is_serialized

    const validationError = (() => {
        if (!lines.length) return t("wh.receipt.err_empty")
        if (lines.some((l) => l.source === "qr" && isPast(l.expires_at))) {
            return t("wh.receipt.err_expired")
        }
        if (lines.some((l) => !l.product)) return t("wh.receipt.err_product")
        if (lines.some((l) => !(toNumber(l.quantity) > 0))) {
            return t("wh.receipt.err_quantity")
        }
        const numbers = lines.flatMap((l) =>
            serializedOf(l.product) ? cleanNumbers(l) : [],
        )
        if (numbers.some((n) => !n)) return t("wh.receipt.err_factory_empty")
        if (new Set(numbers).size !== numbers.length) {
            return t("wh.receipt.err_factory_dup")
        }
        if (lines.some((l) => l.unit_price === "")) {
            return t("wh.receipt.err_price")
        }
        return ""
    })()

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("wh.receipt.saved"))
            closeModal()
            queryClient.invalidateQueries({
                predicate: (query) =>
                    String(query.queryKey[0]).startsWith("warehouse/"),
            })
        },
        onError: (error) => {
            const messages = collectErrors(error?.response?.data)
            setServerError(messages.join(" · ") || t("messages.error"))
        },
    })

    const handleScan = (code: string) => {
        const parsed = parseGs1(code)
        if (!parsed.gtin) {
            return parsed.errors.length ?
                    gs1ErrorText(t, parsed.errors[0])
                :   t("wh.scan.unreadable")
        }
        if (parsed.errors.length) return gs1ErrorText(t, parsed.errors[0])

        const product = products.find((p) => p.gtin === parsed.gtin)
        setServerError("")
        append({
            source: "qr",
            product: product?.id ?? "",
            lot_number: parsed.lot ?? "",
            raw_code: code,
            gtin: parsed.gtin,
            serial: parsed.serial ?? "",
            produced_at: parsed.producedAt ?? "",
            expires_at: parsed.expiresAt ?? "",
            quantity: "1",
            factory_numbers: [],
            unit_price:
                product?.avg_price ? String(toNumber(product.avg_price)) : "",
        })
        return null
    }

    const onSubmit = (values: FormValues) => {
        setServerError("")
        mutate(WAREHOUSE_RECEIPTS, {
            date: values.date,
            comment: values.comment.trim() || undefined,
            lines: values.lines.map((line) => ({
                product: Number(line.product),
                quantity:
                    serializedOf(line.product) ?
                        serialCount(line.quantity)
                    :   line.quantity,
                unit_price: line.unit_price,
                lot_number: line.lot_number || undefined,
                ...(serializedOf(line.product) && {
                    factory_numbers: cleanNumbers(line),
                }),
                ...(line.source === "qr" && {
                    raw_code: line.raw_code,
                    gtin: line.gtin,
                    serial: line.serial || undefined,
                    produced_at: line.produced_at || undefined,
                }),
            })),
        })
    }

    const error = validationError || serverError

    return (
        <>
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 p-0.5"
        >
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Mahsulotlar</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-sm">{t("wh.products")}</span>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                icon={<Plus size={16} />}
                                onClick={() => {
                                    setServerError("")
                                    append(emptyLine())
                                }}
                            >
                                {t("wh.receipt.add_manual")}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                icon={<ScanLine size={16} />}
                                onClick={openScan}
                            >
                                {t("wh.receipt.scan_qr")}
                            </Button>
                        </div>
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
                                <QrCode size={28} className="text-primary" />
                                <div>{t("wh.receipt.no_lines")}</div>
                            </div>
                        }
                    </div>
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Sana va izoh</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormDatePicker
                            required
                            fullWidth
                            name="date"
                            label={t("form.date")}
                            control={control}
                        />
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
                    <div className="text-xs text-muted-foreground">
                        {t("form.amount")}
                    </div>
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
                    disabled={!!validationError}
                    loading={isPending}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>

        <ScannerDialog
            modalKey={RECEIPT_SCAN_KEY}
            title={t("wh.receipt.scan_title")}
            onScan={handleScan}
        />
        </>
    )
}

const ReceiptModal = () => {
    const { t } = useTranslation()
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
