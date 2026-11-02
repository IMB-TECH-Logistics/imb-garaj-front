import { YearMonthRange } from "@/components/custom/year-month-range"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useEffect } from "react"

const DAY = "yyyy-MM-dd"

export const KassaPeriodFilter = () => {
    const navigate = useNavigate()
    const search = useSearch({ from: "/_main" }) as Record<string, unknown>
    const from = search.from_date as string | undefined
    const to = search.to_date as string | undefined

    const setRange = (start?: string, end?: string, replace = false) =>
        navigate({ search: { ...search, from_date: start, to_date: end, page: undefined } as never, replace })

    useEffect(() => {
        if (!from && !to) {
            const now = new Date()
            setRange(format(startOfMonth(now), DAY), format(endOfMonth(now), DAY), true)
        }
    }, [from, to])

    return <YearMonthRange className="w-full" selectClassName="!bg-muted/50" from={from} to={to} onChange={(a, b) => a && setRange(a, b)} />
}
