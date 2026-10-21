import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useTranslation } from "react-i18next"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { useMemo, useState } from "react"
import {
    KassaRequest,
    KassaTrip,
    KassaTx,
    KIND_DIR,
    KV2_REQUESTS,
    KV2_TRIPS,
    n,
    Paged,
    STATUS,
    useAllPeriodTx,
    useKassaRoles,
    useOverview,
    usePeriod,
} from "./api"
import { CloseTripModal, DeleteIncomeModal, IncomeModal, M, PayModal, RejectModal, RequestModal, ReverseModal } from "./modals"
import { DriverExpensesTable, KassaTable, LedgerTable, RequestsTable, TripsTable } from "./tables"
import { Exp, SummaryPanel } from "./summary-panel"
import { DriverHead, ExpensesHead } from "./view-head"

type View = "kassa" | "requests" | "trips" | "driver" | "expenses"

const TABS: [View, string][] = [["trips", "fin.kv2.tab_trips"], ["kassa", "fin.kv2.tab_transactions"]]

const KassaV2 = () => {
    const { t } = useTranslation()
    const { cashier } = useKassaRoles()
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
    const [exp, setExp] = useState<Exp | null>(null)
    const expProps = (e: Exp) => ({
        onClick: () => {
            setDriver(null)
            if (view === "expenses" && exp?.key === e.key) return setView("kassa")
            setExp(e)
            setView("expenses")
        },
        active: view === "expenses" && exp?.key === e.key,
    })
    const expenseLines = [
        { key: "fuel", kind: "fuel" as const, label: t("fin.kv2.expense_fuel"), amount: n(sm?.expense.fuel) },
        { key: "other", kind: "other" as const, label: t("fin.kv2.expense_other"), amount: n(sm?.expense.other) },
    ]
    const [driver, setDriver] = useState<number | null>(null)
    const [editing, setEditing] = useState<KassaRequest | null>(null)
    const [rejecting, setRejecting] = useState<KassaRequest | null>(null)
    const [paying, setPaying] = useState<KassaRequest | null>(null)
    const [closing, setClosing] = useState<KassaTrip | null>(null)
    const [incomeRow, setIncomeRow] = useState<KassaTx | null>(null)
    const [incomeOut, setIncomeOut] = useState(false)
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
            <SummaryPanel sm={sm} ov={ov} drivers={drivers} from_date={from_date} view={view} driver={driver} lineProps={lineProps} expProps={expProps} expenseLines={expenseLines} setDriver={setDriver} setView={setView} />

            <div className="w-full min-w-0 xl:h-full min-h-0">
                {view === "driver" && selected ?
                    <LedgerTable
                        driver={selected.id}
                        head={
                            <DriverHead switcher={switcher} selected={selected} setDriver={setDriver} setView={setView} />
                        }
                    />
                : view === "expenses" && exp ?
                    <DriverExpensesTable
                        kind={exp.kind}
                        head={
                            <ExpensesHead switcher={switcher} exp={exp} setView={setView} />
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
                        onEdit={(r) => { setIncomeRow(r); setIncomeOut(r.kind === "chiqim"); income.openModal() }}
                        onDelete={(r) => { setIncomeRow(r); setIncomeOut(r.kind === "chiqim"); delIncome.openModal() }}
                        onReverse={(r) => { setReverseRow(r); reverseM.openModal() }}
                        onReject={(r) => { setRejecting(r); reject.openModal() }}
                        onPay={(r) => { setPaying(r); pay.openModal() }}
                        onEditRequest={(r) => { setEditing(r); request.openModal() }}
                        actions={<>
                            {cashier && <>
                            <Button onClick={() => { setIncomeRow(null); setIncomeOut(false); income.openModal() }}>
                                <ArrowDownCircle size={16} />
                                {t("fin.kv2.cash_in")}
                            </Button>
                            <Button onClick={() => { setIncomeRow(null); setIncomeOut(true); income.openModal() }}>
                                <ArrowUpCircle size={16} />
                                {t("fin.kv2.cash_out")}
                            </Button>
                            </>}
                        </>}
                    />
                }
            </div>

            <Modal modalKey={M.income} title={incomeRow ? t(incomeOut ? "fin.kv2.edit_expense" : "fin.kv2.edit_income") : t(incomeOut ? "fin.kv2.cash_out" : "fin.kv2.cash_in")} size="max-w-md"><IncomeModal editing={incomeRow} out={incomeOut} /></Modal>
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
