import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { DataTable } from "@/components/ui/datatable"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Download, Pencil, X } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { toast } from "sonner"
import {
    errorText,
    fmtDate,
    KassaRequest,
    KassaTrip,
    KassaTx,
    KIND_DIR,
    KV2_DRIVERS,
    KV2_EXCEL,
    KV2_REQUESTS,
    KV2_TRANSACTIONS,
    KV2_TRIPS,
    LedgerRow,
    money,
    n,
    Paged,
    STATUS,
    TripStatus,
    useKassaPost,
    useKassaRoles,
    useOverview,
    usePeriod,
} from "./api"

const Money = ({ v, dir }: { v: number | string; dir?: "in" | "out" }) => {
    const x = n(v)
    const sign = dir ? (dir === "in" ? "+" : "−") : x < 0 ? "−" : "+"
    const pos = dir ? dir === "in" : x >= 0
    return <span className={cn("font-semibold tabular-nums whitespace-nowrap", pos ? "text-green-600" : "text-destructive")}>{sign}{formatMoney(Math.abs(x))}</span>
}

const Party = ({ name, trip }: { name: string | null; trip: number | null }) => (
    <div className="flex flex-col">
        <span className="whitespace-nowrap">{name || "—"}</span>
        {trip && <span className="text-xs text-muted-foreground">Aylanma #{trip}</span>}
    </div>
)

const Note = ({ v }: { v: string | null | undefined }) => <span className="text-muted-foreground line-clamp-2 max-w-48">{v || "—"}</span>

const DateCell = ({ v }: { v: string | null }) => <span className="whitespace-nowrap text-muted-foreground">{fmtDate(v)}</span>

const Head = ({ left, right }: { left: ReactNode; right?: ReactNode }) => (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">{left}</div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">{right}</div>
    </div>
)

const Filter = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) => (
    <Combobox
        label=""
        options={options.map(([id, name]) => ({ id, name }))}
        value={value}
        setValue={(v: any) => v != null && v !== "" && onChange(String(v))}
        labelKey="name"
        valueKey="id"
        isClearIcon={false}
        isSearch={false}
        className="h-10 w-44"
    />
)

const usePaging = () => {
    const search = useSearch({ strict: false }) as { page?: number; page_size?: number }
    return { page: search.page, page_size: search.page_size }
}

const paginationProps = (total?: number) => ({ totalPages: total, paramName: "page", pageSizeParamName: "page_size" })

type KassaRow = KassaTx & { req?: KassaRequest }

const requestRow = (r: KassaRequest): KassaRow => ({
    id: -r.id,
    amount: r.amount,
    dir: KIND_DIR[r.kind] ?? "out",
    kind: r.kind,
    kind_label: r.kind_label,
    expense_type: r.expense_type_label,
    party: requestWho(r),
    driver: r.driver,
    trip: r.trip,
    comment: r.comment,
    executor_name: r.creator_name,
    created: r.created,
    edited_at: null,
    reversed: null,
    reversal_of: null,
    req: r,
})

export const KassaTable = ({ switcher, actions, onEdit, onDelete, onReverse, onReject, onEditRequest, group, groupLabel, onClearGroup }: {
    group?: string | null
    groupLabel?: string
    onClearGroup?: () => void
    switcher: ReactNode
    actions: ReactNode
    onEdit: (r: KassaTx) => void
    onDelete: (r: KassaTx) => void
    onReverse: (r: KassaTx) => void
    onReject: (r: KassaRequest) => void
    onEditRequest: (r: KassaRequest) => void
}) => {
    const { cashier, operator } = useKassaRoles()
    const period = usePeriod()
    const [dir, setDir] = useState("all")
    const params = { ...period, ...usePaging(), dir: dir === "all" ? undefined : dir, group: group || undefined }
    const { data, isLoading } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params })
    const { data: pendingData } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params: { status: STATUS.PENDING, page_size: 1000 } })
    const { data: ov } = useOverview()
    const balance = n(ov?.balance)
    const { mutate: post, isPending } = useKassaPost()
    const act = (url: string, ok: string) =>
        post(url, {}, { onSuccess: () => toast.success(ok), onError: (e: unknown) => toast.error(errorText(e)) })
    const rows = useMemo<KassaRow[]>(() => {
        const pend = group ? [] : (pendingData?.results ?? []).map(requestRow).filter((r) => dir === "all" || r.dir === dir)
        return [...pend, ...(data?.results ?? [])]
    }, [data, pendingData, dir, group])
    const excel = useDownloadAsExcel({ url: KV2_EXCEL, name: `kassa_${period.from_date ?? "boshidan"}_${period.to_date ?? "bugungacha"}`, params: period })

    const columns = useMemo<ColumnDef<KassaRow>[]>(
        () => [
            {
                header: "Summa",
                accessorKey: "amount",
                cell: ({ row }) => (
                    <span className={cn(row.original.reversed && "line-through opacity-60")}>
                        <Money v={row.original.amount} dir={row.original.dir} />
                    </span>
                ),
            },
            {
                header: "Nima uchun",
                accessorKey: "kind_label",
                cell: ({ row }) => row.original.kind_label + (row.original.expense_type ? ` · ${row.original.expense_type}` : ""),
            },
            { header: "Kimdan / kimga", accessorKey: "party", cell: ({ row }) => <Party name={row.original.party} trip={row.original.trip} /> },
            { header: "Izoh", accessorKey: "comment", cell: ({ row }) => <Note v={row.original.comment} /> },
            { header: "Kiritgan", accessorKey: "executor_name", cell: ({ row }) => <span className="text-muted-foreground">{row.original.executor_name || "—"}</span> },
            {
                header: "Sana",
                accessorKey: "created",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <DateCell v={row.original.created} />
                        {row.original.edited_at && <span className="text-xs text-muted-foreground">o'zgartirilgan</span>}
                        {row.original.req && <span className="text-xs text-orange-500 whitespace-nowrap">so'rov</span>}
                    </div>
                ),
            },
        ],
        [],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={rows}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            paginationProps={paginationProps(data?.total_pages)}
            rowAction={(row: KassaRow) => {
                const q = row.req
                if (q) {
                    if (cashier) {
                        const out = KIND_DIR[q.kind] === "out"
                        const short = out && balance < n(q.amount)
                        return (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-green-600 hover:text-green-600" disabled={short || isPending} onClick={() => act(`${KV2_REQUESTS}/${q.id}/pay`, out ? "Kassadan chiqim qilindi" : "Kassaga kirim qilindi")}>
                                        <Check size={16} />
                                        {out ? "Berdim" : "Oldim"}
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => onReject(q)}>
                                        <X size={16} />
                                        Rad etish
                                    </Button>
                                    {operator && <TableActions onEdit={() => onEditRequest(q)} onDelete={() => act(`${KV2_REQUESTS}/${q.id}/cancel`, "So'rov bekor qilindi")} />}
                                </div>
                                {short && <span className="text-xs text-destructive whitespace-nowrap">Kassada yetarli pul yo'q</span>}
                            </div>
                        )
                    }
                    return (
                        <div className="flex items-center gap-2 justify-end">
                            <Badge variant="orange" className="w-fit whitespace-nowrap">Kutilmoqda</Badge>
                            {operator && <TableActions onEdit={() => onEditRequest(q)} onDelete={() => act(`${KV2_REQUESTS}/${q.id}/cancel`, "So'rov bekor qilindi")} />}
                        </div>
                    )
                }
                const r: KassaTx = row
                if (r.reversed)
                    return (
                        <div className="flex flex-col items-end gap-0.5">
                            <Badge variant="secondary" className="w-fit whitespace-nowrap">Bekor qilingan</Badge>
                            <span className="text-xs text-muted-foreground max-w-48 text-right">{r.reversed.reason}</span>
                        </div>
                    )
                if (!cashier) return null
                if (r.kind === "income") return <TableActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
                if (r.kind !== "reversal") return <TableActions onUndo={() => onReverse(r)} />
                return null
            }}
            head={
                <Head
                    left={<>{switcher}<Badge>{data?.count ?? 0}</Badge>{group && (
                        <Badge variant="secondary" className="gap-1.5 cursor-pointer" onClick={onClearGroup}>
                            {groupLabel}
                            <X size={12} />
                        </Badge>
                    )}{!!pendingData?.count && <Badge variant="orange">{pendingData.count} ta so'rov kutilmoqda</Badge>}</>}
                    right={<>
                        <Filter value={dir} onChange={setDir} options={[["all", "Kirim va chiqim"], ["in", "Faqat kirim"], ["out", "Faqat chiqim"]]} />
                        <Button variant="outline" loading={excel.isFetching} onClick={excel.trigger}>
                            <Download size={16} />
                            Excel
                        </Button>
                        {actions}
                    </>}
                />
            }
        />
    )
}

const REQ_STATUS: Record<number, [string, "orange" | "default" | "destructive" | "secondary"]> = {
    [STATUS.PENDING]: ["Kutilmoqda", "orange"],
    [STATUS.PAID]: ["Tasdiqlandi", "default"],
    [STATUS.REJECTED]: ["Rad etildi", "destructive"],
    [STATUS.CANCELED]: ["Bekor qilindi", "secondary"],
}

const requestWho = (r: KassaRequest) => {
    if (r.kind !== "garaj_xarajat") return r.driver_name
    if (r.expense_type === "ombor") return [r.warehouse, r.product].filter(Boolean).join(" · ")
    return r.vehicle_number
}

export const RequestsTable = ({ switcher, onReject, onEdit, actions }: {
    switcher: ReactNode
    onReject: (r: KassaRequest) => void
    onEdit: (r: KassaRequest) => void
    actions?: ReactNode
}) => {
    const { cashier, operator } = useKassaRoles()
    const [status, setStatus] = useState("all")
    const params = { ...usePaging(), status: status === "all" ? undefined : status }
    const { data, isLoading } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params })
    const { data: ov } = useOverview()
    const balance = n(ov?.balance)
    const { mutate: post, isPending } = useKassaPost()

    const act = (url: string, ok: string) =>
        post(url, {}, { onSuccess: () => toast.success(ok), onError: (e: unknown) => toast.error(errorText(e)) })

    const rows = useMemo(
        () => (data?.results ?? []).slice().sort((a, b) => (a.status === STATUS.PENDING ? 0 : 1) - (b.status === STATUS.PENDING ? 0 : 1)),
        [data],
    )

    const columns = useMemo<ColumnDef<KassaRequest>[]>(
        () => [
            { header: "Summa", accessorKey: "amount", cell: ({ row }) => <Money v={row.original.amount} dir={KIND_DIR[row.original.kind]} /> },
            {
                header: "Nima uchun",
                accessorKey: "kind_label",
                cell: ({ row }) => row.original.kind_label + (row.original.expense_type_label ? ` · ${row.original.expense_type_label}` : ""),
            },
            { header: "Kimga / nimaga", id: "who", cell: ({ row }) => <Party name={requestWho(row.original)} trip={row.original.trip} /> },
            {
                header: "Izoh",
                accessorKey: "comment",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <Note v={row.original.comment} />
                        {row.original.expected_amount != null && n(row.original.expected_amount) !== n(row.original.amount) && (
                            <span className="text-xs text-orange-500 whitespace-nowrap">
                                Hisob bo'yicha: {money(row.original.expected_amount)} · farq haydovchi balansida
                            </span>
                        )}
                    </div>
                ),
            },
            { header: "So'ragan", accessorKey: "creator_name", cell: ({ row }) => <span className="text-muted-foreground">{row.original.creator_name || "—"}</span> },
            { header: "Sana", accessorKey: "created", cell: ({ row }) => <DateCell v={row.original.created} /> },
        ],
        [],
    )

    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={rows}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            paginationProps={paginationProps(data?.total_pages)}
            rowAction={(r: KassaRequest) => {
                if (r.status === STATUS.PENDING && cashier) {
                    const out = KIND_DIR[r.kind] === "out"
                    const short = out && balance < n(r.amount)
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-8 gap-1 text-green-600 hover:text-green-600" disabled={short || isPending} onClick={() => act(`${KV2_REQUESTS}/${r.id}/pay`, out ? "Kassadan chiqim qilindi" : "Kassaga kirim qilindi")}>
                                    <Check size={16} />
                                    {out ? "Berdim" : "Oldim"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => onReject(r)}>
                                    <X size={16} />
                                    Rad etish
                                </Button>
                                {operator && <TableActions onEdit={() => onEdit(r)} onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, "So'rov bekor qilindi")} />}
                            </div>
                            {short && <span className="text-xs text-destructive whitespace-nowrap">Kassada yetarli pul yo'q</span>}
                        </div>
                    )
                }
                if (r.status === STATUS.PENDING && operator)
                    return (
                        <div className="flex items-center gap-2 justify-end">
                            <Badge variant="orange" className="w-fit whitespace-nowrap">Kutilmoqda</Badge>
                            <TableActions onEdit={() => onEdit(r)} onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, "So'rov bekor qilindi")} />
                        </div>
                    )
                const [label, variant] = REQ_STATUS[r.status] ?? ["—", "secondary"]
                return (
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={variant} className="w-fit whitespace-nowrap">{label}</Badge>
                        {r.paid_at && r.status !== STATUS.PENDING && <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.paid_at)}</span>}
                        {r.status === STATUS.REJECTED && r.rejected_comment && <span className="text-xs text-muted-foreground max-w-56 text-right">{r.rejected_comment}</span>}
                        {r.status === STATUS.REJECTED && operator && (
                            <div className="flex items-center gap-2 mt-1">
                                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => onEdit(r)}>
                                    <Pencil size={14} />
                                    Tuzatib qayta yuborish
                                </Button>
                                <TableActions onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, "So'rov bekor qilindi")} />
                            </div>
                        )}
                    </div>
                )
            }}
            head={
                <Head
                    left={<>{switcher}<Badge>{data?.count ?? 0}</Badge></>}
                    right={<>
                        <Filter
                            value={status}
                            onChange={setStatus}
                            options={[["all", "Barcha holatlar"], [String(STATUS.PENDING), "Kutilmoqda"], [String(STATUS.PAID), "Tasdiqlandi"], [String(STATUS.REJECTED), "Rad etildi"], [String(STATUS.CANCELED), "Bekor qilindi"]]}
                        />
                        {actions}
                    </>}
                />
            }
        />
    )
}

const TRIP_STATUS: Record<TripStatus, [string, "orange" | "default" | "secondary"]> = {
    avans_kutilmoqda: ["Avans kutilmoqda", "orange"],
    yolda: ["Yo'lda", "default"],
    yopilmoqda: ["Kassa tasdig'i kutilmoqda", "orange"],
    yopildi: ["Yopildi", "secondary"],
}

export const TripsTable = ({ switcher, onClose, actions }: { switcher: ReactNode; onClose: (t: KassaTrip) => void; actions?: ReactNode }) => {
    const { operator } = useKassaRoles()
    const { data, isLoading } = useGet<KassaTrip[]>(KV2_TRIPS)
    const columns = useMemo<ColumnDef<KassaTrip>[]>(
        () => [
            { header: "Haydovchi balansi", accessorKey: "driver_balance", cell: ({ row }) => <span className="font-semibold tabular-nums whitespace-nowrap">{formatMoney(n(row.original.driver_balance))}</span> },
            { header: "Aylanma", accessorKey: "id", cell: ({ row }) => `#${row.original.id}` },
            { header: "Haydovchi", accessorKey: "driver_name" },
            { header: "Mashina", accessorKey: "plate" },
            { header: "Boshlangan", accessorKey: "created", cell: ({ row }) => <DateCell v={row.original.created} /> },
        ],
        [],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={data}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            rowAction={(t: KassaTrip) => {
                const [label, variant] = TRIP_STATUS[t.status]
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Badge variant={variant} className="w-fit whitespace-nowrap">{label}</Badge>
                        {operator && (t.status === "yolda" || t.status === "avans_kutilmoqda") && (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => onClose(t)}>Aylanmani yopish</Button>
                        )}
                    </div>
                )
            }}
            head={<Head left={<>{switcher}<Badge>{data?.length ?? 0}</Badge></>} right={actions} />}
        />
    )
}

export const LedgerTable = ({ head, driver }: { head: ReactNode; driver: number }) => {
    const { data, isLoading } = useGet<{ balance: number; rows: LedgerRow[] }>(`${KV2_DRIVERS}/${driver}/ledger`)
    const columns = useMemo<ColumnDef<LedgerRow>[]>(
        () => [
            {
                header: "Summa",
                accessorKey: "amount",
                cell: ({ row }) => <span className={cn(row.original.reversed && "line-through opacity-60")}><Money v={row.original.amount} /></span>,
            },
            { header: "Nima uchun", accessorKey: "reason" },
            { header: "Aylanma", accessorKey: "trip", cell: ({ row }) => (row.original.trip ? `#${row.original.trip}` : "Balansga") },
            { header: "Izoh", accessorKey: "comment", cell: ({ row }) => <Note v={row.original.comment} /> },
            { header: "Sana", accessorKey: "date", cell: ({ row }) => <DateCell v={row.original.date} /> },
        ],
        [],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={data?.rows}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            head={head}
        />
    )
}
