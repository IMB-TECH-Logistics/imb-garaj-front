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
import { AddContragentForm, CONTRAGENT_CREATE } from "./forms"
import { CONTRAGENT_TYPES, ContragentRow, ContragentType, TYPE_STYLE, contragentRows, som, useContragentStore } from "./store"

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
            <span className={cn("tabular-nums font-semibold", value > 0 ? "text-destructive" : "text-green-600")}>{som(Math.abs(value))}</span>
            <span className="text-xs text-muted-foreground">{t(value > 0 ? "contragent.we_owe" : "contragent.they_owe")}</span>
        </div>
    )
}

const ContragentsPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { openModal } = useModal(CONTRAGENT_CREATE)
    const contragents = useContragentStore((s) => s.contragents)
    const txs = useContragentStore((s) => s.txs)
    const [type, setType] = useState<ContragentType | "all">("all")

    const all = useMemo(() => contragentRows(contragents, txs), [contragents, txs])
    const rows = type === "all" ? all : all.filter((r) => r.type === type)
    const weOwe = all.filter((r) => r.balance > 0)
    const theyOwe = all.filter((r) => r.balance < 0)
    const open = (id: number) => navigate({ to: "/kontragentlar/$id", params: { id: String(id) } })

    const columns = useMemo<ColumnDef<ContragentRow>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("contragent.fields.name"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.phone && <span className="text-xs text-muted-foreground">{row.original.phone}</span>}
                    </div>
                ),
            },
            {
                accessorKey: "type",
                header: t("contragent.fields.type"),
                cell: ({ row }) => (
                    <Badge variant="outline" className={cn("font-medium", TYPE_STYLE[row.original.type])}>
                        {t(`contragent.type.${row.original.type}`)}
                    </Badge>
                ),
            },
            { accessorKey: "balance", header: t("contragent.fields.balance"), cell: ({ row }) => <BalanceCell value={row.original.balance} /> },
            { accessorKey: "count", header: t("contragent.fields.tx_count"), cell: ({ row }) => <span className="tabular-nums">{row.original.count}</span> },
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
                    value={som(weOwe.reduce((s, r) => s + r.balance, 0))}
                    sub={t("contragent.stat_count", { count: weOwe.length })}
                    tone="red"
                />
                <Stat
                    label={t("contragent.stat_they_owe")}
                    value={som(-theyOwe.reduce((s, r) => s + r.balance, 0))}
                    sub={t("contragent.stat_count", { count: theyOwe.length })}
                    tone="green"
                />
                <Stat label={t("contragent.stat_total")} value={String(all.length)} />
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                    <Tabs value={type} onValueChange={(v) => setType(v as ContragentType | "all")}>
                        <TabsList>
                            <TabsTrigger value="all">{t("contragent.all")} ({all.length})</TabsTrigger>
                            {CONTRAGENT_TYPES.map((ct) => (
                                <TabsTrigger key={ct} value={ct}>
                                    {t(`contragent.type.${ct}`)} ({all.filter((r) => r.type === ct).length})
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    <DataTable columns={columns} data={rows} numeration wrapperClassName="p-0" onRowClick={(r) => open(r.id)} />
                </CardContent>
            </Card>

            <Modal title={t("contragent.add")} modalKey={CONTRAGENT_CREATE}>
                <AddContragentForm onCreated={open} />
            </Modal>
        </div>
    )
}

export default ContragentsPage
