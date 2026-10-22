import { Skeleton } from "@/components/ui/skeleton"
import { TECH_BASE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { type UIEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate } from "../ombor/utils"
import type { TimelineItem, TimelineKind } from "./types"

type Filter = "all" | TimelineKind

const FILTERS: Filter[] = [
    "all",
    "tire",
    "oil",
    "repair",
    "document",
    "coupling",
    "driver",
]

const ICONS: Record<TimelineKind, string> = {
    tire: "🛞",
    oil: "🛢",
    repair: "🔧",
    document: "📄",
    coupling: "🔗",
    driver: "👤",
}

const Timeline = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const [filter, setFilter] = useState<Filter>("all")
    const [page, setPage] = useState(1)
    const [items, setItems] = useState<TimelineItem[]>([])
    const boxRef = useRef<HTMLDivElement>(null)

    const { data, isLoading, isFetching } = useGet<ListResponse<TimelineItem>>(
        `${TECH_BASE}/${id}/timeline`,
        { params: { kind: filter, page } },
    )

    useEffect(() => {
        if (!data) return
        setItems((prev) =>
            page === 1 ? data.results : [...prev, ...data.results],
        )
    }, [data])

    const changeFilter = (next: Filter) => {
        if (next === filter) return
        setFilter(next)
        setPage(1)
        boxRef.current?.scrollTo({ top: 0 })
    }

    const hasMore = !!data && page < data.total_pages

    const onScroll = (e: UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        if (
            hasMore &&
            !isFetching &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 80
        ) {
            setPage(page + 1)
        }
    }

    return (
        <section className="rounded-lg border p-4 flex flex-col gap-4">
            <h2 className="font-semibold">{t("tb.timeline")}</h2>
            <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => changeFilter(f)}
                        className={cn(
                            "rounded-full border px-3 py-1 text-sm transition-colors",
                            f === filter ?
                                "bg-primary text-primary-foreground border-primary"
                            :   "hover:bg-accent",
                        )}
                    >
                        {f !== "all" && <span className="mr-1">{ICONS[f]}</span>}
                        {t(`tb.filter_${f}`)}
                    </button>
                ))}
            </div>

            <div
                ref={boxRef}
                onScroll={onScroll}
                className={cn(
                    "h-[420px] overflow-y-auto overscroll-contain pr-1 transition-opacity",
                    isFetching && page === 1 && items.length > 0 && "opacity-60",
                )}
            >
            {isLoading && !items.length ?
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            : !items.length ?
                <p className="text-sm text-muted-foreground py-6 text-center">
                    {t("tb.timeline_empty")}
                </p>
            :   <ul className="flex flex-col">
                    {items.map((item, i) => (
                        <li
                            key={`${item.date}-${item.kind}-${i}`}
                            className="flex gap-3 border-b last:border-b-0 py-3"
                        >
                            <span className="text-xl leading-6">
                                {ICONS[item.kind]}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                    <span className="font-medium">
                                        {item.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {fmtDate(item.date)}
                                    </span>
                                </div>
                                {item.detail && (
                                    <p className="text-sm text-muted-foreground break-words">
                                        {item.detail}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                                    {item.amount !== null && (
                                        <span>
                                            {t("tb.amount")}:{" "}
                                            <b className="text-foreground tabular-nums">
                                                {formatMoney(Number(item.amount))}
                                            </b>
                                        </span>
                                    )}
                                    {item.executor_name && (
                                        <span>
                                            {t("tb.executor")}:{" "}
                                            {item.executor_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            }

            {isFetching && page > 1 && (
                <div className="flex justify-center py-3 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                </div>
            )}
            </div>
        </section>
    )
}

export default Timeline
