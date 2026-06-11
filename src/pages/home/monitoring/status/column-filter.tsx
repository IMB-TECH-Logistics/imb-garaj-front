import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Column } from "@tanstack/react-table"
import {
    ArrowDownAZ,
    ArrowDownWideNarrow,
    ArrowUpAZ,
    ArrowUpNarrowWide,
    ListFilter,
} from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

// Excel-style column header: title + a funnel popover with sort + a searchable
// checkbox list of the column's distinct values.
export function ColumnFilter<T>({
    column,
    title,
    options,
    sortType = "text",
}: {
    column: Column<T, unknown>
    title: ReactNode
    options: string[]
    // "duration" columns sort by magnitude (most → least) instead of A–Z.
    sortType?: "text" | "duration"
}) {
    const [q, setQ] = useState("")
    const selected = (column.getFilterValue() as string[] | undefined) ?? []
    const active = selected.length > 0

    const visible = useMemo(() => {
        const s = q.trim().toLowerCase()
        return s ? options.filter((o) => o.toLowerCase().includes(s)) : options
    }, [options, q])

    const toggle = (val: string) => {
        const next = selected.includes(val)
            ? selected.filter((v) => v !== val)
            : [...selected, val]
        column.setFilterValue(next.length ? next : undefined)
    }

    const allChecked =
        visible.length > 0 && visible.every((o) => selected.includes(o))
    const toggleAll = () => {
        if (allChecked) {
            const remove = new Set(visible)
            const next = selected.filter((v) => !remove.has(v))
            column.setFilterValue(next.length ? next : undefined)
        } else {
            column.setFilterValue(Array.from(new Set([...selected, ...visible])))
        }
    }

    return (
        <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="flex items-center gap-1.5">{title}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded transition hover:bg-muted",
                            active
                                ? "text-primary"
                                : "text-muted-foreground/50",
                        )}
                    >
                        <ListFilter className="h-3.5 w-3.5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    sideOffset={6}
                    onClick={(e) => e.stopPropagation()}
                    className="w-56 p-2"
                >
                    <div className="flex gap-1 pb-2">
                        {sortType === "duration" ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 flex-1 gap-1 text-xs"
                                    onClick={() => column.toggleSorting(true)}
                                >
                                    <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                                    Ko'p → kam
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 flex-1 gap-1 text-xs"
                                    onClick={() => column.toggleSorting(false)}
                                >
                                    <ArrowUpNarrowWide className="h-3.5 w-3.5" />
                                    Kam → ko'p
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 flex-1 gap-1 text-xs"
                                    onClick={() => column.toggleSorting(false)}
                                >
                                    <ArrowDownAZ className="h-3.5 w-3.5" />
                                    A–Z
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 flex-1 gap-1 text-xs"
                                    onClick={() => column.toggleSorting(true)}
                                >
                                    <ArrowUpAZ className="h-3.5 w-3.5" />
                                    Z–A
                                </Button>
                            </>
                        )}
                    </div>

                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Qidirish..."
                        className="mb-2 h-8"
                    />

                    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs font-medium">
                        <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                        Barchasi
                    </label>

                    <div className="max-h-48 overflow-y-auto">
                        {visible.length === 0 ? (
                            <div className="py-3 text-center text-xs text-muted-foreground">
                                Topilmadi
                            </div>
                        ) : (
                            visible.map((o) => (
                                <label
                                    key={o}
                                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted"
                                >
                                    <Checkbox
                                        checked={selected.includes(o)}
                                        onCheckedChange={() => toggle(o)}
                                    />
                                    <span className="truncate">{o}</span>
                                </label>
                            ))
                        )}
                    </div>

                    {active && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-7 w-full text-xs text-muted-foreground"
                            onClick={() => column.setFilterValue(undefined)}
                        >
                            Tozalash
                        </Button>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    )
}

// Shared helpers for wiring columns to the filter.
export const distinct = (vals: string[]): string[] =>
    Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b))

// filterFn: keep rows whose display value is among the selected set.
export const multiSelectFilter = <T,>(
    row: { getValue: (id: string) => unknown },
    columnId: string,
    value: string[] | undefined,
) => !value?.length || value.includes(String(row.getValue(columnId)))
