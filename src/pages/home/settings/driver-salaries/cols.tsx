import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { NumericFormat } from "react-number-format"
import {
    useDirectionColumns,
    type DirectionRow,
} from "../route-configs/cols"

export type SalaryFilterSourceKey =
    | "regions"
    | "clients"
    | "cargo_types"
    | "payment_types"

export const SALARY_FILTER_COLUMNS: Array<{
    value: string
    label: string
    source?: SalaryFilterSourceKey
}> = [
    { value: "owner_code", label: "Firma kodi" },
    { value: "load", label: "Yuklash manzili", source: "regions" },
    { value: "unload", label: "Yuk tushirish manzili", source: "regions" },
    { value: "owner", label: "Yuk egasi", source: "clients" },
    { value: "cargo_type", label: "Yuk turi", source: "cargo_types" },
    { value: "payment_type", label: "To'lov turi", source: "payment_types" },
    { value: "driver_salary_amount", label: "Beriladigan oylik (UZS)" },
]

export type SalaryFilterSources = Partial<
    Record<SalaryFilterSourceKey, { id: number | string; name: string }[]>
>

const stripDecZeros = (raw: string): string => {
    if (!raw.includes(".")) return raw
    const [intPart, decPart] = raw.split(".")
    const trimmed = (decPart ?? "").replace(/0+$/, "")
    return trimmed ? `${intPart}.${trimmed}` : intPart
}

const cellValue = (row: DirectionRow, column: string): string => {
    if (column === "driver_salary_amount") {
        const raw = row.driver_salary_amount
        if (raw == null || raw === "") return "0"
        return stripDecZeros(String(raw))
    }
    return String((row as any)[column] ?? "")
}

export type SalaryFilters = Record<string, string[]>
export type SalaryFilterOption = { value: string; label: string }

export const filterSalaryRows = (
    rows: DirectionRow[],
    filters: SalaryFilters,
): DirectionRow[] => {
    const active = Object.entries(filters).filter(
        ([, vs]) => Array.isArray(vs) && vs.length > 0,
    )
    if (active.length === 0) return rows
    return rows.filter((row) =>
        active.every(([col, vs]) => vs.includes(cellValue(row, col))),
    )
}

const formatPriceLabel = (raw: string): string => {
    const [intPart, decPart] = stripDecZeros(raw).split(".")
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    return decPart ? `${grouped}.${decPart}` : grouped
}

export const buildSalaryFilterOptions = (
    rows: DirectionRow[],
    sources: SalaryFilterSources = {},
): Record<string, SalaryFilterOption[]> => {
    const out: Record<string, SalaryFilterOption[]> = {}
    for (const col of SALARY_FILTER_COLUMNS) {
        const sourceItems = col.source ? sources[col.source] : undefined
        let items: SalaryFilterOption[]
        if (sourceItems) {
            items = sourceItems
                .filter((s) => s.name)
                .map((s) => ({ value: String(s.id), label: s.name }))
        } else {
            const set = new Set<string>()
            for (const r of rows) {
                const v = cellValue(r, col.value)
                if (v) set.add(v)
            }
            items = Array.from(set).map((v) => ({
                value: v,
                label:
                    col.value === "driver_salary_amount"
                        ? formatPriceLabel(v)
                        : v,
            }))
        }
        items.sort((a, b) =>
            col.value === "driver_salary_amount"
                ? Number(a.value) - Number(b.value)
                : a.label.localeCompare(b.label, "uz"),
        )
        out[col.value] = items
    }
    return out
}

type EditableOpts = {
    editable: boolean
    disabled?: boolean
    getEdit: (id: number) => string | undefined
    onChange: (id: number, value: string) => void
}

const InlinePriceCell = ({
    row,
    opts,
}: {
    row: DirectionRow
    opts: EditableOpts
}) => {
    const original = stripDecZeros(String(row.driver_salary_amount ?? "0"))
    const editVal = opts.getEdit(row.id)
    const value = editVal ?? original
    const dirty = editVal !== undefined && editVal !== original
    return (
        <NumericFormat
            thousandSeparator=" "
            value={value}
            disabled={opts.disabled}
            onValueChange={(v) => opts.onChange(row.id, v.value)}
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "h-8 w-full rounded-md px-2 text-sm outline-none",
                "bg-background/70 dark:bg-background/40",
                "border border-input/70 hover:border-input",
                "focus:border-ring focus:ring-1 focus:ring-ring focus:bg-background",
                dirty &&
                    "border-orange-500 bg-orange-500/10 focus:border-orange-500 focus:ring-orange-500",
                opts.disabled &&
                    "opacity-60 cursor-not-allowed hover:border-input/70",
            )}
        />
    )
}

export const useSalaryColumns = (opts?: EditableOpts) => {
    const base = useDirectionColumns()
    return useMemo<ColumnDef<DirectionRow>[]>(
        () =>
            base
                .filter((c) => (c as any).accessorKey !== "currency")
                .map((c) => {
                    if ((c as any).accessorKey !== "current_price") return c
                    const patched: ColumnDef<DirectionRow> = {
                        ...c,
                        header: "Beriladigan oylik (UZS)",
                    }
                    if (opts?.editable) {
                        patched.cell = ({ row }) => (
                            <InlinePriceCell row={row.original} opts={opts} />
                        )
                    } else {
                        patched.cell = ({ row }) => (
                            <span>
                                {formatPriceLabel(
                                    row.original.driver_salary_amount ?? "0",
                                )}
                            </span>
                        )
                    }
                    return patched
                }),
        [base, opts?.editable, opts?.disabled, opts?.getEdit, opts?.onChange],
    )
}
