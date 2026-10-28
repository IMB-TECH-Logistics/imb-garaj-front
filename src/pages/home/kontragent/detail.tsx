import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowDownLeft, ArrowLeft, ArrowUpRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CONTRAGENT_TX, ContragentTxForm } from "./forms"
import { ContragentTxDir, ContragentTxRow, TYPE_STYLE, contragentLedger, contragentRows, som, useContragentStore } from "./store"

const ContragentDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const contragents = useContragentStore((s) => s.contragents)
    const txs = useContragentStore((s) => s.txs)
    const { openModal } = useModal(CONTRAGENT_TX)
    const [dir, setDir] = useState<ContragentTxDir>("in")

    const row = useMemo(() => contragentRows(contragents, txs).find((r) => r.id === id), [contragents, txs, id])
    const ledger = useMemo(() => contragentLedger(txs.filter((tx) => tx.contragent_id === id)), [txs, id])
    const totalIn = ledger.reduce((s, r) => s + (r.dir === "in" ? r.amount : 0), 0)
    const totalOut = ledger.reduce((s, r) => s + (r.dir === "out" ? r.amount : 0), 0)

    const cols = useMemo<ColumnDef<ContragentTxRow>[]>(
        () => [
            { accessorKey: "date", header: t("contragent.fields.date"), cell: ({ row }) => format(new Date(row.original.date), "dd.MM.yyyy") },
            {
                accessorKey: "dir",
                header: t("contragent.fields.kind"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-medium",
                                row.original.dir === "in" ?
                                    "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                :   "bg-green-500/10 text-green-600 border-green-500/30",
                            )}
                        >
                            {t(row.original.dir === "in" ? "contragent.tx.in" : "contragent.tx.out")}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{t(`contragent.kind.${row.original.kind}`)}</span>
                    </div>
                ),
            },
            {
                accessorKey: "amount",
                header: t("contragent.fields.amount"),
                cell: ({ row }) => (
                    <span className={cn("tabular-nums font-medium whitespace-nowrap", row.original.dir === "in" ? "text-amber-600" : "text-green-600")}>
                        {row.original.dir === "in" ? "+" : "−"} {som(row.original.amount)}
                    </span>
                ),
            },
            {
                accessorKey: "balance",
                header: t("contragent.fields.balance"),
                cell: ({ row }) => {
                    const v = row.original.balance
                    return (
                        <span className={cn("tabular-nums font-semibold whitespace-nowrap", v > 0 && "text-destructive", v < 0 && "text-green-600")}>
                            {v ? `${som(Math.abs(v))} · ${t(v > 0 ? "contragent.we_owe_short" : "contragent.they_owe_short")}` : t("contragent.settled")}
                        </span>
                    )
                },
            },
            { accessorKey: "comment", header: t("contragent.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
        ],
        [t],
    )

    if (!row) {
        return (
            <div className="flex flex-col items-start gap-3">
                <Button variant="ghost" onClick={() => navigate({ to: "/kontragentlar" })}>
                    <ArrowLeft className="w-4 h-4" />
                    {t("contragent.title")}
                </Button>
                <p className="text-muted-foreground">{t("contragent.not_found")}</p>
            </div>
        )
    }

    const openTx = (d: ContragentTxDir) => {
        setDir(d)
        openModal()
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Button variant="ghost" size="icon" aria-label={t("contragent.title")} onClick={() => navigate({ to: "/kontragentlar" })}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold truncate">{row.name}</h1>
                            <Badge variant="outline" className={cn("font-medium", TYPE_STYLE[row.type])}>{t(`contragent.type.${row.type}`)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{[row.phone, row.comment].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => openTx("in")}>
                        <ArrowDownLeft className="w-4 h-4" />
                        {t("contragent.tx.in_btn")}
                    </Button>
                    <Button variant="outline" onClick={() => openTx("out")}>
                        <ArrowUpRight className="w-4 h-4" />
                        {t("contragent.tx.out_btn")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t("contragent.tx.in_total")}</span>
                        <span className="text-2xl font-semibold tabular-nums">{som(totalIn)}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t("contragent.tx.out_total")}</span>
                        <span className="text-2xl font-semibold tabular-nums">{som(totalOut)}</span>
                    </CardContent>
                </Card>
                <Card className={cn(row.balance > 0 && "border-destructive/40", row.balance < 0 && "border-green-600/40")}>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">
                            {row.balance ? t(row.balance > 0 ? "contragent.we_owe" : "contragent.they_owe") : t("contragent.fields.balance")}
                        </span>
                        <span className={cn("text-2xl font-semibold tabular-nums", row.balance > 0 && "text-destructive", row.balance < 0 && "text-green-600")}>
                            {row.balance ? som(Math.abs(row.balance)) : t("contragent.settled")}
                        </span>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                    <h2 className="text-base font-semibold">{t("contragent.tx.title")} ({ledger.length})</h2>
                    <DataTable columns={cols} data={ledger} numeration wrapperClassName="p-0" />
                </CardContent>
            </Card>

            <Modal title={t(dir === "in" ? "contragent.tx.in_btn" : "contragent.tx.out_btn")} modalKey={CONTRAGENT_TX}>
                <ContragentTxForm key={dir} contragentId={id} dir={dir} />
            </Modal>
        </div>
    )
}

export default ContragentDetail
