import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { Clock } from "lucide-react"
import { useMemo } from "react"
import SortableHeader from "../../sortable-header"

export type SelectableItem = { id: number; name: string }

export type DirectionPrice = {
    id: number
    price: string | number
    valid_from: string
    created?: string
    changed_by?: number | null
    changed_by_name?: string | null
}

export type DirectionRow = {
    id: number
    owner?: number
    owner_name: string
    owner_code: string
    load?: number
    load_name: string
    unload?: number
    unload_name: string
    cargo_type?: number
    cargo_type_name: string
    payment_type?: number
    payment_type_name: string
    currency: 1 | 2
    current_price: DirectionPrice | null
    prices?: DirectionPrice[]
    driver_salary_amount?: string | null
}

const formatDate = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

const formatDateTime = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const PriceHistoryPopover = ({ prices }: { prices?: DirectionPrice[] }) => {
    const sorted = [...(prices ?? [])].sort((a, b) =>
        (b.valid_from ?? "").localeCompare(a.valid_from ?? ""),
    )
    return (
        <Popover>
            <PopoverTrigger
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Narx tarixi"
            >
                <Clock size={16} />
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b text-sm font-medium">
                    Narx tarixi
                </div>
                {sorted.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                        Tarix mavjud emas
                    </div>
                ) : (
                    <div className="max-h-72 overflow-y-auto divide-y">
                        {sorted.map((p) => (
                            <div key={p.id} className="px-3 py-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold tabular-nums">
                                        {formatMoney(Number(p.price ?? 0))}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(p.valid_from)} dan
                                    </span>
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {p.changed_by_name || "—"}
                                    </span>
                                    <span>{formatDateTime(p.created)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

const CURRENCY_LABELS: Record<number, string> = {
    1: "UZS",
    2: "USD",
}


/**
 * SARALASH — SERVER TOMONDA (B-70 / B-71, 5-raund).
 *
 * `enableSorting: true` DataTable'ning mijoz tomon saralashini yoqardi va u
 * faqat joriy 25 qatorni tartiblardi: "Summa" kamayish tartibida ekranda
 * 25 ta nol turardi, butun to'plamdagi haqiqiy maksimum (8 524 686) esa
 * 10-sahifada qolardi. Foydalanuvchi buni "eng qimmat yo'nalish" deb o'qirdi.
 *
 * Endi har bir sarlavha `SortableHeader` — u `?ordering=` ni URL'ga yozadi,
 * `index.tsx` uni so'rovga qo'shadi va backend butun to'plamni tartiblaydi.
 * `enableSorting` ATAYLAB berilmaydi: aks holda DataTable ustiga yana o'z
 * strelkasini va mijoz tomon saralashini qo'shib, ikkita raqobatlashuvchi
 * tartib paydo bo'lardi.
 */
export const useDirectionColumns = () =>
    useMemo<ColumnDef<DirectionRow>[]>(
        () => [
            {
                accessorKey: "owner_code",
                header: () => (
                    <SortableHeader field="owner_code" label="Firma kodi" />
                ),
                size: 100,
            },
            {
                accessorKey: "load_name",
                header: () => (
                    <SortableHeader field="load_name" label="Yuklash manzili" />
                ),
            },
            {
                accessorKey: "unload_name",
                header: () => (
                    <SortableHeader
                        field="unload_name"
                        label="Yuk tushirish manzili"
                    />
                ),
            },
            {
                accessorKey: "owner_name",
                header: () => (
                    <SortableHeader field="owner_name" label="Yuk egasi" />
                ),
            },
            {
                accessorKey: "cargo_type_name",
                header: () => (
                    <SortableHeader field="cargo_type_name" label="Yuk turi" />
                ),
            },
            {
                accessorKey: "payment_type_name",
                header: () => (
                    <SortableHeader
                        field="payment_type_name"
                        label="To'lov turi"
                    />
                ),
            },
            {
                accessorKey: "current_price",
                header: () => (
                    <SortableHeader field="current_price" label="Summa" />
                ),
                /**
                 * Mijoz tomondagi `sortingFn` olib tashlandi: `current_price`
                 * obyekt bo'lgani uchun u ichidagi `price` ni raqamga
                 * aylantirardi, lekin baribir faqat joriy sahifani
                 * tartiblardi. Backend endi SQL da AYNAN shu qoida bilan
                 * saralaydi (eng oxirgi `valid_from` bo'yicha amaldagi narx),
                 * ya'ni ekrandagi raqam bilan saralanadigan raqam bir xil.
                 */
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span>
                            {formatMoney(
                                Number(row.original.current_price?.price ?? 0),
                            )}
                        </span>
                        {(row.original.prices?.length ?? 0) > 1 && (
                            <PriceHistoryPopover prices={row.original.prices} />
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "currency",
                header: () => (
                    <SortableHeader field="currency" label="Valyuta" />
                ),
                cell: ({ row }) =>
                    CURRENCY_LABELS[row.original.currency] ?? "-",
            },
        ],
        [],
    )
