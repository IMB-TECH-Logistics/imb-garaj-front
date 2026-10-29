import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Wallet } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { EntryDir, Kontragent, TYPE_STYLE, kontragentUrl, num, som } from "./api"
import { CONTRAGENT_CASH, CONTRAGENT_TX, CashForm, ContragentTxForm } from "./forms"
import { LedgerTable, useLedger } from "./ledger-table"

const ContragentDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { data: row, isLoading } = useGet<Kontragent>(kontragentUrl(id))
    const { data: ledger, isLoading: ledgerLoading } = useLedger(id)
    const { openModal: openTx } = useModal(CONTRAGENT_TX)
    const { openModal: openCash } = useModal(CONTRAGENT_CASH)
    const [dir, setDir] = useState<EntryDir>("in")
    const [cashDir, setCashDir] = useState<EntryDir>("in")

    const back = () => navigate({ to: "/kontragentlar" })

    if (!row) {
        return (
            <div className="flex flex-col items-start gap-3">
                <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="w-4 h-4" />
                    {t("contragent.title")}
                </Button>
                {!isLoading && <p className="text-muted-foreground">{t("contragent.not_found")}</p>}
            </div>
        )
    }

    const balance = num(row.balance)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Button variant="ghost" size="icon" aria-label={t("contragent.title")} onClick={back}>
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            setCashDir("in")
                            openCash()
                        }}
                    >
                        <Wallet className="w-4 h-4" />
                        {t("contragent.cash.in_btn")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setCashDir("out")
                            openCash()
                        }}
                    >
                        <Wallet className="w-4 h-4" />
                        {t("contragent.cash.out_btn")}
                    </Button>
                    <Button
                        onClick={() => {
                            setDir("in")
                            openTx()
                        }}
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        {t("contragent.tx.in_btn")}
                    </Button>
                    <Button
                        onClick={() => {
                            setDir("out")
                            openTx()
                        }}
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        {t("contragent.tx.out_btn")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t("contragent.tx.in_total")}</span>
                        <span className="text-2xl font-semibold tabular-nums">{som(row.taken)}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t("contragent.tx.out_total")}</span>
                        <span className="text-2xl font-semibold tabular-nums">{som(row.given)}</span>
                        {num(row.pending) > 0 && <span className="text-xs text-muted-foreground">{t("contragent.pending_sum", { amount: som(row.pending) })}</span>}
                    </CardContent>
                </Card>
                <Card className={cn(balance > 0 && "border-destructive/40", balance < 0 && "border-green-600/40")}>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">
                            {balance ? t(balance > 0 ? "contragent.we_owe" : "contragent.they_owe") : t("contragent.fields.balance")}
                        </span>
                        <span className={cn("text-2xl font-semibold tabular-nums", balance > 0 && "text-destructive", balance < 0 && "text-green-600")}>
                            {balance ? som(Math.abs(balance)) : t("contragent.settled")}
                        </span>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                    <h2 className="text-base font-semibold">{t("contragent.tx.title")} ({ledger?.length ?? 0})</h2>
                    <LedgerTable rows={ledger} loading={ledgerLoading} />
                </CardContent>
            </Card>

            <Modal title={t(dir === "in" ? "contragent.tx.in_btn" : "contragent.tx.out_btn")} modalKey={CONTRAGENT_TX}>
                <ContragentTxForm key={dir} contragentId={id} dir={dir} />
            </Modal>
            <Modal title={t(cashDir === "in" ? "contragent.cash.in_btn" : "contragent.cash.out_btn")} modalKey={CONTRAGENT_CASH}>
                <CashForm
                    key={cashDir}
                    contragentId={id}
                    dir={cashDir}
                    max={cashDir === "out" && (row.type === "investor" || row.type === "supplier") ? Math.max(balance, 0) : undefined}
                />
            </Modal>
        </div>
    )
}

export default ContragentDetail
