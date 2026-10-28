import ParamDateRange from "@/components/as-params/date-picker-range"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { endOfMonth, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"
import { ReactNode } from "react"
import { n, usePeriod, Overview } from "./api"

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

export const SummaryPanel = ({ sm, ov, drivers, from_date, view, driver, lineProps, expProps, expenseLines, setDriver, setView }: SummaryPanelProps) => {
    const { t } = useTranslation()
    return (
        <Card className="xl:h-full min-h-0 overflow-hidden">
            <CardContent className="p-3 flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                <ParamDateRange className="w-full" from="from_date" to="to_date" defaultValue={{ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }} addButtonProps={{ className: "w-full justify-start !bg-muted/50" }} />

                {from_date && (
                    <Box className="bg-muted/40 border-muted-foreground/30">
                        <Line strong label={t("fin.kv2.opening_balance")} value={sm?.opening} tone={n(sm?.opening) < 0 ? "red" : undefined} />
                    </Box>
                )}
                <Box className="bg-green-600/5 border-green-600/30">
                    <Line strong tone="green" label={t("kassa.report_income")} value={sm?.income.total} />
                    <Line sub label={t("fin.kv2.from_external")} value={sm?.income.external} {...lineProps("in_external", "fin.kv2.from_external")} />
                    <Line sub label={t("fin.kv2.trip_cash")} value={sm?.income.trip_cash} {...expProps({ key: "trip_cash", kind: "trip_cash", label: t("fin.kv2.trip_cash"), amount: n(sm?.income.trip_cash) })} />
                </Box>
                <Box className="bg-red-600/5 border-red-600/30">
                    <Line strong tone="red" label={t("fin.kv2.trip_expenses")} value={-n(sm?.expense.total)} />
                    {expenseLines.filter((l) => l.kind === "fuel").map((l) => (
                        <Line
                            key={l.key}
                            sub
                            label={l.label}
                            value={-l.amount}
                            {...expProps({ key: l.key, kind: l.kind, label: l.label, amount: -l.amount })}
                        />
                    ))}
                    <Line sub label={t("table.monthly_salary")} value={-(n(sm?.expense.oylik) + n(sm?.expense.salary_cash))} {...expProps({ key: "salary", kind: "salary", label: t("table.monthly_salary"), amount: -(n(sm?.expense.oylik) + n(sm?.expense.salary_cash)) })} />
                    {expenseLines.filter((l) => l.kind !== "fuel").map((l) => (
                        <Line
                            key={l.key}
                            sub
                            label={l.label}
                            value={-l.amount}
                            {...expProps({ key: l.key, kind: l.kind, label: l.label, amount: -l.amount })}
                        />
                    ))}
                    {!!n(sm?.expense.reversals) && <Line sub label={t("fin.kv2.reversed_incomes")} value={-n(sm?.expense.reversals)} {...lineProps("out_reversals", "fin.kv2.reversed_incomes")} />}
                </Box>
                <Box className="bg-orange-500/5 border-orange-500/30">
                    <Line strong tone="red" label={t("fin.kv2.non_trip_expenses")} value={-n(sm?.other_expense?.total ?? sm?.expense.garaj)} />
                    <Line sub label={t("fin.kv2.cash_out")} value={-n(sm?.other_expense?.chiqim)} {...lineProps("out_chiqim", "fin.kv2.cash_out")} />
                    <Line sub label={t("fin.kv2.garage_cash_expense")} value={-n(sm?.other_expense?.garaj ?? sm?.expense.garaj)} {...lineProps("out_garaj", "fin.kv2.garage_cash_expense")} />
                    <Line sub label={t("fin.kv2.warehouse_expense")} value={-n(sm?.other_expense?.ombor)} {...lineProps("out_ombor", "fin.kv2.warehouse_expense")} />
                </Box>
                <Box className="bg-primary/5 border-primary/30">
                    <Line strong label={t("fin.kv2.closing_balance")} value={n(sm?.closing ?? ov?.balance) + n(ov?.drivers_total)} tone={n(sm?.closing ?? ov?.balance) + n(ov?.drivers_total) < 0 ? "red" : undefined} />
                    <Line sub label={t("fin.kv2.cash_balance")} value={sm?.closing ?? ov?.balance} />
                    <Line sub label={t("fin.kv2.drivers_holding", { count: drivers.length })} value={ov?.drivers_total} />
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
