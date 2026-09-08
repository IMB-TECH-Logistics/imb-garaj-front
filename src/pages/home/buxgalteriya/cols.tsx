import { CopyButton } from "@/lib/copy-button"
import { formatSom } from "@/lib/money-format"
import { cn, toNum } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"
import { useMemo } from "react"

/** BX-13: ISO sana ("2026-05-03") ekranda dd.MM.yyyy ko'rinishida — loyihaning
 *  boshqa modullari bilan bir xil va "03/05" chalkashligisiz. */
const formatDate = (value: string | null | undefined) => {
    if (!value) return "—"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export interface ReysOrder {
    id: number
    trip: number
    client: number
    status: number
    type: number
    date: string
    vehicle_type: string | null
    truck_number: string | null
    driver_name: string | null
    loading: number
    unloading: number
    loading_name: string | null
    unloading_name: string | null
    cargo_type: number
    cargo_type_name: string | null
    client_name: string | null
    client_code: string | null
    summa_s_nds: string | number
    naqd_amount: string | number
    pct: number
    our_share: string | number
    external_id: string | number
}

/**
 * BX-02: saralash SERVER tomonda bo'lishi shart.
 *
 * DataTable'ning o'z saralashi (`getSortedRowModel`) faqat JORIY SAHIFANI
 * tartiblaydi — 1 726 reysdan 25 tasini. Shuning uchun "Naqd bo'yicha kamayish"
 * bosilganda ekranda 5 800 000 chiqar, butun to'plamdagi haqiqiy maksimum esa
 * 6 800 000 edi. Endi sarlavha bosilganda URL'ga `ordering` yoziladi, u
 * so'rovga qo'shiladi (`index.tsx`) va backend (`RunOrderListView.ordering_fields`)
 * butun to'plamni tartiblab qaytaradi.
 *
 * Ustunlar `enableSorting: false` bilan e'lon qilinadi — shunda DataTable o'zining
 * mijoz tomonidagi saralashini VA strelkasini qo'shmaydi, faqat shu tugma ishlaydi.
 */
const SortableHeader = ({
    field,
    children,
    align = "left",
}: {
    field: string
    children: React.ReactNode
    align?: "left" | "right"
}) => {
    const search: any = useSearch({ strict: false })
    const navigate = useNavigate()
    const current: string | undefined = search?.ordering
    const direction =
        current === field ? "asc"
        : current === `-${field}` ? "desc"
        : null

    // asc → desc → saralashsiz
    const nextOrdering =
        direction === "asc" ? `-${field}`
        : direction === "desc" ? undefined
        : field

    return (
        <button
            type="button"
            title={
                direction === "asc" ? "O'sish bo'yicha — kamayishga o'tkazish"
                : direction === "desc" ? "Kamayish bo'yicha — saralashni bekor qilish"
                : "Butun ro'yxat bo'yicha saralash"
            }
            onClick={(e) => {
                e.stopPropagation()
                navigate({
                    search: ((prev: Record<string, unknown>) => ({
                        ...prev,
                        ordering: nextOrdering,
                        // Saralash o'zgarganda 1-sahifaga qaytamiz
                        page: undefined,
                    })) as any,
                })
            }}
            className={cn(
                "flex items-center gap-1 select-none w-max",
                align === "right" && "ml-auto",
                direction && "text-primary font-semibold",
            )}
        >
            {children}
            {direction === "asc" ?
                <ChevronUp width={14} />
            : direction === "desc" ?
                <ChevronDown width={14} />
            :   <ChevronsUpDown width={14} className="text-muted-foreground/60" />
            }
        </button>
    )
}

export const useAccountingCols = () => {
    return useMemo<ColumnDef<ReysOrder>[]>(
        () => [
            {
                header: () => (
                    <SortableHeader field="external_id">
                        Buyurtma ID
                    </SortableHeader>
                ),
                accessorKey: "external_id",
                size: 140,
                enableSorting: false,
                cell({ row: { original } }) {
                    return (
                        <div>
                            {original?.external_id ?
                                CopyButton(original?.external_id)
                            :   "-"}
                        </div>
                    )
                },
            },
            {
                header: () => (
                    <SortableHeader field="client_code">
                        Firma kodi
                    </SortableHeader>
                ),
                accessorKey: "client_code",
                size: 140,
                enableSorting: false,
            },
            {
                header: () => (
                    <SortableHeader field="client_name">
                        Firma nomi
                    </SortableHeader>
                ),
                accessorKey: "client_name",
                size: 140,
                enableSorting: false,
            },
            {
                header: () => <SortableHeader field="date">Sana</SortableHeader>,
                accessorKey: "date",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDate(row.original.date)}
                    </span>
                ),
            },
            {
                header: () => (
                    <SortableHeader field="loading_name">
                        Yuklash joyi
                    </SortableHeader>
                ),
                accessorKey: "loading_name",
                size: 130,
                enableSorting: false,
            },
            {
                header: () => (
                    <SortableHeader field="unloading_name">
                        Tushirish joyi
                    </SortableHeader>
                ),
                accessorKey: "unloading_name",
                size: 130,
                enableSorting: false,
            },
            {
                header: () => (
                    <SortableHeader field="vehicle_type">
                        Avto turi
                    </SortableHeader>
                ),
                accessorKey: "vehicle_type",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="uppercase">
                        {row.original.vehicle_type || "—"}
                    </span>
                ),
            },
            {
                header: () => (
                    <SortableHeader field="truck_number">
                        Davlat raqami
                    </SortableHeader>
                ),
                accessorKey: "truck_number",
                size: 120,
                enableSorting: false,
            },
            {
                header: () => (
                    <SortableHeader field="cargo_type_name">
                        Yuk turi
                    </SortableHeader>
                ),
                accessorKey: "cargo_type_name",
                size: 110,
                enableSorting: false,
            },
            {
                header: () => (
                    <SortableHeader field="summa_s_nds">
                        Summa S NDS
                    </SortableHeader>
                ),
                accessorKey: "summa_s_nds",
                size: 130,
                enableSorting: false,
                cell: ({ row }) => {
                    const v = toNum(row.original.summa_s_nds)
                    return (
                        <span className="font-medium text-nowrap">
                            {formatSom(v)}
                        </span>
                    )
                },
            },
            {
                // `pct` backend `ordering_fields` da yo'q — saralanmaydi,
                // shuning uchun bosiladigan sarlavha ham berilmaydi.
                header: "%",
                accessorKey: "pct",
                size: 60,
                enableSorting: false,
                cell: ({ row }) => <span>{row.original.pct}%</span>,
            },
            {
                /* `naqd_amount` backend `ordering_fields` da bor, lekin u
                 * serializerda hisoblanadigan maydon (summa × %) — bazada ustun
                 * yo'q, shuning uchun DRF `ordering=-naqd_amount` ni JIMGINA
                 * e'tiborsiz qoldiradi (jonli tekshirildi: asc va desc bir xil
                 * natija qaytardi). Ishlamaydigan saralash tugmasini
                 * ko'rsatgandan ko'ra umuman ko'rsatmagan afzal —
                 * `raund2/backend-kerak-FE1.md` ga yozildi. */
                header: () => (
                    <span
                        title="Bu ustun bo'yicha saralash hozircha yo'q — qiymat bazada saqlanmaydi, so'rov paytida hisoblanadi. Yaqin qiymat uchun 'Summa S NDS' bo'yicha saralang."
                        className="cursor-help border-b border-dotted border-muted-foreground/40"
                    >
                        Naqd
                    </span>
                ),
                accessorKey: "naqd_amount",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const v = toNum(row.original.naqd_amount)
                    return (
                        <span className="font-medium text-green-600 text-nowrap">
                            {formatSom(v)}
                        </span>
                    )
                },
            },
        ],
        [],
    )
}
