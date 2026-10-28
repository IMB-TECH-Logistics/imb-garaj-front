import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"
import { Download } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { KassaTx, KV2_EXCEL, KV2_TRANSACTIONS, n } from "./api"

export const OPENING_MODAL = "kassa-v2-opening"

const PAGE_LIMIT = 1000

export const OpeningLedgerModal = ({ fromDate, opening }: { fromDate: string; opening: number }) => {
    const { t } = useTranslation()
    const { isOpen } = useModal(OPENING_MODAL)
    const until = format(subDays(new Date(fromDate), 1), "yyyy-MM-dd")
    const params = { to_date: until }

    const { data, isLoading } = useGet<{ count: number; results: KassaTx[] }>(KV2_TRANSACTIONS, {
        params: { ...params, page_size: PAGE_LIMIT },
        enabled: isOpen,
    })
    const excel = useDownloadAsExcel({ url: KV2_EXCEL, name: `kassa_${t("fin.kv2.file_from_start")}_${until}`, params })

    const rows = useMemo(() => {
        let balance = 0
        return [...(data?.results ?? [])]
            .sort((a, b) => a.created.localeCompare(b.created) || a.id - b.id)
            .map((tx) => {
                const amount = n(tx.amount)
                balance += tx.dir === "in" ? amount : -amount
                return { tx, amount, balance }
            })
    }, [data])

    const totalIn = rows.reduce((s, r) => s + (r.tx.dir === "in" ? r.amount : 0), 0)
    const totalOut = rows.reduce((s, r) => s + (r.tx.dir === "in" ? 0 : r.amount), 0)
    const truncated = (data?.count ?? 0) > rows.length

    return (
        <Modal modalKey={OPENING_MODAL} title={t("fin.kv2.opening_ledger_title", { date: format(new Date(fromDate), "dd.MM.yyyy") })} size="max-w-6xl">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-stretch gap-2">
                    {[
                        [t("kassa.report_income"), totalIn, "text-green-600"],
                        [t("fin.kv2.opening_ledger_out"), -totalOut, "text-destructive"],
                        [t("fin.kv2.opening_balance"), opening, opening < 0 ? "text-destructive" : ""],
                    ].map(([label, value, cls]) => (
                        <div key={label as string} className="flex-1 min-w-[160px] rounded-lg border px-3 py-2 flex flex-col">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <span className={cn("font-semibold tabular-nums", cls as string)}>
                                {formatMoney(value as number)} {t("page.som")}
                            </span>
                        </div>
                    ))}
                    <Button variant="outline" className="self-center" loading={excel.isFetching} onClick={() => excel.trigger()}>
                        <Download size={16} />
                        Excel
                    </Button>
                </div>
                {truncated && <p className="text-xs text-amber-600">{t("fin.kv2.opening_ledger_truncated", { shown: rows.length, total: data?.count })}</p>}
                <div className="max-h-[60vh] overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted z-10">
                            <TableRow>
                                <TableHead className="w-10">№</TableHead>
                                <TableHead>{t("form.date")}</TableHead>
                                <TableHead>{t("fin.kv2.opening_ledger_kind")}</TableHead>
                                <TableHead>{t("fin.kv2.opening_ledger_party")}</TableHead>
                                <TableHead>{t("form.comment")}</TableHead>
                                <TableHead className="text-right">{t("kassa.report_income")}</TableHead>
                                <TableHead className="text-right">{t("fin.kv2.opening_ledger_out")}</TableHead>
                                <TableHead className="text-right">{t("fin.kv2.opening_ledger_balance")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">{t("page.loading")}</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && !rows.length && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">{t("fin.kv2.opening_ledger_empty")}</TableCell>
                                </TableRow>
                            )}
                            {rows.map(({ tx, amount, balance }, i) => (
                                <TableRow key={tx.id} className={cn(tx.reversed && "opacity-50")}>
                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                    <TableCell className="whitespace-nowrap">{format(new Date(tx.created), "dd.MM.yyyy HH:mm")}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "font-medium shrink-0",
                                                    tx.dir === "in" ?
                                                        "bg-green-500/10 text-green-600 border-green-500/30"
                                                    :   "bg-red-500/10 text-red-600 border-red-500/30",
                                                )}
                                            >
                                                {tx.dir === "in" ? t("kassa.report_income") : t("fin.kv2.opening_ledger_out")}
                                            </Badge>
                                            <span className="text-sm">
                                                {tx.kind_label}
                                                {tx.expense_type ? ` · ${tx.expense_type}` : ""}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{tx.party || "—"}</TableCell>
                                    <TableCell className="max-w-[260px] truncate" title={tx.comment ?? ""}>{tx.comment || "—"}</TableCell>
                                    <TableCell className="text-right tabular-nums text-green-600">{tx.dir === "in" ? formatMoney(amount) : ""}</TableCell>
                                    <TableCell className="text-right tabular-nums text-destructive">{tx.dir === "in" ? "" : formatMoney(-amount)}</TableCell>
                                    <TableCell className={cn("text-right tabular-nums font-semibold", balance < 0 && "text-destructive")}>{formatMoney(balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Modal>
    )
}
