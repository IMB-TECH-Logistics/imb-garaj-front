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
import { ArrowDownCircle, X } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { KassaRequest, KassaTrip, KassaTx, KIND_DIR, KV2_REQUESTS, KV2_TRANSACTIONS, KV2_TRIPS, n, Paged, STATUS, useKassaRoles, useOverview, usePeriod } from "./api"
import { CloseTripModal, DeleteIncomeModal, IncomeModal, M, PayModal, RejectModal, RequestModal, ReverseModal } from "./modals"
import { KassaTable, LedgerTable, RequestsTable, TripsTable } from "./tables"

const Line = ({ label, value, strong, sub, tone, onClick, active }: { label: ReactNode; value: number | string | null | undefined; strong?: boolean; sub?: boolean; tone?: "green" | "red"; onClick?: () => void; active?: boolean }) => (
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
            {formatMoney(n(value))} so'm
        </span>
    </div>
)

const Box = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("rounded-lg border p-3 flex flex-col gap-1.5", className)}>{children}</div>
)

type View = "kassa" | "requests" | "trips" | "driver"

const TABS: [View, string][] = [["trips", "Aylanmalar"], ["kassa", "Transaksiyalar"]]

const KassaV2 = () => {
    const { cashier, operator } = useKassaRoles()
    const period = usePeriod()
    const { from_date } = period
    const { data: tripsData } = useGet<KassaTrip[]>(KV2_TRIPS, { params: period })
    const { data: txData } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params: { ...period, page_size: 1000 } })
    const { data: reqData } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params: { status: `${STATUS.PENDING},${STATUS.REJECTED}`, page_size: 1000 } })
    const txCount = useMemo(() => {
        if (!txData) return undefined
        const closes = new Set(txData.results.filter((t) => t.close).map((t) => t.close!.id))
        const plain = txData.results.filter((t) => !t.close).length
        const reqs = (reqData?.results ?? []).filter((q) => q.status === STATUS.PENDING || q.can_unreject).length
        return plain + closes.size + reqs
    }, [txData, reqData])
    const counts: Partial<Record<View, number | undefined>> = { trips: tripsData?.length, kassa: txCount }
    const { data: ov } = useOverview()
    const [view, setView] = useState<View>("trips")
    const [group, setGroup] = useState<string | null>(null)
    const pick = (g: string, label: string) => () => {
        setDriver(null)
        setView("kassa")
        setGroup(group === g ? null : g)
        setGroupLabel(label)
    }
    const [groupLabel, setGroupLabel] = useState("")
    const lineProps = (g: string, label: string) => ({ onClick: pick(g, label), active: view === "kassa" && group === g })
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
                {TABS.map(([v, label]) => (
                    <TabsTrigger key={v} value={v}>{label}{counts[v] != null ? ` (${counts[v]})` : ""}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
    const drivers = ov?.drivers ?? []
    const selected = drivers.find((d) => d.id === driver)

    return (
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-3 md:h-full min-h-0">
            <Card className="md:h-full min-h-0 overflow-hidden">
                <CardContent className="p-3 flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                    <ParamDateRange className="w-full" from="from_date" to="to_date" defaultValue={{ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }} addButtonProps={{ className: "w-full justify-start !bg-muted/50" }} />

                    <Box className="bg-primary/5 border-primary/30">
                        <Line strong label="Kassa qoldig'i" value={ov?.balance} />
                        {from_date && <Line sub label="Davr boshida" value={ov?.start_balance} />}
                    </Box>
                    <Box className="bg-green-600/5 border-green-600/30">
                        <Line strong tone="green" label="Kirim" value={ov?.income.total} {...lineProps("in", "Kirim")} />
                        <Line sub label="Tashqi manbadan" value={ov?.income.external} {...lineProps("in_external", "Tashqi manbadan")} />
                        <Line sub label="Naqd reys puli" value={ov?.income.trips} {...lineProps("in_trips", "Naqd reys puli")} />
                        <Line sub label="Haydovchi qaytargan" value={ov?.income.drivers} {...lineProps("in_drivers", "Haydovchi qaytargan")} />
                        {!!n(ov?.income.reversals) && <Line sub label="Bekor qilingan chiqimlar" value={ov?.income.reversals} {...lineProps("in_reversals", "Bekor qilingan chiqimlar")} />}
                    </Box>
                    <Box className="bg-red-600/5 border-red-600/30">
                        <Line strong tone="red" label="Chiqim" value={ov?.outcome.total} {...lineProps("out", "Chiqim")} />
                        <Line sub label="Haydovchilarga avans" value={ov?.outcome.avans} {...lineProps("out_avans", "Haydovchilarga avans")} />
                        <Line sub label="Aylanma farqi (haydovchiga)" value={ov?.outcome.farq} {...lineProps("out_farq", "Aylanma farqi (haydovchiga)")} />
                        <Line sub label="Oylik" value={ov?.outcome.oylik} {...lineProps("out_oylik", "Oylik")} />
                        <Line sub label="Garaj xarajatlari (naqd)" value={ov?.outcome.garaj} {...lineProps("out_garaj", "Garaj xarajatlari (naqd)")} />
                    </Box>

                    <div className="rounded-lg border border-muted-foreground/20 bg-muted/20 p-3 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Haydovchilar balansi · {drivers.length}</p>
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
                                    <span className="text-sm flex items-center gap-2 min-w-0">
                                        <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                                        <span className="truncate">{d.name}</span>
                                        {d.plate && <span className="text-xs text-muted-foreground">{d.plate}</span>}
                                    </span>
                                    <span className={cn("text-sm font-medium tabular-nums", n(d.balance) < 0 && "text-destructive")}>{formatMoney(n(d.balance))}</span>
                                </div>
                            ))}
                            {!drivers.length && <p className="text-xs text-muted-foreground">Yangi kassada hali aylanma yo'q.</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="w-full min-w-0 md:h-full min-h-0">
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
                                    Balansi: <b className="tabular-nums">{formatMoney(n(selected.balance))} so'm</b>
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
                        groupLabel={groupLabel}
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
                                Kassaga kirim
                            </Button>
                            </>}
                        </>}
                    />
                }
            </div>

            <Modal modalKey={M.income} title={incomeRow ? "Kirimni tahrirlash" : "Kassaga kirim"} size="max-w-md"><IncomeModal editing={incomeRow} /></Modal>
            <Modal modalKey={M.deleteIncome} title="Kirimni o'chirish" size="max-w-md"><DeleteIncomeModal row={incomeRow} /></Modal>
            <Modal modalKey={M.request} title={!editing ? "Pul so'rovi" : editing.status === 10 ? "So'rovni tahrirlash" : "So'rovni tuzatish"} size="max-w-md"><RequestModal editing={editing} /></Modal>
            <Modal modalKey={M.reject} title="So'rovni rad etish" size="max-w-md"><RejectModal request={rejecting} /></Modal>
            <Modal modalKey={M.pay} title={paying && KIND_DIR[paying.kind] === "out" ? "Pul berish" : "Pul olish"} size="max-w-md"><PayModal request={paying} /></Modal>
            <Modal modalKey={M.close} title={closing ? `Aylanma #${closing.id} ni yopish` : ""} size="max-w-xl"><CloseTripModal trip={closing} /></Modal>
            <Modal modalKey={M.reverse} title="Amalni bekor qilish" size="max-w-md"><ReverseModal row={reverseRow} /></Modal>
        </div>
    )
}

export default KassaV2
