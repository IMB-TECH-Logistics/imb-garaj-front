import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { KassaPeriodFilter } from "./period-filter"
import { Fragment, ReactNode } from "react"
import { n, usePeriod, Overview } from "./api"

const COLS = "grid grid-cols-[minmax(0,1fr)_112px] items-stretch"
const CELL = "flex items-center justify-end border-l border-muted-foreground/25 px-1.5 py-0.5"

const Money = ({ value, className }: { value: number | null | undefined; className?: string }) => (
    <span className={cn(CELL, "tabular-nums whitespace-nowrap", className)}>
        {value == null ? "—" : formatMoney(n(value))}
    </span>
)

const Line = ({ label, value, strong, sub, tone, onClick, active }: { label: ReactNode; value: number | string | null | undefined; strong?: boolean; sub?: boolean; tone?: "green" | "red"; onClick?: () => void; active?: boolean }) => {
    const cash = value == null ? null : n(value)
    const size = sub ? "text-xs" : "text-[13px]"
    const weight = strong ? "font-semibold" : ""
    const color = cn(tone === "green" && "text-green-600", tone === "red" && "text-destructive")
    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : undefined}
            className={cn(
                COLS,
                sub && "pl-3 text-muted-foreground",
                onClick && "cursor-pointer rounded-md hover:bg-muted/80",
                active && "bg-primary/15 ring-1 ring-inset ring-primary",
            )}
        >
            <span className={cn("min-w-0 self-center break-words leading-tight py-1 pr-2", strong && "font-semibold text-foreground", size)}>{label}</span>
            <Money value={cash} className={cn(size, weight, color)} />
        </div>
    )
}

const Head = () => {
    const { t } = useTranslation()
    return (
        <div className={cn(COLS, "px-3 text-sm font-medium text-muted-foreground")}>
            <span className="py-1" />
            <span className={cn(CELL, "justify-start")}>{t("fin.kv2.col_cash")}</span>
        </div>
    )
}

const Box = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("rounded-lg border px-3 py-2 flex flex-col", className)}>{children}</div>
)

const incomeRows = (sm: Overview["summary"] | undefined, transport: string, other: string) => {
    const byK = sm?.income_by_kontragent ?? []
    const linked = byK.reduce((a, r) => a + n(r.amount), 0)
    const rest = n(sm?.income.total) - n(sm?.income.trip_cash) - linked
    return [
        ...byK.map((r) => ({ g: `in_kontragent:${r.id}`, name: r.name, cash: n(r.amount) as number | null })),
        { g: "in_trips", name: transport, cash: n(sm?.income.trip_cash) as number | null },
        ...(rest ? [{ g: "in_unlinked", name: other, cash: rest as number | null }] : []),
    ]
}

export type Exp = { key: string; kind: "fuel" | "other" | "trip_cash" | "salary"; label: string; amount: number }

type SummaryPanelProps = {
    sm: Overview["summary"] | undefined
    ov: Overview | undefined
    drivers: Overview["drivers"]
    from_date: ReturnType<typeof usePeriod>["from_date"]
    view: string
    driver: number | null
    lineProps: (g: string, labelKey: string) => { onClick: () => void; active: boolean }
    expProps: (e: Exp) => { onClick: () => void; active: boolean }
    expenseLines: { key: string; kind: Exp["kind"]; label: string; amount: number }[]
    setDriver: (v: number) => void
    setView: (v: "driver") => void
}

export const IzumiSummaryPanel = ({ sm, ov, drivers, from_date, view, driver, lineProps, expProps, expenseLines, setDriver, setView }: SummaryPanelProps) => {
    const { t } = useTranslation()
    const kassaBalance = n(sm?.closing ?? ov?.balance)
    const M = {
        opening: { cash: n(sm?.opening) + n(sm?.drivers_opening), kassa: n(sm?.opening), drivers: n(sm?.drivers_opening) },
        income: {
            cash: n(sm?.income.total),
            rows: incomeRows(sm, t("fin.kv2.transport_service"), t("fin.kv2.other_income")),
        },
        trip: {
            cash: -n(sm?.expense.total),
            fuel: { cash: -n(sm?.expense.fuel) },
            salary: { cash: -(n(sm?.expense.oylik) + n(sm?.expense.salary_cash)) },
            other: { cash: -n(sm?.expense.other) },
        },
        other: { cash: -(n(sm?.other_expense?.total ?? sm?.expense.garaj) - n(sm?.other_expense?.kontragent)) },
        kontragent: { cash: -n(sm?.other_expense?.kontragent) },
        closing: { cash: kassaBalance + n(sm?.drivers_closing ?? ov?.drivers_total), kassa: kassaBalance, drivers: n(sm?.drivers_closing ?? ov?.drivers_total) },
    }
    return (
        <Card className="lg:h-full min-h-0 overflow-hidden">
            <CardContent className="p-3 flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                <KassaPeriodFilter />

                <Head />
                {from_date && (
                    <Box className="bg-muted/40 border-muted-foreground/30">
                        <Line strong label={t("fin.kv2.opening_balance")} value={M.opening.cash} tone={M.opening.cash < 0 ? "red" : undefined} />
                        <Line sub label={t("fin.kv2.cash_balance")} value={M.opening.kassa} />
                        <Line sub label={t("fin.kv2.drivers_holding", { count: drivers.length })} value={M.opening.drivers} />
                    </Box>
                )}
                <Box className="bg-green-600/5 border-green-600/30">
                    <Line strong tone="green" label={t("fin.kv2.revenue")} value={M.income.cash} />
                    {M.income.rows.map((r) => (
                        <Line key={r.g} sub label={r.name} value={r.cash} {...lineProps(r.g, r.name)} />
                    ))}
                </Box>
                <Box className="bg-red-600/5 border-red-600/30">
                    <Line strong tone="red" label={t("fin.kv2.trip_expenses")} value={M.trip.cash} />
                    {expenseLines.map((l) => (
                        <Fragment key={l.key}>
                            <Line
                                sub
                                label={l.label}
                                value={M.trip[l.kind === "fuel" ? "fuel" : "other"].cash}
                                {...expProps({ key: l.key, kind: l.kind, label: l.label, amount: -l.amount })}
                            />
                            {l.kind === "fuel" && (
                                <Line sub label={t("table.monthly_salary")} value={M.trip.salary.cash} {...expProps({ key: "salary", kind: "salary", label: t("table.monthly_salary"), amount: -(n(sm?.expense.oylik) + n(sm?.expense.salary_cash)) })} />
                            )}
                        </Fragment>
                    ))}
                    {!!n(sm?.expense.reversals) && <Line sub label={t("fin.kv2.reversed_incomes")} value={-n(sm?.expense.reversals)} {...lineProps("out_reversals", "fin.kv2.reversed_incomes")} />}
                </Box>
                <Box className="bg-orange-500/5 border-orange-500/30">
                    <Line strong tone="red" label={<span className="whitespace-nowrap" title={t("fin.kv2.non_trip_expenses")}>{t("fin.kv2.non_trip_short")}</span>} value={M.other.cash} {...lineProps("out_nontrip_own", "fin.kv2.non_trip_expenses")} />
                </Box>
                <Box className="bg-violet-500/5 border-violet-500/30">
                    <Line
                        strong
                        tone="red"
                        label={<span className="whitespace-nowrap" title={t("fin.kv2.kontragent_expenses_hint")}>{t("fin.kv2.kontragent_expenses")}</span>}
                        value={M.kontragent.cash}
                        {...lineProps("out_kontragent", "fin.kv2.kontragent_expenses")}
                    />
                </Box>
                <Box className="bg-primary/5 border-primary/30">
                    <Line strong label={t("fin.kv2.closing_balance")} value={M.closing.cash} tone={M.closing.cash < 0 ? "red" : undefined} />
                    <Line sub label={t("fin.kv2.cash_balance")} value={M.closing.kassa} />
                    <Line sub label={t("fin.kv2.drivers_holding", { count: drivers.length })} value={M.closing.drivers} />
                </Box>

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
                                    "py-1.5 -mx-2 px-2 rounded-md cursor-pointer hover:bg-muted/80",
                                    driver === d.id && view === "driver" && "bg-primary/10",
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                                        <span className="truncate" title={d.name}>{d.name}</span>
                                        {d.dismissed && <span className="text-[10px] rounded bg-red-500/10 text-red-600 px-1.5 py-0.5 whitespace-nowrap shrink-0">{t("dismiss.badge")}</span>}
                                        {d.plate && <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{d.plate}</span>}
                                    </span>
                                    <span className={cn("text-sm font-medium tabular-nums whitespace-nowrap shrink-0 pl-3", n(d.balance) < 0 && "text-destructive")}>{formatMoney(n(d.balance))}</span>
                                </div>
                                {!!n(d.unconfirmed_salary) && (
                                    <div className="pl-6 mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                                        <div className="flex justify-between gap-3">
                                            <span>{t("fin.kv2.unconfirmed_expense")}</span>
                                            <span className="tabular-nums text-destructive">−{formatMoney(n(d.unconfirmed_salary))}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span>{t("fin.kv2.unconfirmed_left")}</span>
                                            <span className={cn("tabular-nums font-medium text-foreground", n(d.unconfirmed_left) < 0 && "text-destructive")}>{formatMoney(n(d.unconfirmed_left))}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {!drivers.length && <p className="text-xs text-muted-foreground">{t("fin.kv2.no_trips_yet")}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
