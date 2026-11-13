import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useHasAction } from "@/constants/useUser"
import { usePatch } from "@/hooks/usePatch"
import { cn } from "@/lib/utils"
import { amountText, num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ChevronDown, RotateCcw } from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { MonthlyReport, OverheadItem, OverheadKey, TaxParams, reportUrl } from "./api"
import { Money } from "./index"

type Field = Exclude<keyof TaxParams, "enabled">

const RATES: Field[] = [
    "vat_rate",
    "pit_rate",
    "social_rate",
    "profit_rate",
    "dividend_rate",
    "cash_fee_rate",
    "bank_markup",
]
const AMOUNTS: Field[] = ["bank_income", "salary_official", "bank_fee_salary", "bank_fee_dividend"]

const groupDigits = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

const Row = ({
    label,
    value,
    strong,
    tone,
    sub,
    hint,
    open,
    onClick,
}: {
    label: ReactNode
    value: string | number | undefined
    strong?: boolean
    tone?: "total" | "head"
    sub?: boolean
    hint?: ReactNode
    open?: boolean
    onClick?: () => void
}) => {
    const Tag = onClick ? "button" : "div"
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-4 px-4 border-b last:border-b-0 text-left",
                sub ? "py-1.5 text-xs bg-muted/10" : "py-2 text-sm",
                tone === "total" && "bg-green-500/10",
                tone === "head" && "bg-muted/40",
                onClick && "hover:bg-muted/30 transition-colors",
            )}
        >
            <span
                className={cn(
                    "flex flex-col",
                    sub && "pl-4 text-muted-foreground",
                    strong && "font-semibold text-foreground",
                )}
            >
                <span className="flex items-center gap-1.5">
                    {label}
                    {onClick && (
                        <ChevronDown
                            className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
                        />
                    )}
                </span>
                {hint && (
                    <span className="text-[11px] font-normal text-muted-foreground">{hint}</span>
                )}
            </span>
            {value !== undefined && <Money value={value} strong={strong} />}
        </Tag>
    )
}

const Items = ({ items }: { items: OverheadItem[] }) => {
    const { t } = useTranslation()
    if (!items.length)
        return (
            <p className="pl-12 pr-4 py-1.5 text-xs text-muted-foreground border-b">
                {t("fin_report.tf.no_items")}
            </p>
        )
    return (
        <div className="border-b bg-muted/10">
            {items.map((i) => (
                <div
                    key={i.id}
                    className="flex items-center justify-between gap-3 pl-12 pr-4 py-1 text-xs"
                >
                    <span className="min-w-0 truncate text-muted-foreground">
                        {format(new Date(i.date), "dd.MM.yyyy")} · {i.category}
                        {i.comment ? ` · ${i.comment}` : ""}
                    </span>
                    <Money value={-num(i.amount)} />
                </div>
            ))}
        </div>
    )
}

const Section = ({
    n,
    title,
    note,
    right,
    children,
}: {
    n?: number
    title: ReactNode
    note?: ReactNode
    right?: ReactNode
    children: ReactNode
}) => (
    <Card>
        <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                        {n ? `${n}. ` : ""}
                        {title}
                    </span>
                    {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
                </div>
                {right}
            </div>
            {children}
        </CardContent>
    </Card>
)

const useSave = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    return usePatch({
        onSuccess: () => {
            toast.success(t("fin_report.recalculated"))
            qc.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).startsWith("kontragent"),
            })
        },
        onError: onApiError(t("messages.error")),
    })
}

export const TaxToggle = ({ report: r }: { report: MonthlyReport }) => {
    const { t } = useTranslation()
    const editable = useHasAction("fin_report_control") && r.status === "draft"
    const { mutate, isPending } = useSave()
    return (
        <Section
            title={t("fin_report.tf.title")}
            note={t("fin_report.tf.off")}
            right={
                <Switch
                    checked={!!r.tax_params?.enabled}
                    disabled={!editable || isPending}
                    onCheckedChange={(v) => mutate(reportUrl(r.id), { tax_params: { enabled: v } })}
                />
            }
        >
            {null}
        </Section>
    )
}

export const TaxReport = ({
    report: r,
    overhead,
}: {
    report: MonthlyReport
    overhead: OverheadItem[]
}) => {
    const { t } = useTranslation()
    const editable = useHasAction("fin_report_control") && r.status === "draft"
    const p = r.tax_params
    const c = r.tax_calc ?? {}
    const { mutate, isPending } = useSave()
    const [open, setOpen] = useState<string | null>(null)
    const toggle = (k: string) => () => setOpen(open === k ? null : k)
    const byLine = (k: OverheadKey) => overhead.filter((i) => i.line === k)

    const initial = () =>
        Object.fromEntries(
            [...AMOUNTS, ...RATES].map((k) => [
                k,
                k === "bank_income" && c.bank_income_auto ?
                    ""
                :   String(Math.round(num(p?.[k] ?? "0") * 100) / 100),
            ]),
        ) as Record<Field, string>
    const [draft, setDraft] = useState<Record<Field, string>>(initial)
    const [feeUsd, setFeeUsd] = useState(String(num(r.management_fee_usd)))
    useEffect(() => {
        setDraft(initial())
        setFeeUsd(String(num(r.management_fee_usd)))
    }, [r.updated])

    const base = initial()
    const dirty = (Object.keys(draft) as Field[]).filter((k) => draft[k] !== base[k])
    const feeDirty = num(feeUsd) !== num(r.management_fee_usd)
    const onSave = () => {
        if (dirty.length)
            mutate(reportUrl(r.id), {
                tax_params: Object.fromEntries(
                    dirty.map((k) => [
                        k,
                        k === "bank_income" && draft[k] === "" ? null : num(draft[k] || "0"),
                    ]),
                ),
            })
        if (feeDirty) mutate(reportUrl(r.id), { management_fee_usd: num(feeUsd) })
    }

    const input = (k: Field, rate: boolean) => (
        <label key={k} className="flex items-center justify-between gap-3 px-4 py-1.5 text-xs border-b">
            <span className="text-muted-foreground">{t(`fin_report.tf.in.${k}`)}</span>
            <span className="flex items-center gap-1">
                <Input
                    disabled={!editable}
                    wrapperClassName={rate ? "h-7 w-16 sm:w-16" : "h-7 w-36 sm:w-36"}
                    className={cn(
                        "h-7 text-right text-xs bg-amber-50 dark:bg-amber-500/10",
                        rate ? "w-16" : "w-36",
                    )}
                    type="text"
                    inputMode="decimal"
                    placeholder={
                        k === "bank_income" ? amountText(c.bank_income_suggested ?? "0") : "0"
                    }
                    value={rate ? draft[k] : groupDigits(draft[k])}
                    onChange={(e) => {
                        const v =
                            rate ?
                                e.target.value.replace(",", ".").replace(/[^\d.]/g, "").slice(0, 5)
                            :   e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15)
                        setDraft({ ...draft, [k]: v })
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSave()}
                />
                {rate && <span className="w-3 text-muted-foreground">%</span>}
            </span>
        </label>
    )

    const rentRows = r.owners
        .flatMap((o) => o.vehicles.map((v) => ({ ...v, owner: o.name })))
        .sort((x, y) => x.plate.localeCompare(y.plate) || x.part.localeCompare(y.part))
    const cashOut =
        num(r.trip_salary) +
        num(r.trip_other) +
        num(r.other_expense) +
        num(r.management_total) +
        num(r.rent) +
        num(r.tax)

    return (
        <div className="flex flex-col gap-4">
            <Section
                n={1}
                title={t("fin_report.tf.income")}
                right={
                    <Switch
                        checked
                        disabled={!editable || isPending}
                        onCheckedChange={(v) => mutate(reportUrl(r.id), { tax_params: { enabled: v } })}
                    />
                }
            >
                <Row label={t("fin_report.tf.income_total")} value={r.income} />
                <Row sub label={t("fin_report.tf.bank_income")} value={c.bank_income} />
                <Row sub label={t("fin_report.tf.cash_income_gross")} value={c.cash_income_gross} />
                <Row
                    sub
                    label={t("fin_report.tf.cash_fee", { rate: num(p.cash_fee_rate) })}
                    value={-num(c.cash_fee)}
                />
                <Row label={t("fin_report.tf.cash_income")} value={c.cash_income} strong />
            </Section>

            <Section n={2} title={t("fin_report.tf.inputs")} note={t("fin_report.tf.inputs_note")}>
                <Row tone="head" label={t("fin_report.tf.from_system")} value={undefined} />
                <Row
                    sub
                    label={t("fin_report.tf.split_fuel")}
                    value={r.trip_fuel}
                    hint={t("fin_report.tf.split_fuel_hint")}
                />
                <Row
                    sub
                    label={t("fin_report.tf.split_rent")}
                    value={r.vehicle_rent}
                    hint={t("fin_report.tf.split_rent_hint")}
                    open={open === "rent"}
                    onClick={rentRows.length ? toggle("rent") : undefined}
                />
                {open === "rent" &&
                    rentRows.map((v) => (
                        <div
                            key={`${v.vehicle}-${v.part}`}
                            className="flex items-center justify-between gap-3 pl-12 pr-4 py-1 text-xs border-b bg-muted/10"
                        >
                            <span className="text-muted-foreground">
                                {v.plate} · {t(`fin_report.part.${v.part}`)} · ${num(v.rent_usd)} +{" "}
                                {num(v.vat_percent)}% → {v.owner}
                            </span>
                            <Money value={v.rent} />
                        </div>
                    ))}
                <Row tone="head" label={t("fin_report.tf.manual")} value={undefined} />
                {AMOUNTS.map((k) => input(k, false))}
                {c.bank_income_auto && (
                    <p className="px-4 py-1.5 text-[11px] text-muted-foreground border-b">
                        {t("fin_report.tf.bank_auto", {
                            amount: amountText(c.bank_income_suggested ?? "0"),
                            markup: num(p.bank_markup),
                        })}
                    </p>
                )}
                {RATES.map((k) => input(k, true))}
                <label className="flex items-center justify-between gap-3 px-4 py-1.5 text-xs border-b">
                    <span className="text-muted-foreground">
                        {t("fin_report.tf.in.management_fee_usd", { fleet: r.fleet })}
                    </span>
                    <span className="flex items-center gap-1">
                        $
                        <Input
                            disabled={!editable}
                            wrapperClassName="h-7 w-20 sm:w-20"
                            className="h-7 w-20 text-right text-xs bg-amber-50 dark:bg-amber-500/10"
                            type="text"
                            inputMode="decimal"
                            value={feeUsd}
                            onChange={(e) => {
                                const v = e.target.value.replace(",", ".")
                                if (/^\d{0,6}(\.\d{0,2})?$/.test(v)) setFeeUsd(v)
                            }}
                            onKeyDown={(e) => e.key === "Enter" && onSave()}
                        />
                    </span>
                </label>
                {editable && (
                    <div className="flex justify-end gap-2 px-4 py-2">
                        {!c.bank_income_auto && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => mutate(reportUrl(r.id), { tax_params: { bank_income: null } })}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t("fin_report.tf.bank_reset")}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="h-7 text-xs"
                            disabled={!dirty.length && !feeDirty}
                            loading={isPending}
                            onClick={onSave}
                        >
                            {t("actions.save")}
                        </Button>
                    </div>
                )}
            </Section>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 items-start">
                <Section n={3} title={t("fin_report.tf.vat")}>
                    <Row sub label={t("fin_report.tf.bank_vat")} value={c.bank_vat} />
                    <Row sub label={t("fin_report.tf.fuel_vat")} value={-num(c.fuel_vat)} />
                    <Row sub label={t("fin_report.tf.rent_vat")} value={-num(c.rent_vat)} />
                    <Row label={t("fin_report.tf.vat_pay")} value={-num(c.vat_pay)} strong />
                </Section>

                <Section n={4} title={t("fin_report.tf.payroll")}>
                    <Row sub label={t("fin_report.tf.salary_gross")} value={c.salary_gross} />
                    <Row sub label={t("fin_report.tf.pit")} value={-num(c.pit)} />
                    <Row sub label={t("fin_report.tf.social")} value={-num(c.social)} />
                    <Row label={t("fin_report.tf.payroll_cost")} value={-num(c.payroll_cost)} strong />
                </Section>
            </div>

            <Section n={5} title={t("fin_report.tf.profit")}>
                <Row
                    sub
                    label={t("fin_report.tf.after_costs")}
                    value={c.after_costs}
                    hint={t("fin_report.tf.after_costs_hint")}
                />
                <Row sub label={t("fin_report.tf.payroll_cost")} value={-num(c.payroll_cost)} />
                {num(c.bank_fees) !== 0 && (
                    <Row sub label={t("fin_report.tf.bank_fees")} value={-num(c.bank_fees)} />
                )}
                <Row label={t("fin_report.tf.before_tax")} value={c.before_tax} />
                <Row
                    sub
                    label={t("fin_report.tf.profit_tax", { rate: num(p.profit_rate) })}
                    value={-num(c.profit_tax)}
                />
                <Row label={t("fin_report.tf.net_profit")} value={c.net_profit} />
                <Row
                    sub
                    label={t("fin_report.tf.dividend_tax", { rate: num(p.dividend_rate) })}
                    value={-num(c.dividend_tax)}
                />
                <Row label={t("fin_report.tf.dividend")} value={c.dividend} strong />
            </Section>

            <Section n={6} title={t("fin_report.tf.split")} note={t("fin_report.tf.split_note")}>
                <Row sub label={t("fin_report.tf.split_fuel")} value={r.trip_fuel} />
                <Row sub label={t("fin_report.tf.split_rent")} value={r.vehicle_rent} />
                <Row sub label={t("fin_report.tf.cash_salary_back")} value={c.cash_salary_back} />
                <Row sub label={t("fin_report.tf.vat_pay")} value={c.vat_pay} />
                <Row sub label={t("fin_report.tf.pit")} value={c.pit} />
                <Row sub label={t("fin_report.tf.social")} value={c.social} />
                <Row sub label={t("fin_report.tf.profit_tax", { rate: num(p.profit_rate) })} value={c.profit_tax} />
                <Row sub label={t("fin_report.tf.dividend_tax", { rate: num(p.dividend_rate) })} value={c.dividend_tax} />
                {num(c.bank_fees) !== 0 && (
                    <Row sub label={t("fin_report.tf.bank_fees")} value={c.bank_fees} />
                )}
                <Row sub label={t("fin_report.tf.dividend")} value={c.dividend} />
                <Row label={t("fin_report.tf.split_total")} value={c.bank_income} strong />
            </Section>

            <Section n={7} title={t("fin_report.tf.cash")}>
                <Row sub label={t("fin_report.tf.dividend")} value={c.dividend} />
                <Row sub label={t("fin_report.tf.cash_income")} value={c.cash_income} />
                <Row sub label={t("fin_report.tf.cash_salary_back")} value={c.cash_salary_back} />
                <Row label={t("fin_report.tf.cash_in")} value={c.cash_in} strong />

                <Row
                    sub
                    label={t("fin_report.tf.cash_salary")}
                    value={-num(r.trip_salary)}
                    hint={t("fin_report.tf.cash_salary_hint")}
                />
                <Row
                    sub
                    label={t("fin_report.tf.cash_trip")}
                    value={-num(r.trip_other)}
                    hint={t("fin_report.tf.cash_trip_hint")}
                />
                <Row
                    sub
                    label={t("fin_report.tf.cash_other")}
                    value={-num(r.other_expense)}
                    hint={
                        num(r.recoverable) > 0 ?
                            t("fin_report.recoverable_note", { amount: amountText(r.recoverable) })
                        :   t("fin_report.tf.cash_other_hint")
                    }
                    open={open === "other"}
                    onClick={toggle("other")}
                />
                {open === "other" && (
                    <>
                        <Row
                            sub
                            label={t("fin_report.lines.company_vehicle_expense")}
                            value={-num(r.company_vehicle_expense)}
                        />
                        <Row sub label={t("fin_report.lines.other_kassa")} value={-num(r.other)} />
                        <Items items={byLine("other")} />
                    </>
                )}
                <Row
                    sub
                    label={t("fin_report.tf.cash_management")}
                    value={-num(r.management_total)}
                    hint={t("fin_report.tf.management_hint", {
                        usd: num(r.management_fee_usd),
                        fleet: r.fleet,
                        kassa: amountText(r.management),
                    })}
                    open={open === "management"}
                    onClick={toggle("management")}
                />
                {open === "management" && <Items items={byLine("management")} />}
                {num(r.rent) !== 0 && (
                    <>
                        <Row sub label={t("fin_report.lines.rent_kassa")} value={-num(r.rent)} />
                        <Items items={byLine("rent")} />
                    </>
                )}
                {num(r.tax) !== 0 && (
                    <>
                        <Row sub label={t("fin_report.lines.tax_other")} value={-num(r.tax)} />
                        <Items items={byLine("tax")} />
                    </>
                )}
                <Row label={t("fin_report.tf.cash_out")} value={-cashOut} strong />
                <Row
                    label={t("fin_report.tf.cash_net")}
                    value={r.net}
                    strong
                    tone="total"
                    hint={t("fin_report.tf.cash_net_hint")}
                />
            </Section>
        </div>
    )
}
