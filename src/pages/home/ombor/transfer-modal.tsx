import Modal from "@/components/custom/modal"
import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    WAREHOUSE_OTHER_STOCK,
    WAREHOUSE_TRANSFERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
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
import type { WhOtherStock } from "./types"
import {
    centsToNumber,
    collectErrors,
    lineAmountCents,
    toNumber,
    todayISO,
} from "./utils"

export const TRANSFER_MODAL_KEY = "wh-transfer"

type LineValues = {
    product: number | ""
    quantity: string
}

type FormValues = {
    from_tenant: number | ""
    date: string
    comment: string
    lines: LineValues[]
}

type TenantOption = { id: number; name: string }

const emptyLine = (): LineValues => ({ product: "", quantity: "1" })

type CardProps = {
    index: number
    form: UseFormReturn<FormValues>
    stock: WhOtherStock[]
    onRemove: () => void
}

const TransferLineCard = ({ index, form, stock, onRemove }: CardProps) => {
    const { t } = useTranslation()
    const { control } = form
    const line = useWatch({ control, name: `lines.${index}` })
    const row = stock.find((s) => s.product === Number(line?.product))

    if (!line) return null

    const max = row ? toNumber(row.qty_left) : undefined
    const sum = centsToNumber(
        lineAmountCents(line.quantity, row?.avg_price ?? 0),
    )

    return (
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                        {index + 1}
                    </span>
                    <Package size={16} className="text-primary shrink-0" />
                    <span className="font-medium">
                        {row?.product_name ?? (
                            <span className="text-muted-foreground">
                                {t("wh.receipt.no_product")}
                            </span>
                        )}
                    </span>
                    {row?.is_serialized && (
                        <Badge>{t("wh.serialized_yes")}</Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                        {formatMoney(sum)} {t("page.som")}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 !text-red-500"
                        title={t("actions.delete")}
                        icon={<Trash2 size={16} />}
                        onClick={onRemove}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <FormCombobox
                    required
                    name={`lines.${index}.product`}
                    label={t("wh.product")}
                    placeholder={t("wh.receipt.choose_from_catalog")}
                    control={control}
                    options={stock}
                    valueKey="product"
                    labelKey="product_name"
                />
                <FormNumberInput
                    required
                    name={`lines.${index}.quantity`}
                    label={
                        row ?
                            `${t("form.quantity")} (${row.unit_name})`
                        :   t("form.quantity")
                    }
                    control={control}
                    allowNegative={false}
                    decimalScale={row?.is_serialized ? 0 : 2}
                    isAllowed={(v) =>
                        max === undefined || (v.floatValue ?? 0) <= max
                    }
                />
            </div>
            {row && (
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    <span>
                        {t("wh.transfer.available")}: {formatMoney(row.qty_left)}{" "}
                        {row.unit_name}
                    </span>
                    <span>
                        {t("form.unit_price")}: {formatMoney(row.avg_price ?? 0)}{" "}
                        {t("page.som")}
                    </span>
                </div>
            )}
        </div>
    )
}

type FormProps = {
    fromTenant?: number
    tenants: TenantOption[]
}

const TransferForm = ({ fromTenant, tenants }: FormProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(TRANSFER_MODAL_KEY)
    const [serverError, setServerError] = useState("")

    const form = useForm<FormValues>({
        defaultValues: {
            from_tenant: fromTenant ?? "",
            date: todayISO(),
            comment: "",
            lines: [],
        },
    })
    const { control, handleSubmit } = form
    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "lines",
    })

    const source = useWatch({ control, name: "from_tenant" })
    const lines = useWatch({ control, name: "lines" })

    const { data: stockData } = useGet<ListResponse<WhOtherStock>>(
        WAREHOUSE_OTHER_STOCK,
        { params: { tenant: source, page_size: 500 }, enabled: !!source },
    )
    const stock = useMemo(
        () => (source ? (stockData?.results ?? []) : []),
        [stockData, source],
    )

    useEffect(() => {
        if (fromTenant && !fields.length) append(emptyLine())
    }, [])

    useEffect(() => {
        if (fields.length) replace([])
    }, [source])

    const stockOf = (id: number | "") =>
        stock.find((s) => s.product === Number(id))

    const total = centsToNumber(
        lines.reduce(
            (sum, line) =>
                sum +
                lineAmountCents(
                    line.quantity,
                    stockOf(line.product)?.avg_price ?? 0,
                ),
            0n,
        ),
    )

    const validationError = (() => {
        if (!source) return t("wh.transfer.err_tenant")
        if (!lines.length) return t("wh.receipt.err_empty")
        if (lines.some((l) => !l.product)) return t("wh.receipt.err_product")
        if (lines.some((l) => !(toNumber(l.quantity) > 0))) {
            return t("wh.receipt.err_quantity")
        }
        if (
            lines.some((l) => {
                const row = stockOf(l.product)
                return !!row && toNumber(l.quantity) > toNumber(row.qty_left)
            })
        ) {
            return t("wh.transfer.err_max")
        }
        if (
            lines.some(
                (l) =>
                    !!stockOf(l.product)?.is_serialized &&
                    !Number.isInteger(toNumber(l.quantity)),
            )
        ) {
            return t("wh.transfer.err_integer")
        }
        if (new Set(lines.map((l) => l.product)).size !== lines.length) {
            return t("wh.transfer.err_dup")
        }
        return ""
    })()

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("wh.transfer.saved"))
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
    })

    const onSubmit = (values: FormValues) => {
        setServerError("")
        mutate(WAREHOUSE_TRANSFERS, {
            from_tenant: Number(values.from_tenant),
            date: values.date,
            comment: values.comment.trim() || undefined,
            lines: values.lines.map((line) => ({
                product: Number(line.product),
                quantity:
                    stockOf(line.product)?.is_serialized ?
                        Math.trunc(toNumber(line.quantity))
                    :   line.quantity,
            })),
        })
    }

    const error = validationError || serverError

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 p-0.5"
        >
            <section className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
                <FormCombobox
                    required
                    name="from_tenant"
                    label={t("wh.transfer.from")}
                    control={control}
                    options={tenants}
                    valueKey="id"
                    labelKey="name"
                    addButtonProps={
                        fromTenant ? { disabled: true } : undefined
                    }
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-sm">{t("wh.products")}</span>
                    <Button
                        type="button"
                        size="sm"
                        icon={<Plus size={16} />}
                        disabled={!source}
                        onClick={() => {
                            setServerError("")
                            append(emptyLine())
                        }}
                    >
                        {t("wh.receipt.add_manual")}
                    </Button>
                </div>
                <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto no-scrollbar-x">
                    {fields.length ?
                        fields.map((field, index) => (
                            <TransferLineCard
                                key={field.id}
                                index={index}
                                form={form}
                                stock={stock}
                                onRemove={() => remove(index)}
                            />
                        ))
                    :   <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Package size={28} className="text-primary" />
                            <div>{t("wh.receipt.no_lines")}</div>
                        </div>
                    }
                </div>
            </section>

            <section className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
                <FormDatePicker
                    required
                    fullWidth
                    name="date"
                    label={t("form.date")}
                    control={control}
                />
                <FormTextarea
                    name="comment"
                    label={t("form.comment")}
                    methods={form}
                />
            </section>

            <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between gap-3">
                <div className="font-medium">{t("page.total")}</div>
                <div className="font-medium tabular-nums">
                    {formatMoney(total)} {t("page.som")}
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
                    {t("wh.transfer.submit")}
                </Button>
            </div>
        </form>
    )
}

const TransferModal = ({ fromTenant, tenants }: FormProps) => {
    const { t } = useTranslation()
    return (
        <Modal
            modalKey={TRANSFER_MODAL_KEY}
            title={t("wh.transfer.title")}
            size="max-w-2xl"
        >
            <TransferForm
                key={fromTenant ?? 0}
                fromTenant={fromTenant}
                tenants={tenants}
            />
        </Modal>
    )
}

export default TransferModal
