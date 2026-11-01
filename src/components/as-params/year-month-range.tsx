import Select from "@/components/ui/select"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { endOfMonth, format, parseISO } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const pad = (n: number) => String(n).padStart(2, "0")

export default function ParamYearMonth({ from = "from_date", to = "to_date" }: { from?: string; to?: string }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as Record<string, string | undefined>
    const now = new Date()
    const fromValue = search[from]
    const toValue = search[to]

    const current = useMemo(() => {
        if (!fromValue && !toValue) return { year: now.getFullYear(), month: now.getMonth() + 1 }
        if (!fromValue || !toValue) return null
        const start = parseISO(fromValue)
        const end = parseISO(toValue)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
        const whole = start.getDate() === 1 && format(endOfMonth(start), "yyyy-MM-dd") === format(end, "yyyy-MM-dd")
        return whole ? { year: start.getFullYear(), month: start.getMonth() + 1 } : null
    }, [fromValue, toValue])

    const years = useMemo(() => {
        const last = now.getFullYear()
        return Array.from({ length: last - 2023 + 1 }, (_, i) => ({ value: String(last - i), label: String(last - i) }))
    }, [])
    const months = useMemo(
        () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: t(`fleet.months.m${pad(i + 1)}`) })),
        [t],
    )

    const apply = (year: number, month: number) => {
        const start = new Date(year, month - 1, 1)
        navigate({
            search: (prev: Record<string, unknown>) => ({
                ...prev,
                [from]: format(start, "yyyy-MM-dd"),
                [to]: format(endOfMonth(start), "yyyy-MM-dd"),
            }),
        } as never)
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                className="w-24 !bg-background dark:!bg-secondary"
                label={t("fleet.year")}
                value={current ? String(current.year) : null}
                options={years}
                setValue={(v) => apply(Number(v), current?.month ?? now.getMonth() + 1)}
            />
            <Select
                className="w-32 !bg-background dark:!bg-secondary"
                label={t("fleet.month")}
                value={current ? String(current.month) : null}
                options={months}
                setValue={(v) => apply(current?.year ?? now.getFullYear(), Number(v))}
            />
        </div>
    )
}
