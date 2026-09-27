import ParamDateRange from "@/components/as-params/date-picker-range"
import { Skeleton } from "@/components/ui/skeleton"
import { CHECKOUT_SUMMARY } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { endOfDay, startOfMonth } from "date-fns"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

export type KassaSummaryGroup =
    | "income"
    | "trips"
    | "trips_cash"
    | "trips_card"
    | "other_outcome"

export const KASSA_SUMMARY_GROUPS: KassaSummaryGroup[] = [
    "income",
    "trips",
    "trips_cash",
    "trips_card",
    "other_outcome",
]

export type KassaSummaryData = {
    from_date: string
    to_date: string
    start_balance: string
    income: { total: string; by_source: Record<string, string> }
    outcome: {
        total: string
        trips: { total: string; cash: string; card: string }
        other: { total: string; by_source: Record<string, string> }
    }
    residue: { total: string; cash: string; drivers: string; card: string }
    end_balance: string
}

type Props = {
    activeGroup?: string
    activeKind?: string
    onGroup: (group: KassaSummaryGroup, data: KassaSummaryData) => void
    onKind: (kind: "cash" | "card") => void
    onDrivers: () => void
}

const Amount = ({ value, className }: { value?: string | number; className?: string }) => (
    <span className={cn("font-semibold tabular-nums text-right", className)}>
        {formatMoney(Number(value ?? 0))} <span className="font-normal text-xs opacity-80">so'm</span>
    </span>
)

const Row = ({
    label,
    value,
    onClick,
    active,
    sub,
    className,
}: {
    label: ReactNode
    value?: string | number
    onClick?: () => void
    active?: boolean
    sub?: boolean
    className?: string
}) => {
    const content = (
        <>
            <span className={cn("truncate", sub ? "text-xs" : "text-sm font-medium")}>{label}</span>
            <Amount value={value} className={sub ? "text-xs" : "text-sm"} />
        </>
    )
    const base = cn(
        "flex w-full items-center justify-between gap-3 rounded-md text-left",
        sub ? "py-1 pl-4 pr-2 text-muted-foreground" : "py-1.5 px-2",
        onClick && "cursor-pointer transition-colors hover:bg-muted",
        active && "bg-primary/10 text-primary",
        className,
    )
    if (!onClick) return <div className={base}>{content}</div>
    return (
        <button type="button" onClick={onClick} className={base}>
            {content}
        </button>
    )
}

const Block = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("rounded-lg border bg-background dark:bg-card p-1.5 shadow-sm", className)}>
        {children}
    </div>
)

const KassaSummary = ({ activeGroup, activeKind, onGroup, onKind, onDrivers }: Props) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as any
    const defaultRange = useMemo(() => {
        const now = new Date()
        return { from: startOfMonth(now), to: endOfDay(now) }
    }, [])
    const { data, isLoading } = useGet<KassaSummaryData>(CHECKOUT_SUMMARY, {
        params: { from_date: search.from_date, to_date: search.to_date },
    })

    const group = (g: KassaSummaryGroup) => () => data && onGroup(g, data)

    return (
        <div className="flex flex-col gap-2">
            <ParamDateRange
                from="from_date"
                to="to_date"
                defaultValue={defaultRange}
                className="w-full min-w-0"
            />
            {isLoading || !data ?
                <div className="flex flex-col gap-2">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-11 w-full" />
                    ))}
                </div>
            :   <>
                    <Block>
                        <Row label={t("kassa.summary_start_balance")} value={data.start_balance} />
                    </Block>
                    <Block>
                        <Row
                            label={t("kassa.summary_income")}
                            value={data.income.total}
                            onClick={group("income")}
                            active={activeGroup === "income"}
                            className={cn(activeGroup !== "income" && "text-primary")}
                        />
                    </Block>
                    <Block>
                        <Row label={t("kassa.summary_outcome")} value={data.outcome.total} />
                        <Row
                            sub
                            label={t("kassa.summary_trips")}
                            value={data.outcome.trips.total}
                            onClick={group("trips")}
                            active={activeGroup === "trips"}
                        />
                        <Row
                            sub
                            label={t("kassa.summary_cash")}
                            value={data.outcome.trips.cash}
                            onClick={group("trips_cash")}
                            active={activeGroup === "trips_cash"}
                            className="pl-8"
                        />
                        <Row
                            sub
                            label={t("kassa.summary_card")}
                            value={data.outcome.trips.card}
                            onClick={group("trips_card")}
                            active={activeGroup === "trips_card"}
                            className="pl-8"
                        />
                        <Row
                            sub
                            label={t("kassa.summary_other")}
                            value={data.outcome.other.total}
                            onClick={group("other_outcome")}
                            active={activeGroup === "other_outcome"}
                        />
                    </Block>
                    <Block>
                        <Row label={t("kassa.summary_residue")} value={data.residue.total} />
                        <Row
                            sub
                            label={t("kassa.summary_kassa")}
                            value={data.residue.cash}
                            onClick={() => onKind("cash")}
                            active={!activeGroup && activeKind === "cash"}
                        />
                        <Row
                            sub
                            label={t("kassa.summary_drivers")}
                            value={data.residue.drivers}
                            onClick={onDrivers}
                        />
                        <Row
                            sub
                            label={t("kassa.summary_card")}
                            value={data.residue.card}
                            onClick={() => onKind("card")}
                            active={!activeGroup && activeKind === "card"}
                        />
                    </Block>
                </>
            }
        </div>
    )
}

export default KassaSummary
