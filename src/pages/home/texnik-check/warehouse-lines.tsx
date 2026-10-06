import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { Fragment, useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { fmtDate, isPast, toNumber } from "../ombor/utils"
import type { VehicleExpenseRow } from "./cols"
import type { ExpenseForm, LineValues, SerialLot, SerialProduct } from "./types"
import type { LineCheckResult } from "./use-line-check"

const GRID =
    "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto] gap-2 items-center"

type ProductOption = {
    id: number
    name: string
    unit_name: string
    is_serialized: boolean
}

type LotOption = {
    id: number
    name: string
    disabled: boolean
    factory_number: string | null
    condition: SerialLot["condition"] | null
}

type Props = {
    form: UseFormReturn<ExpenseForm>
    current: VehicleExpenseRow | null
    check: LineCheckResult
}

const WarehouseLines = ({ form, current, check }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { control } = form
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items",
    })
    const lines = useWatch({ control, name: "items" })

    const { data } = useGet<ListResponse<SerialProduct>>(WAREHOUSE_PRODUCTS, {
        params: { in_stock: 1, page_size: 1000 },
    })

    const products = useMemo<ProductOption[]>(() => {
        const map = new Map<number, ProductOption>()
        data?.results.forEach((p) =>
            map.set(p.id, {
                id: p.id,
                name: p.name,
                unit_name: p.unit_name,
                is_serialized: !!p.is_serialized,
            }),
        )
        current?.items?.forEach((item) => {
            if (!map.has(item.product)) {
                map.set(item.product, {
                    id: item.product,
                    name: item.product_name,
                    unit_name: "",
                    is_serialized: !!item.factory_number,
                })
            }
        })
        return [...map.values()]
    }, [data, current])

    const changeProduct = (index: number, value: unknown) => {
        const next = value ? Number(value) : null
        if (next === lines[index]?.product) return
        update(index, {
            product: next,
            lot: null,
            quantity:
                products.find((p) => p.id === next)?.is_serialized ?
                    "1"
                :   (lines[index]?.quantity ?? ""),
            odometer: "",
        })
    }

    const changeLot = (index: number, value: unknown) => {
        update(index, {
            ...lines[index],
            lot: value ? Number(value) : null,
        })
    }

    return (
        <fieldset className="flex flex-col w-full col-span-2">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5">
                <span className="font-medium select-none text-sm">
                    {t("wh.tech.block")}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        icon={<Plus size={16} />}
                        onClick={() =>
                            append({
                                product: null,
                                lot: null,
                                quantity: "",
                                odometer: "",
                                                })
                        }
                    >
                        {t("wh.tech.add_product")}
                    </Button>
                </div>
            </div>

            <div className="rounded-lg bg-muted/60 p-3 text-sm flex flex-col gap-3">
                {fields.length ?
                    <>
                        <div
                            className={cn(
                                GRID,
                                "max-sm:hidden text-xs text-muted-foreground px-0.5",
                            )}
                        >
                            <span>{t("wh.product")}</span>
                            <span>
                                {lines.some((l) => !check.isAuto(l)) ?
                                    t("wh.factory_number")
                                :   ""}
                            </span>
                            <span>{t("form.quantity")}</span>
                            <span className="w-8" />
                        </div>
                        {fields.map((field, index) => {
                            const line = lines[index]
                            if (!line) return null
                            const c = check.checks[index]
                            const product = products.find(
                                (p) => p.id === line.product,
                            )
                            const unit = product?.unit_name ?? ""
                            const lots =
                                line.product ? check.lotsOf(line.product) : []
                            const serialized = !!product?.is_serialized
                            const auto = !serialized
                            const lotOptions: LotOption[] = (lots ?? []).map((l) => ({
                                id: l.id,
                                factory_number: l.factory_number,
                                condition: l.condition,
                                disabled:
                                    isPast(l.expires_at) ||
                                    check.availableOf(l) <= 0 ||
                                    (serialized &&
                                        lines.some(
                                            (o, i) =>
                                                i !== index && o.lot === l.id,
                                        )),
                                name: serialized ?
                                    (l.factory_number ?? l.lot_number)
                                :   [
                                    l.lot_number,
                                    l.expires_at ? fmtDate(l.expires_at) : "",
                                    `${check.availableOf(l)} ${unit}`.trim(),
                                ]
                                    .filter(Boolean)
                                    .join(" · "),
                            }))

                            return (
                                <Fragment key={field.id}>
                                    <div className={GRID}>
                                        <Combobox
                                            options={products}
                                            value={line.product}
                                            setValue={(v) =>
                                                changeProduct(index, v)
                                            }
                                            label={t("wh.tech.choose_product")}
                                            valueKey="id"
                                            labelKey="name"
                                            isError={c?.product}
                                            className={cn(
                                                "min-w-0",
                                                auto && "sm:col-span-2",
                                            )}
                                        />
                                        {!auto && <Combobox
                                            options={lotOptions}
                                            value={line.lot}
                                            setValue={(v) =>
                                                changeLot(index, v)
                                            }
                                            label={
                                                serialized ?
                                                    t("texnik.serial.choose_piece")
                                                :   t("wh.tech.choose_lot")
                                            }
                                            contentClassName={
                                                serialized ? "min-w-72" : undefined
                                            }
                                            renderOption={
                                                serialized ?
                                                    (o: LotOption) => (
                                                        <span className="flex items-center gap-2 min-w-0">
                                                            <span className="font-mono truncate">
                                                                {o.name}
                                                            </span>
                                                            {o.condition && (
                                                                <Badge
                                                                    variant={
                                                                        o.condition === "new" ?
                                                                            "default"
                                                                        :   "secondary"
                                                                    }
                                                                >
                                                                    {t(`texnik.serial.${o.condition}`)}
                                                                </Badge>
                                                            )}
                                                        </span>
                                                    )
                                                :   undefined
                                            }
                                            valueKey="id"
                                            labelKey="name"
                                            disabledKey="disabled"
                                            isError={c?.lot}
                                            className="min-w-0"
                                            addButtonProps={{
                                                disabled: !line.product,
                                            }}
                                        />}
                                        {serialized ?
                                            <FormNumberInput
                                                key="odometer"
                                                hideError
                                                control={control}
                                                name={`items.${index}.odometer`}
                                                allowNegative={false}
                                                decimalScale={0}
                                                placeholder={t("texnik.serial.odometer")}
                                            />
                                        :   <FormNumberInput
                                                key="quantity"
                                                hideError
                                                control={control}
                                                name={`items.${index}.quantity`}
                                                allowNegative={false}
                                                decimalScale={2}
                                                suffix={
                                                    unit ? ` ${unit}` : undefined
                                                }
                                                placeholder="0"
                                                className={
                                                    c?.quantity || c?.stock ?
                                                        "!border-destructive"
                                                    :   undefined
                                                }
                                            />
                                        }
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 shrink-0 !text-red-500"
                                            title={t("actions.delete")}
                                            icon={<Trash2 size={16} />}
                                            onClick={() => remove(index)}
                                        />
                                    </div>
                                    {c?.stock && (
                                        <div className={cn(GRID, "-mt-1.5")}>
                                            <span className="max-sm:hidden" />
                                            <span className="max-sm:hidden" />
                                            <span className="px-0.5 text-xs text-destructive">
                                                {t("wh.tech.err_stock_line")}
                                            </span>
                                        </div>
                                    )}
                                </Fragment>
                            )
                        })}
                    </>
                :   <div className="text-muted-foreground text-center py-2">
                        {t("wh.receipt.no_lines")}
                    </div>
                }
            </div>
        </fieldset>
    )
}

export default WarehouseLines
