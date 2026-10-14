import ParamDateRange from "@/components/as-params/date-picker-range"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { endOfMonth, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"
import { ArrowDownCircle, X } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { KassaRequest, KassaTrip, KassaTx, KIND_DIR, KV2_REQUESTS, KV2_TRIPS, n, Paged, STATUS, useAllPeriodTx, useKassaRoles, useOverview, usePeriod } from "./api"
import { CloseTripModal, DeleteIncomeModal, IncomeModal, M, PayModal, RejectModal, RequestModal, ReverseModal } from "./modals"
import { DriverExpensesTable, KassaTable, LedgerTable, RequestsTable, TripsTable } from "./tables"

const Line = ({ label, value, strong, sub, tone, onClick, active }: { label: ReactNode; value: number | string | null | undefined; strong?: boolean; sub?: boolean; tone?: "green" | "red"; onClick?: () => void; active?: boolean }) => {
    const { t } = useTranslation()
    return (
    <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        className={cn(
            "flex items-center justify-between gap-2",
            sub && "pl-3 text-muted-foreground",
            onClick && "cursor-pointer rounded-md -mx-1.5 px-1.5 py-0.5 hover:bg-muted/80",
            onClick && sub && "pl-4",
            active && "bg-primary/15 ring-1 ring-inset ring-primary",
        )}
    >
        <span className={cn(strong ? "font-semibold text-foreground" : "", sub ? "text-xs" : "text-sm")}>{label}</span>
        <span className={cn("tabular-nums whitespace-nowrap", strong ? "font-semibold" : "", sub ? "text-xs" : "text-sm", tone === "green" && "text-green-600", tone === "red" && "text-destructive")}>
            {formatMoney(n(value))} {t("page.som")}
        </span>
    </div>
    )
}

const Box = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("rounded-lg border p-3 flex flex-col gap-1.5", className)}>{children}</div>
)

type View = "kassa" | "requests" | "trips" | "driver" | "expenses"

const TABS: [View, string][] = [["trips", "fin.kv2.tab_trips"], ["kassa", "fin.kv2.tab_transactions"]]

const KassaV2 = () => {
    const { t } = useTranslation()
    const { cashier, operator } = useKassaRoles()
    const period = usePeriod()
    const { from_date } = period
    const { data: tripsData } = useGet<KassaTrip[]>(KV2_TRIPS, { params: period })
    const txAll = useAllPeriodTx(period)
    const { data: reqData } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params: { status: `${STATUS.PENDING},${STATUS.REJECTED}`, page_size: 1000 } })
    const txCount = useMemo(() => {
        if (!txAll) return undefined
        const closes = new Set(txAll.filter((t) => t.close).map((t) => t.close!.id))
        const plain = txAll.filter((t) => !t.close).length
        const reqs = (reqData?.results ?? []).filter((q) => !q.trip && (q.status === STATUS.PENDING || q.can_unreject)).length
        return plain + closes.size + reqs
    }, [txAll, reqData])
    const counts: Partial<Record<View, number | undefined>> = { trips: tripsData?.length, kassa: txCount }
    const { data: ov } = useOverview()
    const sm = ov?.summary
    const [view, setView] = useState<View>("trips")
    const [group, setGroup] = useState<string | null>(null)
    const pick = (g: string, labelKey: string) => () => {
        setDriver(null)
        setView("kassa")
        setGroup(group === g ? null : g)
        setGroupLabel(labelKey)
    }
    const [groupLabel, setGroupLabel] = useState("")
    const lineProps = (g: string, labelKey: string) => ({ onClick: pick(g, labelKey), active: view === "kassa" && group === g })
    const [expKind, setExpKind] = useState<"fuel" | "other">("fuel")
    const expProps = (k: "fuel" | "other") => ({
        onClick: () => {
            setDriver(null)
            if (view === "expenses" && expKind === k) return setView("kassa")
            setExpKind(k)
            setView("expenses")
        },
        active: view === "expenses" && expKind === k,
    })
    const [driver, setDriver] = useState<number | null>(null)
    const [editing, setEditing] = useState<KassaRequest | null>(null)
    const [rejecting, setRejecting] = useState<KassaRequest | null>(null)
    const [paying, setPaying] = useState<KassaRequest | null>(null)
    const [closing, setClosing] = useState<KassaTrip | null>(null)
    const [incomeRow, setIncomeRow] = useState<KassaTx | null>(null)
    const [reverseRow, setReverseRow] = useState<KassaTx | null>(null)

    const income = useModal(M.income)
    const delIncome = useModal(M.deleteIncome)
    const request = useModal(M.request)
    const reject = useModal(M.reject)
    const pay = useModal(M.pay)
    const close = useModal(M.close)
    const reverseM = useModal(M.reverse)

    const switcher = (
        <Tabs value={view === "trips" ? "trips" : "kassa"} onValueChange={(v) => { setDriver(null); setGroup(null); setView(v as View) }}>
            <TabsList>
                {TABS.map(([v, labelKey]) => (
                    <TabsTrigger key={v} value={v}>{t(labelKey)}{counts[v] != null ? ` (${counts[v]})` : ""}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
    const drivers = [...(ov?.drivers ?? [])].sort((a, b) => n(b.balance) - n(a.balance))
    const selected = drivers.find((d) => d.id === driver)

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-3 xl:h-full min-h-0">
            <Card className="xl:h-full min-h-0 overflow-hidden">
                <CardContent className="p-3 flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                    <ParamDateRange className="w-full" from="from_date" to="to_date" defaultValue={{ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }} addButtonProps={{ className: "w-full justify-start !bg-muted/50" }} />

                    <Box className="bg-primary/5 border-primary/30">
                        <Line strong label={from_date ? t("fin.kv2.closing_balance") : t("fin.kv2.cash_balance")} value={sm?.closing ?? ov?.balance} tone={n(sm?.closing ?? ov?.balance) < 0 ? "red" : undefined} />
                        {from_date && <Line sub label={t("fin.kv2.opening_balance")} value={sm?.opening} />}
                    </Box>
                    <Box className="bg-green-600/5 border-green-600/30">
                        <Line strong tone="green" label={t("kassa.report_income")} value={sm?.income.total} />
                        <Line sub label={t("fin.kv2.from_external")} value={sm?.income.external} {...lineProps("in_external", "fin.kv2.from_external")} />
                        <Line sub label={t("fin.kv2.trip_cash")} value={sm?.income.trip_cash} />
                        {!!n(sm?.income.reversals) && <Line sub label={t("fin.kv2.reversed_expenses")} value={sm?.income.reversals} {...lineProps("in_reversals", "fin.kv2.reversed_expenses")} />}
                    </Box>
                    <Box className="bg-red-600/5 border-red-600/30">
                        <Line strong tone="red" label={t("fin.kv2.expense")} value={-n(sm?.expense.total)} />
                        <Line sub label={t("fin.kv2.expense_fuel")} value={-n(sm?.expense.fuel)} {...expProps("fuel")} />
                        <Line sub label={t("fin.kv2.expense_other")} value={-n(sm?.expense.other)} {...expProps("other")} />
                        <Line sub label={t("table.monthly_salary")} value={-n(sm?.expense.oylik)} {...lineProps("out_oylik", "table.monthly_salary")} />
                        <Line sub label={t("fin.kv2.garage_cash_expense")} value={-n(sm?.expense.garaj)} {...lineProps("out_garaj", "fin.kv2.garage_cash_expense")} />
                        {!!n(sm?.expense.reversals) && <Line sub label={t("fin.kv2.reversed_incomes")} value={-n(sm?.expense.reversals)} {...lineProps("out_reversals", "fin.kv2.reversed_incomes")} />}
                    </Box>
                    <p className="text-[11px] text-muted-foreground px-1">
                        {from_date ? t("fin.kv2.formula_with_opening") : t("fin.kv2.formula")}
                    </p>

                    <div className="rounded-lg border border-muted-foreground/20 bg-muted/20 p-3 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-muted-foreground/20">
                            <p className="text-sm font-medium text-muted-foreground">{t("fin.kv2.drivers_holding", { count: drivers.length })}</p>
                            <span className="text-sm font-semibold tabular-nums">{formatMoney(n(ov?.drivers_total))}</span>
                        </div>
                        <div className="space-y-0.5">
                            {drivers.map((d, i) => (
                                <div
                                    key={d.id}
                                    onClick={() => { setDriver(d.id); setView("driver") }}
                                    className={cn(
                                        "flex items-center justify-between py-1.5 -mx-2 px-2 rounded-md cursor-pointer hover:bg-muted/80",
                                        driver === d.id && view === "driver" && "bg-primary/10",
                                    )}
                                >
                                    <span className="text-sm flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                                        <span className="truncate" title={d.name}>{d.name}</span>
                                        {d.plate && <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{d.plate}</span>}
                                    </span>
                                    <span className={cn("text-sm font-medium tabular-nums whitespace-nowrap shrink-0 pl-3", n(d.balance) < 0 && "text-destructive")}>{formatMoney(n(d.balance))}</span>
                                </div>
                            ))}
                            {!drivers.length && <p className="text-xs text-muted-foreground">{t("fin.kv2.no_trips_yet")}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="w-full min-w-0 xl:h-full min-h-0">
                {view === "driver" && selected ?
                    <LedgerTable
                        driver={selected.id}
                        head={
                            <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {switcher}
                                    <Badge className="gap-1.5 cursor-pointer" onClick={() => { setDriver(null); setView("kassa") }}>
                                        {selected.name}{selected.plate ? ` · ${selected.plate}` : ""}
                                        <X size={12} />
                                    </Badge>
                                </div>
                                <span className="text-sm">
                                    {t("fin.kv2.balance_label")} <b className="tabular-nums">{formatMoney(n(selected.balance))} {t("page.som")}</b>
                                </span>
                            </div>
                        }
                    />
                : view === "expenses" ?
                    <DriverExpensesTable
                        kind={expKind}
                        head={
                            <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {switcher}
                                    <Badge className="gap-1.5 cursor-pointer" onClick={() => setView("kassa")}>
                                        {t(expKind === "fuel" ? "fin.kv2.expense_fuel" : "fin.kv2.expense_other")}
                                        <X size={12} />
                                    </Badge>
                                </div>
                                <span className="text-sm">
                                    <b className="tabular-nums">{formatMoney(n(expKind === "fuel" ? sm?.expense.fuel : sm?.expense.other))} {t("page.som")}</b>
                                </span>
                            </div>
                        }
                    />
                : view === "requests" ?
                    <RequestsTable
                        switcher={switcher}
                        onReject={(r) => { setRejecting(r); reject.openModal() }}
                        onPay={(r) => { setPaying(r); pay.openModal() }}
                        onEdit={(r) => { setEditing(r); request.openModal() }}
                    />
                : view === "trips" ?
                    <TripsTable
                        switcher={switcher}
                        onPay={(r) => { setPaying(r); pay.openModal() }}
                        onReject={(r) => { setRejecting(r); reject.openModal() }}
                        onReverse={(r) => { setReverseRow(r); reverseM.openModal() }}
                    />
                :   <KassaTable
                        switcher={switcher}
                        group={group}
                        groupLabel={groupLabel ? t(groupLabel) : ""}
                        onClearGroup={() => setGroup(null)}
                        onEdit={(r) => { setIncomeRow(r); income.openModal() }}
                        onDelete={(r) => { setIncomeRow(r); delIncome.openModal() }}
                        onReverse={(r) => { setReverseRow(r); reverseM.openModal() }}
                        onReject={(r) => { setRejecting(r); reject.openModal() }}
                        onPay={(r) => { setPaying(r); pay.openModal() }}
                        onEditRequest={(r) => { setEditing(r); request.openModal() }}
                        actions={<>
                            {cashier && <>
                            <Button onClick={() => { setIncomeRow(null); income.openModal() }}>
                                <ArrowDownCircle size={16} />
                                {t("fin.kv2.cash_in")}
                            </Button>
                            </>}
                        </>}
                    />
                }
            </div>

            <Modal modalKey={M.income} title={incomeRow ? t("fin.kv2.edit_income") : t("fin.kv2.cash_in")} size="max-w-md"><IncomeModal editing={incomeRow} /></Modal>
            <Modal modalKey={M.deleteIncome} title={t("fin.kv2.delete_income")} size="max-w-md"><DeleteIncomeModal row={incomeRow} /></Modal>
            <Modal modalKey={M.request} title={!editing ? t("vst.new_request") : editing.status === 10 ? t("fin.kv2.edit_request") : t("fin.kv2.fix_request")} size="max-w-md"><RequestModal editing={editing} /></Modal>
            <Modal modalKey={M.reject} title={t("kassa.reject_title")} size="max-w-md"><RejectModal request={rejecting} /></Modal>
            <Modal modalKey={M.pay} title={paying && KIND_DIR[paying.kind] === "out" ? t("fin.kv2.give_money") : t("fin.kv2.receive_money")} size="max-w-md"><PayModal request={paying} /></Modal>
            <Modal modalKey={M.close} title={closing ? t("fin.kv2.close_trip_title", { id: closing.id }) : ""} size="max-w-xl"><CloseTripModal trip={closing} /></Modal>
            <Modal modalKey={M.reverse} title={t("fin.kv2.reverse_action")} size="max-w-md"><ReverseModal row={reverseRow} /></Modal>
        </div>
    )
}

export default KassaV2
