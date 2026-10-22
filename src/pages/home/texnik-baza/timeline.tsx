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
            :   <ol className="flex flex-col">
                    {items.map((item, i) => (
                        <li
                            key={`${item.date}-${item.kind}-${i}`}
                            className="grid grid-cols-[5.5rem_2rem_1fr] gap-x-3"
                        >
                            <span className="pt-1.5 text-right text-sm text-muted-foreground tabular-nums">
                                {fmtDate(item.date)}
                            </span>
                            <div className="relative flex justify-center">
                                <span
                                    className={cn(
                                        "absolute left-1/2 w-px -translate-x-1/2 bg-border",
                                        i === 0 ? "top-4" : "top-0",
                                        i === items.length - 1 ? "h-4" : "bottom-0",
                                    )}
                                />
                                <span className="relative mt-0.5 flex size-8 items-center justify-center rounded-full border bg-background text-base">
                                    {ICONS[item.kind]}
                                </span>
                            </div>
                            <div className="min-w-0 pb-5 pt-1">
                                <div className="flex flex-wrap items-baseline gap-x-3">
                                    <span className="font-medium">
                                        {item.title}
                                    </span>
                                    {item.amount !== null && (
                                        <span className="text-sm font-semibold tabular-nums">
                                            {formatMoney(Number(item.amount))}
                                        </span>
                                    )}
                                </div>
                                {(item.detail || item.executor_name) && (
                                    <p className="text-sm text-muted-foreground break-words">
                                        {[item.detail, item.executor_name]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
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
