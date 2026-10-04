import Modal from "@/components/custom/modal"
import TableActions from "@/components/custom/table-actions"
import { DatePickerWithRange } from "@/components/form/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { DataTable } from "@/components/ui/datatable"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Download, Pencil, RotateCcw, X } from "lucide-react"
import { format } from "date-fns"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import {
    errorText,
    fmtDate,
    KassaRequest,
    KassaTrip,
    KassaTx,
    KIND_DIR,
    KV2_DRIVERS,
    CloseBreakdown,
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

export const CloseLines = ({ c }: { c: CloseBreakdown }) => (
    <div className="flex flex-col text-xs tabular-nums whitespace-nowrap">
        {n(c.earned) !== 0 && <span>Reys puli (naqd): <span className="text-green-600">+{money(c.earned)}</span></span>}
        {n(c.avans_left) !== 0 && (
            <span>
                {n(c.avans_left) > 0 ? "Avansdan qoldi" : "Avansdan ortiq sarfladi"}:{" "}
                <span className={n(c.avans_left) > 0 ? "text-green-600" : "text-destructive"}>{n(c.avans_left) > 0 ? "+" : "−"}{money(Math.abs(n(c.avans_left)))}</span>
            </span>
        )}
        {n(c.salary) !== 0 && <span>Oylik: <span className="text-destructive">−{money(c.salary)}</span></span>}
    </div>
)

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

const EXCEL_MODAL = "kassa-v2-excel"

const ExcelModal = () => {
    const period = usePeriod()
    const { isOpen, closeModal } = useModal(EXCEL_MODAL)
    const [range, setRange] = useState<DateRange | undefined>()
    useEffect(() => {
        if (!isOpen) return
        setRange({
            from: period.from_date ? new Date(period.from_date) : undefined,
            to: period.to_date ? new Date(period.to_date) : undefined,
        })
    }, [isOpen])
    const params = {
        from_date: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
        to_date: range?.to ? format(range.to, "yyyy-MM-dd") : range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
    }
    const excel = useDownloadAsExcel({ url: KV2_EXCEL, name: `kassa_${params.from_date ?? "boshidan"}_${params.to_date ?? "bugungacha"}`, params })
    return (
        <Modal modalKey={EXCEL_MODAL} title="Excel yuklash" size="max-w-md">
            <div className="flex flex-col gap-3">
                <DatePickerWithRange date={range} setDate={setRange} />
                <Button loading={excel.isFetching} onClick={async () => { await excel.trigger(); closeModal() }}>
                    <Download size={16} />
                    Yuklab olish
                </Button>
            </div>
        </Modal>
    )
}

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
    close: r.close ? { ...r.close, id: -r.id, request: r.id } : null,
    req: r,
})

const KIND_FILTERS: [string, string][] = [
    ["all", "Barcha turlar"],
    ["kirim", "Kassaga kirim"],
    ["yopish", "Aylanmani yopish"],
    ["avans", "Avans"],
    ["garaj", "Garaj xarajati"],
    ["bekor", "Bekor qilingan"],
]

const requestKindFilter = (r: KassaRequest) => {
    if (r.close || r.kind === "qaytarish" || r.kind === "berish" || r.kind === "oylik") return "yopish"
    if (r.kind === "garaj_xarajat") return "garaj"
    return "avans"
}

const mergeCloses = (list: KassaRow[]): KassaRow[] => {
    const seen = new Set<number>()
    const out: KassaRow[] = []
    for (const r of list) {
        if (!r.close) {
            out.push(r)
            continue
        }
        if (seen.has(r.close.id)) continue
        seen.add(r.close.id)
        const net = n(r.close.net)
        out.push({ ...r, amount: String(Math.abs(net)), dir: net >= 0 ? "in" : "out", kind_label: "Aylanmani yopish", expense_type: null })
    }
    return out
}

const dm = (d: string | null) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : "…")
const tripPeriod = (a: string | null, b: string | null) => `${dm(a)} – ${b ? dm(b) : "davom etmoqda"}`

const DETAIL_MODAL = "kassa-v2-close-detail"

const DetailRow = ({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) => (
    <div className={cn("flex items-center justify-between gap-3 py-2 text-sm", className)}>
        <span>{label}</span>
        {children}
    </div>
)

const CloseDetailModal = ({ row, onReject }: { row: KassaRow | null; onReject: (r: KassaRequest) => void }) => {
    const c = row?.close
    const req = row?.req
    const q = req && req.status === STATUS.PENDING ? req : undefined
    const { cashier } = useKassaRoles()
    const { data: ov } = useOverview()
    const { closeModal } = useModal(DETAIL_MODAL)
    const { mutate: post, isPending } = useKassaPost(closeModal)
    const out = !!q && KIND_DIR[q.kind] === "out"
    const short = out && !!q && n(ov?.balance) < n(q.amount)
    return (
        <Modal modalKey={DETAIL_MODAL} title={row?.trip ? `Aylanma #${row.trip} yopilishi` : "Aylanma yopilishi"} size="max-w-md">
            {c && row && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{row.party || "—"}</p>
                    <div className="rounded-lg border px-3 divide-y">
                        <DetailRow label="Aylanma davri"><span className="tabular-nums whitespace-nowrap">{tripPeriod(c.trip_start, c.trip_end)}</span></DetailRow>
                        <DetailRow label="Berilgan avans"><Part v={c.given} sign="−" /></DetailRow>
                        <DetailRow label="Avans qoldig'i"><Part v={c.avans_left} sign="+" /></DetailRow>
                        <DetailRow label="Naqd reys puli"><Part v={c.earned} sign="+" /></DetailRow>
                        <DetailRow label="Oylik"><Part v={c.salary} sign="−" /></DetailRow>
                        <DetailRow label={row.dir === "in" ? "Kassa haydovchidan oladi" : "Kassa haydovchiga beradi"} className="font-semibold">
                            <Money v={row.amount} dir={row.dir} />
                        </DetailRow>
                    </div>
                    {q && cashier && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="destructive"
                                    className="gap-1"
                                    disabled={isPending}
                                    onClick={() => { closeModal(); onReject(q) }}
                                >
                                    <X size={16} />
                                    Rad etish
                                </Button>
                                <Button
                                    className="min-w-32 gap-1"
                                    loading={isPending}
                                    disabled={short}
                                    onClick={() => post(`${KV2_REQUESTS}/${q.id}/pay`, {}, {
                                        onSuccess: () => toast.success(out ? "Kassadan chiqim qilindi, aylanma yopildi" : "Kassaga kirim qilindi, aylanma yopildi"),
                                        onError: (e: unknown) => toast.error(errorText(e)),
                                    })}
                                >
                                    <Check size={16} />
                                    {out ? "Berdim" : "Oldim"}
                                </Button>
                            </div>
                            {short && <span className="text-xs text-destructive text-right">Kassada yetarli pul yo'q</span>}
                        </div>
                    )}
                    {q && !cashier && <Badge variant="orange" className="w-fit self-end">Kassir tasdig'i kutilmoqda</Badge>}
                    {req && req.status === STATUS.PAID && (
                        <span className="text-xs text-muted-foreground text-right">
                            Tasdiqlangan{req.paid_by_name ? ` · ${req.paid_by_name}` : ""}{req.paid_at ? ` · ${fmtDate(req.paid_at)}` : ""}
                        </span>
                    )}
                    {req && req.status === STATUS.REJECTED && (
                        <span className="text-xs text-destructive text-right">Rad etildi{req.rejected_comment ? `: ${req.rejected_comment}` : ""}</span>
                    )}
                </div>
            )}
        </Modal>
    )
}

const Part = ({ v, sign }: { v: number | string | undefined; sign: "+" | "−" }) => {
    const x = n(v)
    if (!x) return <span className="text-muted-foreground">—</span>
    const plus = sign === "+" ? x > 0 : x < 0
    return <span className={cn("tabular-nums whitespace-nowrap font-medium", plus ? "text-green-600" : "text-destructive")}>{plus ? "+" : "−"}{money(Math.abs(x))}</span>
}

export const KassaTable = ({ switcher, actions, onEdit, onDelete, onReverse, onReject, onPay, onEditRequest, group, groupLabel, onClearGroup }: {
    group?: string | null
    groupLabel?: string
    onClearGroup?: () => void
    switcher: ReactNode
    actions: ReactNode
    onEdit: (r: KassaTx) => void
    onDelete: (r: KassaTx) => void
    onReverse: (r: KassaTx) => void
    onReject: (r: KassaRequest) => void
    onPay: (r: KassaRequest) => void
    onEditRequest: (r: KassaRequest) => void
}) => {
    const { cashier, operator } = useKassaRoles()
    const period = usePeriod()
    const [dir, setDir] = useState("all")
    const [kindF, setKindF] = useState("all")
    const params = { ...period, ...usePaging(), dir: dir === "all" ? undefined : dir, kind: kindF === "all" ? undefined : kindF, group: group || undefined }
    const { data, isLoading } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params })
    const { data: reqData } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params: { status: `${STATUS.PENDING},${STATUS.REJECTED}`, page_size: 1000 } })
    const reqs = useMemo(() => (reqData?.results ?? []).filter((q) => q.status === STATUS.PENDING || q.can_unreject), [reqData])
    const pendingCount = reqs.filter((q) => q.status === STATUS.PENDING).length
    const { data: ov } = useOverview()
    const balance = n(ov?.balance)
    const { mutate: post, isPending } = useKassaPost()
    const act = (url: string, ok: string) =>
        post(url, {}, { onSuccess: () => toast.success(ok), onError: (e: unknown) => toast.error(errorText(e)) })
    const rows = useMemo<KassaRow[]>(() => {
        const pend = group ? [] : reqs
            .filter((q) => kindF === "all" || requestKindFilter(q) === kindF)
            .map(requestRow)
            .filter((r) => dir === "all" || r.dir === dir)
        const list = [...pend, ...(data?.results ?? [])]
        if (group) return list.map((r) => ({ ...r, close: null }))
        const merged = mergeCloses(list)
        return dir === "all" ? merged : merged.filter((r) => r.dir === dir)
    }, [data, reqs, dir, kindF, group])
    const excelModal = useModal(EXCEL_MODAL)
    const detailModal = useModal(DETAIL_MODAL)
    const [detail, setDetail] = useState<KassaRow | null>(null)
    const openDetail = (r: KassaRow) => {
        setDetail(r)
        detailModal.openModal()
    }

    const columns = useMemo<ColumnDef<KassaRow>[]>(
        () => [
            {
                header: "Sana",
                accessorKey: "created",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <DateCell v={row.original.created} />
                        {row.original.edited_at && <span className="text-xs text-muted-foreground">o'zgartirilgan</span>}
                    </div>
                ),
            },
            { header: "Kim tomonidan", accessorKey: "executor_name", cell: ({ row }) => <span className="text-muted-foreground">{row.original.executor_name || "—"}</span> },
            { header: "Kimdan / kimga", accessorKey: "party", cell: ({ row }) => <Party name={row.original.party} trip={row.original.trip} /> },
            {
                header: "Nima uchun",
                accessorKey: "kind_label",
                cell: ({ row }) => row.original.kind_label + (row.original.expense_type ? ` · ${row.original.expense_type}` : ""),
            },
            {
                header: "Umumiy summa",
                accessorKey: "amount",
                cell: ({ row }) => {
                    const r = row.original
                    const body = (
                        <>
                            <Money v={r.amount} dir={r.dir} />
                            {r.close && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap underline decoration-dotted underline-offset-2">
                                    {r.dir === "in" ? "kassa haydovchidan oladi" : "kassa haydovchiga beradi"}
                                </span>
                            )}
                        </>
                    )
                    if (!r.close) return <div className={cn("flex flex-col", r.reversed && "line-through opacity-60")}>{body}</div>
                    return (
                        <button
                            type="button"
                            title="Batafsil"
                            onClick={(e) => { e.stopPropagation(); openDetail(r) }}
                            className={cn("flex flex-col items-start text-left rounded-md -mx-1.5 px-1.5 py-0.5 hover:bg-muted/80 cursor-pointer", r.reversed && "line-through opacity-60")}
                        >
                            {body}
                        </button>
                    )
                },
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
            onRowClick={(r: KassaRow) => r.close && openDetail(r)}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            paginationProps={paginationProps(data?.total_pages)}
            rowAction={(row: KassaRow) => {
                const q = row.req
                if (q && q.status === STATUS.REJECTED) {
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <Badge variant="destructive" className="w-fit whitespace-nowrap">Rad etilgan</Badge>
                                <Button size="sm" variant="outline" className="h-8 gap-1" disabled={isPending} onClick={() => act(`${KV2_REQUESTS}/${q.id}/unreject`, "Rad etish bekor qilindi, so'rov yana kutilmoqda")}>
                                    <RotateCcw size={14} />
                                    Qaytarish
                                </Button>
                            </div>
                            {q.rejected_comment && <span className="text-xs text-muted-foreground max-w-56 text-right">{q.rejected_comment}</span>}
                        </div>
                    )
                }
                if (q) {
                    if (cashier) {
                        const out = KIND_DIR[q.kind] === "out"
                        const short = out && balance < n(q.amount)
                        return (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1">
                                    <Button size="sm" className="h-8 gap-1" disabled={short || isPending} onClick={() => (q.close ? openDetail(row) : onPay(q))}>
                                        <Check size={16} />
                                        {out ? "Berdim" : "Oldim"}
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => onReject(q)}>
                                        <X size={16} />
                                        Rad etish
                                    </Button>
                                </div>
                                {short && <span className="text-xs text-destructive whitespace-nowrap">Kassada yetarli pul yo'q</span>}
                            </div>
                        )
                    }
                    return (
                        <div className="flex items-center gap-2 justify-end">
                            <Badge variant="orange" className="w-fit whitespace-nowrap">Kutilmoqda</Badge>
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
                if (r.can_edit) return <TableActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
                if (r.can_reverse) return <TableActions onUndo={() => onReverse(r)} />
                return null
            }}
            head={
                <Head
                    left={<>{switcher}{group && (
                        <Badge variant="secondary" className="gap-1.5 cursor-pointer" onClick={onClearGroup}>
                            {groupLabel}
                            <X size={12} />
                        </Badge>
                    )}{!!pendingCount && <Badge variant="orange">{pendingCount} ta so'rov kutilmoqda</Badge>}</>}
                    right={<>
                        <Filter value={kindF} onChange={setKindF} options={KIND_FILTERS} />
                        <Filter value={dir} onChange={setDir} options={[["all", "Kirim va chiqim"], ["in", "Faqat kirim"], ["out", "Faqat chiqim"]]} />
                        <Button onClick={() => excelModal.openModal()}>
                            <Download size={16} />
                            Excel
                        </Button>
                        <ExcelModal />
                        <CloseDetailModal row={detail} onReject={onReject} />
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

export const RequestsTable = ({ switcher, onReject, onPay, onEdit, actions }: {
    switcher: ReactNode
    onReject: (r: KassaRequest) => void
    onPay: (r: KassaRequest) => void
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
                cell: ({ row }) => row.original.close ? "Aylanmani yopish" : row.original.kind_label + (row.original.expense_type_label ? ` · ${row.original.expense_type_label}` : ""),
            },
            { header: "Kimga / nimaga", id: "who", cell: ({ row }) => <Party name={requestWho(row.original)} trip={row.original.trip} /> },
            {
                header: "Izoh",
                accessorKey: "comment",
                cell: ({ row }) => row.original.close ? <CloseLines c={row.original.close} /> : (
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
                                <Button size="sm" className="h-8 gap-1" disabled={short || isPending} onClick={() => onPay(r)}>
                                    <Check size={16} />
                                    {out ? "Berdim" : "Oldim"}
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => onReject(r)}>
                                    <X size={16} />
                                    Rad etish
                                </Button>
                                {operator && <TableActions onEdit={r.close ? undefined : () => onEdit(r)} onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, "So'rov bekor qilindi")} />}
                            </div>
                            {short && <span className="text-xs text-destructive whitespace-nowrap">Kassada yetarli pul yo'q</span>}
                        </div>
                    )
                }
                if (r.status === STATUS.PENDING && operator)
                    return (
                        <div className="flex items-center gap-2 justify-end">
                            <Badge variant="orange" className="w-fit whitespace-nowrap">Kutilmoqda</Badge>
                            <TableActions onEdit={r.close ? undefined : () => onEdit(r)} onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, "So'rov bekor qilindi")} />
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
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1"
                                    disabled={isPending}
                                    onClick={() => (r.close ? act(`${KV2_REQUESTS}/${r.id}/resend`, "So'rov qayta yuborildi") : onEdit(r))}
                                >
                                    <Pencil size={14} />
                                    {r.close ? "Qayta hisoblab yuborish" : "Tuzatib qayta yuborish"}
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

const TRIP_STATUS: Record<TripStatus, [string, "orange" | "default" | "secondary" | "destructive"]> = {
    avans_kutilmoqda: ["Avans kutilmoqda", "orange"],
    avans_rad_etildi: ["Avans rad etildi", "destructive"],
    yolda: ["Yo'lda", "default"],
    yopilmoqda: ["Yopish kutilmoqda", "orange"],
    rad_etildi: ["Yopish rad etildi", "destructive"],
    yopildi: ["Yopildi", "secondary"],
}

export const TripsTable = ({ switcher, onPay, onReject, onReverse, actions }: {
    switcher: ReactNode
    onPay: (r: KassaRequest) => void
    onReject: (r: KassaRequest) => void
    onReverse: (r: KassaTx) => void
    actions?: ReactNode
}) => {
    const { cashier } = useKassaRoles()
    const period = usePeriod()
    const { data, isLoading } = useGet<KassaTrip[]>(KV2_TRIPS, { params: period })
    const { data: ov } = useOverview()
    const balance = n(ov?.balance)
    const { mutate: postReq, isPending: posting } = useKassaPost()
    const unreject = (q: KassaRequest) =>
        postReq(`${KV2_REQUESTS}/${q.id}/unreject`, {}, {
            onSuccess: () => toast.success("Rad etish bekor qilindi, so'rov yana kutilmoqda"),
            onError: (e: unknown) => toast.error(errorText(e)),
        })
    const undoBtn = (q: KassaRequest) => (
        <Button size="sm" variant="outline" className="h-8 gap-1" disabled={posting} onClick={() => unreject(q)}>
            <RotateCcw size={14} />
            Rad etishni qaytarish
        </Button>
    )
    const detailModal = useModal(DETAIL_MODAL)
    const [detail, setDetail] = useState<KassaRow | null>(null)
    const openDetail = (t: KassaTrip) => {
        if (!t.close_request) return
        setDetail(requestRow(t.close_request))
        detailModal.openModal()
    }
    const columns = useMemo<ColumnDef<KassaTrip>[]>(
        () => [
            {
                header: "Aylanma davri",
                id: "period",
                cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{tripPeriod(row.original.start, row.original.end)}</span>,
            },
            {
                header: "Mashina / haydovchi",
                accessorKey: "plate",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="whitespace-nowrap tabular-nums">{row.original.plate || "—"}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{row.original.driver_name || "—"}</span>
                    </div>
                ),
            },
            {
                header: "Berilgan avans",
                id: "given",
                cell: ({ row }) => {
                    const t = row.original
                    return (
                        <div className="flex flex-col">
                            <Part v={t.given} sign="−" />
                            {t.avans_request && (
                                <span className={cn("text-xs whitespace-nowrap", t.avans_request.status === STATUS.REJECTED ? "text-destructive" : "text-orange-500")}>
                                    {t.avans_request.status === STATUS.REJECTED ? "rad etilgan" : "so'ralgan"}: {money(t.avans_request.amount)}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: "Holat",
                id: "status",
                cell: ({ row }) => {
                    const t = row.original
                    const [label, variant] = TRIP_STATUS[t.status]
                    return (
                        <div className="flex flex-col gap-0.5">
                            <Badge variant={variant} className="w-fit whitespace-nowrap">{label}</Badge>
                            {t.status === "rad_etildi" && t.close_request?.rejected_comment && (
                                <span className="text-xs text-muted-foreground max-w-48">{t.close_request.rejected_comment}</span>
                            )}
                            {t.status === "avans_rad_etildi" && t.avans_request?.rejected_comment && (
                                <span className="text-xs text-muted-foreground max-w-48">{t.avans_request.rejected_comment}</span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: "Umumiy summa",
                id: "net",
                cell: ({ row }) => {
                    const q = row.original.close_request
                    if (!q) return <span className="text-muted-foreground">—</span>
                    const r = requestRow(q)
                    return (
                        <div className="flex flex-col">
                            <Money v={r.amount} dir={r.dir} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap underline decoration-dotted underline-offset-2">
                                {r.dir === "in" ? "kassa haydovchidan oladi" : "kassa haydovchiga beradi"}
                            </span>
                        </div>
                    )
                },
            },
        ],
        [],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={data}
            onRowClick={(t: KassaTrip) => openDetail(t)}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            rowAction={(t: KassaTrip) => {
                const av = t.avans_request
                if (av && av.status === STATUS.REJECTED) return av.can_unreject ? undoBtn(av) : null
                if (t.status === "rad_etildi" && t.close_request?.can_unreject) return undoBtn(t.close_request)
                if (av && cashier) {
                    const short = balance < n(av.amount)
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <Button size="sm" className="h-8 gap-1" disabled={short} onClick={() => onPay(av)}>
                                    <Check size={16} />
                                    Avans berdim
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => onReject(av)}>
                                    <X size={16} />
                                    Rad etish
                                </Button>
                            </div>
                            {short && <span className="text-xs text-destructive whitespace-nowrap">Kassada yetarli pul yo'q</span>}
                        </div>
                    )
                }
                if (t.status === "yopildi") {
                    const q = t.close_request
                    return q?.reverse_tx ? <TableActions onUndo={() => onReverse({ ...requestRow(q), id: q.reverse_tx as number })} /> : null
                }
                const ready = t.status === "yopilmoqda"
                return (
                    <Button
                        size="sm"
                        variant={ready ? "default" : "outline"}
                        className="h-8"
                        disabled={!ready || !cashier}
                        title={ready ? "Hisobni ko'rish va tasdiqlash" : t.status === "rad_etildi" ? "Operator tuzatib qayta yuborishi kerak" : "Menejer aylanmani hali yakunlamagan"}
                        onClick={() => openDetail(t)}
                    >
                        Yopish
                    </Button>
                )
            }}
            head={
                <Head
                    left={switcher}
                    right={<>
                        <CloseDetailModal row={detail} onReject={onReject} />
                        {actions}
                    </>}
                />
            }
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
