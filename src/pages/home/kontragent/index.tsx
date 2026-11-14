import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CONTRAGENT_TYPES, ContragentType, Kontragent, TYPE_STYLE, amountText, num, som, useKontragentSummary, useKontragents } from "./api"
import { AddContragentForm, CONTRAGENT_CREATE } from "./forms"

const Stat = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "red" | "green" }) => (
    <Card>
        <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn("text-2xl font-semibold tabular-nums", tone === "red" && "text-destructive", tone === "green" && "text-green-600")}>{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </CardContent>
    </Card>
)

export const BalanceCell = ({ value }: { value: number }) => {
    const { t } = useTranslation()
    if (!value) return <span className="text-muted-foreground">{t("contragent.settled")}</span>
    return (
        <div className="flex flex-col">
            <span className={cn("tabular-nums font-semibold", value > 0 ? "text-destructive" : "text-green-600")}>{amountText(Math.abs(value))}</span>
            <span className="text-xs text-muted-foreground">{t(value > 0 ? "contragent.we_owe" : "contragent.they_owe")}</span>
        </div>
    )
}

type RowType = ContragentType | "petrol"
type Row = Omit<Kontragent, "type"> & { type: RowType; stationId?: number }

const ROW_STYLE: Record<RowType, string> = {
    ...TYPE_STYLE,
    petrol: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
}

const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${som(Math.abs(v))}`

const ContragentsPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { openModal } = useModal(CONTRAGENT_CREATE)
    const { data: all = [], isLoading } = useKontragents()
    const { data: summary } = useKontragentSummary()
    const [type, setType] = useState<RowType | "all">("all")

    const stationRows = useMemo<Row[]>(
        () =>
            (summary?.stations ?? []).map((st) => ({
                id: -st.id,
                stationId: st.id,
                name: st.name,
                phone: "",
                type: "petrol",
                comment: "",
                balance: st.balance,
                taken: "0",
                given: "0",
                pending: "0",
                count: 0,
                last: null,
                invested_usd: "0",
            })),
        [summary?.stations],
    )
    const allRows = useMemo<Row[]>(() => [...all, ...stationRows], [all, stationRows])
    const rows = type === "all" ? allRows : allRows.filter((r) => r.type === type)
    const open = (id: number) => navigate({ to: "/kontragentlar/$id", params: { id: String(id) } })
    const openRow = (r: Row) =>
        r.stationId ?
            navigate({ to: "/petrol-stations/$id", params: { id: String(r.stationId) } })
        :   open(r.id)
    const net = num(summary?.net)

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("contragent.fields.name"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.phone && <span className="text-xs text-muted-foreground">{row.original.phone}</span>}
                        {row.original.inn && <span className="text-xs text-muted-foreground">INN {row.original.inn}</span>}
                    </div>
                ),
            },
            {
                accessorKey: "type",
                header: t("contragent.fields.type"),
                cell: ({ row }) => (
                    <Badge variant="outline" className={cn("font-medium", ROW_STYLE[row.original.type])}>
                        {t(`contragent.type.${row.original.type}`)}
                    </Badge>
                ),
            },
            { accessorKey: "balance", header: t("contragent.fields.balance"), cell: ({ row }) => <BalanceCell value={num(row.original.balance)} /> },
            { accessorKey: "count", header: t("contragent.fields.tx_count"), cell: ({ row }) => <span className="tabular-nums">{row.original.stationId ? "—" : row.original.count}</span> },
            {
                accessorKey: "last",
                header: t("contragent.fields.last"),
                cell: ({ row }) => (row.original.last ? format(new Date(row.original.last), "dd.MM.yyyy") : "—"),
            },
            { accessorKey: "comment", header: t("contragent.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">{t("contragent.title")}</h1>
                <Button onClick={openModal}>
                    <Plus className="w-4 h-4" />
                    {t("contragent.add")}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat
                    label={t("contragent.stat_we_owe")}
                    value={som(summary?.total_we_owe ?? summary?.we_owe ?? 0)}
                    sub={`${t("contragent.stat_count", { count: summary?.total_we_owe_count ?? summary?.we_owe_count ?? 0 })} · ${t("contragent.with_stations")}`}
                    tone="red"
                />
                <Stat
                    label={t("contragent.stat_they_owe")}
                    value={som(summary?.total_they_owe ?? summary?.they_owe ?? 0)}
                    sub={`${t("contragent.stat_count", { count: summary?.total_they_owe_count ?? summary?.they_owe_count ?? 0 })} · ${t("contragent.with_stations")}`}
                    tone="green"
                />
                <Stat
                    label={t("contragent.stat_net")}
                    value={signed(net)}
                    sub={t("contragent.stat_net_sub")}
                    tone={net < 0 ? "red" : net > 0 ? "green" : undefined}
                />
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                    <Tabs value={type} onValueChange={(v) => setType(v as RowType | "all")}>
                        <TabsList>
                            <TabsTrigger value="all">{t("contragent.all")} ({allRows.length})</TabsTrigger>
                            {CONTRAGENT_TYPES.map((ct) => (
                                <TabsTrigger key={ct} value={ct}>
                                    {t(`contragent.type.${ct}`)} ({all.filter((r) => r.type === ct).length})
                                </TabsTrigger>
                            ))}
                            {stationRows.length > 0 && (
                                <TabsTrigger value="petrol">
                                    {t("contragent.type.petrol")} ({stationRows.length})
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </Tabs>
                    <DataTable columns={columns} data={rows} loading={isLoading} numeration wrapperClassName="p-0" onRowClick={openRow} />
                </CardContent>
            </Card>

            <Modal title={t("contragent.add")} modalKey={CONTRAGENT_CREATE}>
                <AddContragentForm onCreated={open} />
            </Modal>
        </div>
    )
}

export default ContragentsPage
