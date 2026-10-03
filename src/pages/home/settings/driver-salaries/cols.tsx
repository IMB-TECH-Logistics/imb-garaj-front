import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
    formatDate,
    useDirectionColumns,
    type DirectionRow,
    type DriverSalaryHistoryItem,
} from "../route-configs/cols"

export const localTodayIso = () => format(new Date(), "yyyy-MM-dd")

export const upcomingSalary = (
    history?: DriverSalaryHistoryItem[],
): DriverSalaryHistoryItem | undefined => {
    const today = localTodayIso()
    return [...(history ?? [])]
        .filter((h) => h.valid_from > today)
        .sort((a, b) => a.valid_from.localeCompare(b.valid_from))[0]
}

export type SalaryFilterSourceKey = "regions" | "cargo_types" | "salary_amounts"

const HIDDEN_SALARY_COLUMNS = new Set([
    "owner_code",
    "owner_name",
    "load_place_display",
    "unload_place_display",
    "distributor_name",
    "payment_type_name",
    "currency",
])

export const SALARY_FILTER_COLUMNS: Array<{
    value: string
    label: string
    source?: SalaryFilterSourceKey
}> = [
    { value: "load", label: "Yuklash manzili", source: "regions" },
    { value: "unload", label: "Yuk tushirish manzili", source: "regions" },
    { value: "cargo_type", label: "Yuk turi", source: "cargo_types" },
]

export type SalaryFilterSources = Partial<
    Record<"regions" | "cargo_types", { id: number | string; name: string }[]>
> &
    Partial<Record<"salary_amounts", string[]>>

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

export const formatPriceLabel = (raw: string): string => {
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
        if (sourceItems?.length && typeof sourceItems[0] === "string") {
            items = (sourceItems as string[]).map((raw) => {
                const value = stripDecZeros(String(raw))
                return {
                    value,
                    label:
                        col.value === "driver_salary_amount"
                            ? formatPriceLabel(value)
                            : value,
                }
            })
        } else if (sourceItems?.length) {
            items = (sourceItems as { id: number | string; name: string }[])
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

const SalaryAmountCell = ({ row }: { row: DirectionRow }) => {
    const { t } = useTranslation()
    const next = upcomingSalary(row.driver_salary_history)
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span>{formatPriceLabel(row.driver_salary_amount ?? "0")}</span>
            {row.driver_salary_amount == null && (
                <Badge variant="destructive" className="whitespace-nowrap">
                    {t("form.tariff_no")}
                </Badge>
            )}
            {next && (
                <Badge variant="outline" className="whitespace-nowrap">
                    {t("page.salary_upcoming")}: {formatDate(next.valid_from)}{" "}
                    — {formatPriceLabel(String(next.amount))}
                </Badge>
            )}
        </div>
    )
}

export const useSalaryColumns = () => {
    const { t } = useTranslation()
    const base = useDirectionColumns()
    return useMemo<ColumnDef<DirectionRow>[]>(
        () =>
            base
                .filter(
                    (c) => !HIDDEN_SALARY_COLUMNS.has((c as any).accessorKey),
                )
                .flatMap((c) => {
                    const key = (c as any).accessorKey
                    if (key !== "current_price") return [c]
                    const validFromCol: ColumnDef<DirectionRow> = {
                        id: "driver_salary_valid_from",
                        accessorKey: "driver_salary_valid_from",
                        header: t("page.valid_from"),
                        enableSorting: true,
                        cell: ({ row }) =>
                            formatDate(row.original.driver_salary_valid_from),
                    }
                    const amountCol: ColumnDef<DirectionRow> = {
                        ...c,
                        id: "driver_salary_amount",
                        accessorKey: "driver_salary_amount",
                        header: t("table.salary_monthly_uzs"),
                        enableSorting: true,
                        cell: ({ row }) => (
                            <SalaryAmountCell row={row.original} />
                        ),
                    }
                    return [amountCol, validFromCol]
                }),
        [base, t],
    )
}
