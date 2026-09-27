import ParamDateRange from "@/components/as-params/date-picker-range"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KASSA_DRIVER_LEDGER, KASSA_OVERVIEW, KASSA_SUMMARY } from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowDownCircle, ArrowUpCircle, Send } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import VstGarageModal from "./garage-modal"
import VstPayerReport from "./payer-report"
import VstPaymentRequests from "./payment-requests"
import VstRequestModal, { VST_REQUEST_MODAL } from "./request-modal"
import { formatDateTime, type VstOverview, type VstSummary } from "./types"

type LedgerRow = {
    id: number | null
    date: string
    trip_id: number
    action: number | "settlement"
    category: string | null
    comment: string | null
    amount: string
    balance: string | null
}

const Line = ({ label, value, strong, sub, accent }: { label: ReactNode; value: number; strong?: boolean; sub?: boolean; accent?: boolean }) => (
    <div className={cn("flex items-center justify-between gap-2", sub ? "pl-3 text-sm text-muted-foreground" : "", accent ? "text-primary" : "")}>
        <span className={cn(strong && "font-semibold text-foreground", sub && "text-xs")}>{label}</span>
        <span className={cn("tabular-nums", strong ? "font-semibold" : "", sub ? "text-xs" : "")}>
            {formatMoney(value)} so'm
        </span>
    </div>
)

const Box = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("rounded-lg border bg-card p-3 flex flex-col gap-1.5", className)}>{children}</div>
)

const n = (v?: string | number | null) => Number(v ?? 0)

const VstKassa = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as any
    const { data: profile } = useUser()
    const canSeeKassa = useHasAction(["kassa_payment_requests_view", "kassa_payment_requests_control", "manager_cashflow_view"])
    const canRequest = useHasAction("kassa_payment_requests_control")
    const canGarage = useHasAction("manager_cashflow_control")
    const { openModal: openRequest } = useModal(VST_REQUEST_MODAL)
    const { openModal: openIncome } = useModal("vst-garage-income")
    const { openModal: openExpense } = useModal("vst-garage-expense")
    const { openModal: openLedger } = useModal("vst-driver-ledger")
    const [ledgerDriver, setLedgerDriver] = useState<{ id: number; name: string } | null>(null)

    const { data: overview } = useGet<VstOverview>(KASSA_OVERVIEW, { enabled: canSeeKassa })
    const { data: summary } = useGet<VstSummary>(KASSA_SUMMARY, {
        params: { from_date: search.from_date, to_date: search.to_date },
        enabled: canSeeKassa,
    })
    const { data: ledger } = useGet<{ balance: string; rows: LedgerRow[] }>(
        `${KASSA_DRIVER_LEDGER}/${ledgerDriver?.id}/ledger`,
        { enabled: !!ledgerDriver },
    )

    const view: "requests" | "report" = search.vst_view === "report" ? "report" : "requests"
    const switcher = (
        <Tabs
            value={view}
            onValueChange={(val) =>
                navigate({ search: { ...search, vst_view: val === "requests" ? undefined : val, page: undefined } as any })
            }
        >
            <TabsList>
                <TabsTrigger value="requests">
                    {t("vst.requests_tab", "Pul so'rovlari")}
                    {!!overview?.pending_requests.count && (
                        <Badge variant="orange" className="ml-1.5 h-5 px-1.5">{overview.pending_requests.count}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="report">{t("vst.report_tab", "To'lovchi hisoboti")}</TabsTrigger>
            </TabsList>
        </Tabs>
    )

    const drivers = useMemo(() => overview?.drivers.items ?? [], [overview])
    const inc = summary?.income.by_kind ?? {}
    const out = summary?.outcome.by_kind ?? {}

    return (
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-3 md:h-full min-h-0">
            {canSeeKassa ?
                <Card className="md:h-full min-h-0 overflow-hidden">
                    <CardContent className="p-3 flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                        <ParamDateRange from="from_date" to="to_date" addButtonProps={{ className: "w-full justify-start !bg-muted/50" }} />

                        <Box>
                            <Line strong label={t("vst.total", "Kassa (jami)")} value={n(overview?.total)} />
                            <Line sub label={t("vst.garage", "Garaj kassasi (Doniyor)")} value={n(overview?.garage.balance)} />
                            <Line sub label={t("vst.drivers", "Haydovchilarda")} value={n(overview?.drivers.total)} />
                            {overview && n(overview.drivers.total) !== n(overview.drivers.computed_total) && (
                                <span className="text-xs text-destructive">
                                    {t("vst.drivers_mismatch", "Haydovchilar balansi formula bilan mos emas")}: {formatMoney(n(overview.drivers.computed_total))}
                                </span>
                            )}
                        </Box>

                        <Box>
                            <Line strong label={t("vst.start_balance", "Davr boshidagi balans")} value={n(summary?.start_balance)} />
                        </Box>
                        <Box>
                            <Line strong accent label={t("vst.income", "Kirim")} value={n(summary?.income.total)} />
                            <Line sub label={t("vst.advance_from_payer", "To'lovchi bergan avans")} value={n(inc.advance_from_payer)} />
                            <Line sub label={t("vst.driver_income", "Haydovchi kirimlari (reys)")} value={n(inc.driver_cash_income)} />
                            <Line sub label={t("vst.garage_income", "Garaj kirimi")} value={n(inc.garage_income)} />
                            {!!n(inc.advance_other) && <Line sub label={t("vst.advance_other", "Boshqa avans")} value={n(inc.advance_other)} />}
                            {!!n(inc.other_income) && <Line sub label={t("vst.other", "Boshqa")} value={n(inc.other_income)} />}
                        </Box>
                        <Box>
                            <Line strong label={t("vst.outcome", "Chiqim")} value={n(summary?.outcome.total)} />
                            <Line sub label={t("vst.driver_expense", "Haydovchi xarajatlari")} value={n(out.driver_cash_expense)} />
                            <Line sub label={t("vst.garage_expense", "Garaj xarajatlari")} value={n(out.garage_expense)} />
                            {!!n(out.other_expense) && <Line sub label={t("vst.other", "Boshqa")} value={n(out.other_expense)} />}
                        </Box>
                        <Box>
                            <Line strong label={t("vst.residue", "Qoldiq")} value={n(summary?.end_balance)} />
                            <Line sub label={t("vst.garage", "Garaj kassasi (Doniyor)")} value={n(summary?.residue.garage)} />
                            <Line sub label={t("vst.drivers", "Haydovchilarda")} value={n(summary?.residue.drivers)} />
                        </Box>
                        {!!summary?.payer_paid?.length && (
                            <Box>
                                {summary.payer_paid.map((p) => (
                                    <div key={p.user_id} className="flex flex-col gap-1">
                                        <Line strong label={`${p.name} ${t("vst.gave_period", "bergan")}`} value={n(p.total)} />
                                        <Line sub label={t("vst.to_driver_short", "Haydovchilarga")} value={n(p.to_drivers)} />
                                        <Line sub label={t("vst.expenses", "Xarajatlarga")} value={n(p.expenses)} />
                                    </div>
                                ))}
                            </Box>
                        )}
                        {summary?.started_at && (
                            <p className="text-xs text-muted-foreground">
                                {t("vst.started_at", "Kassa hisobi boshlangan")}: {formatDateTime(summary.started_at)}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {canRequest && (
                                <Button className="flex-1 min-w-[45%]" onClick={openRequest}>
                                    <Send size={16} />
                                    {t("vst.new_request", "Pul so'rovi")}
                                </Button>
                            )}
                            {canGarage && (
                                <Button variant="outline" className="flex-1 min-w-[45%]" onClick={openIncome}>
                                    <ArrowDownCircle size={16} />
                                    {t("vst.garage_income", "Garaj kirimi")}
                                </Button>
                            )}
                            {canGarage && (
                                <Button variant="outline" className="flex-1 min-w-[45%]" onClick={openExpense}>
                                    <ArrowUpCircle size={16} />
                                    {t("vst.garage_expense", "Garaj xarajatlari")}
                                </Button>
                            )}
                        </div>

                        <div className="border-t pt-3 flex flex-col min-h-0">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                {t("vst.drivers", "Haydovchilarda")} · {drivers.length}
                            </p>
                            <div className="space-y-1">
                                {drivers.map((d, i) => (
                                    <div
                                        key={d.driver_id}
                                        onClick={() => {
                                            setLedgerDriver({ id: d.driver_id, name: d.full_name })
                                            openLedger()
                                        }}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/80"
                                    >
                                        <span className="text-sm flex items-center gap-2 min-w-0">
                                            <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                                            <span className="truncate">{d.full_name}</span>
                                        </span>
                                        <span className={cn("text-sm font-medium", n(d.balance) < 0 && "text-destructive")}>
                                            {formatMoney(n(d.balance))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            :   <Card className="md:h-full">
                    <CardContent className="p-4 flex flex-col gap-2">
                        <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                            {t("vst.payer_hint", "Sizga tayinlangan so'rovlar o'ngda. Pulni berganingizdan keyin «Berdim» tugmasini bosing.")}
                        </p>
                    </CardContent>
                </Card>
            }

            <div className="w-full min-w-0 md:h-full min-h-0">
                {view === "report" ?
                    <VstPayerReport switcher={switcher} />
                :   <VstPaymentRequests switcher={switcher} />}
            </div>

            <Modal modalKey={VST_REQUEST_MODAL} title={t("vst.new_request", "Pul so'rovi")}>
                <VstRequestModal />
            </Modal>
            <Modal modalKey="vst-garage-income" title={t("vst.garage_income", "Garaj kirimi")} size="max-w-md">
                <VstGarageModal modalKey="vst-garage-income" kind="income" />
            </Modal>
            <Modal modalKey="vst-garage-expense" title={t("vst.garage_expense", "Garaj xarajatlari")} size="max-w-md">
                <VstGarageModal modalKey="vst-garage-expense" kind="expense" />
            </Modal>
            <Modal modalKey="vst-driver-ledger" title={ledgerDriver?.name ?? ""} size="max-w-2xl">
                <div className="flex flex-col gap-2 max-h-[70vh] overflow-auto">
                    <div className="flex justify-between text-sm font-semibold">
                        <span>{t("vst.in_hand", "Qo'lidagi pul")}</span>
                        <span>{formatMoney(n(ledger?.balance))} so'm</span>
                    </div>
                    <div className="divide-y text-sm">
                        {(ledger?.rows ?? []).map((r, i) => (
                            <div key={`${r.id}-${i}`} className="grid grid-cols-[120px_1fr_110px_110px] gap-2 py-1">
                                <span className="text-muted-foreground">{formatDateTime(r.date)}</span>
                                <span className="truncate">
                                    {r.action === 2 ? t("vst.advance", "Avans") : r.action === "settlement" ? t("vst.settlement", "Aylanma yopildi") : r.category || "—"}
                                    {r.comment ? ` — ${r.comment}` : ""}
                                </span>
                                <span className={cn("text-right", n(r.amount) < 0 ? "text-destructive" : "text-green-600")}>
                                    {formatMoney(n(r.amount))}
                                </span>
                                <span className="text-right text-muted-foreground">{r.balance != null ? formatMoney(n(r.balance)) : ""}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default VstKassa
