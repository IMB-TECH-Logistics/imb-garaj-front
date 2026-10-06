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
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { Package, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { WhProduct } from "./types"
import { useCatalog } from "./use-catalog"
import { collectErrors, toNumber, todayISO } from "./utils"

export const RECEIPT_MODAL_KEY = "wh-receipt"

type LineValues = {
    product: number | ""
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
                />
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
        (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unit_price),
        0,
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
                ...(serializedOf(line.product) && {
                    factory_numbers: cleanNumbers(line),
                }),
            })),
        })
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
