import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Select from "@/components/ui/select"
import { useDateLocale } from "@/components/custom/use-date-locale"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { endOfMonth, format, isSameDay, startOfMonth } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useEffect, useMemo } from "react"
import { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"

const DAY = "yyyy-MM-dd"
const FIRST_YEAR = 2025

const parseDay = (value?: string) => {
    if (!value) return undefined
    const d = new Date(`${value}T00:00:00`)
    return Number.isNaN(d.getTime()) ? undefined : d
}

export const KassaPeriodFilter = () => {
    const { t } = useTranslation()
    const locale = useDateLocale()
    const navigate = useNavigate()
    const search = useSearch({ from: "/_main" }) as Record<string, unknown>
    const from = parseDay(search.from_date as string | undefined)
    const to = parseDay(search.to_date as string | undefined)

    const setRange = (start?: Date, end?: Date, replace = false) =>
        navigate({
            search: {
                ...search,
                from_date: start ? format(start, DAY) : undefined,
                to_date: end ? format(end, DAY) : undefined,
                page: undefined,
            } as never,
            replace,
        })

    useEffect(() => {
        if (!search.from_date && !search.to_date) {
            const now = new Date()
            setRange(startOfMonth(now), endOfMonth(now), true)
        }
    }, [search.from_date, search.to_date])

    const wholeMonth = !!from && !!to && isSameDay(from, startOfMonth(from)) && isSameDay(to, endOfMonth(from))
    const base = from ?? new Date()
    const year = base.getFullYear()
    const month = wholeMonth ? from!.getMonth() : null

    const years = useMemo(() => {
        const last = Math.max(new Date().getFullYear(), year)
        const first = Math.min(FIRST_YEAR, year)
        return Array.from({ length: last - first + 1 }, (_, i) => ({ value: String(last - i), label: String(last - i) }))
    }, [year])

    const months = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => {
                const name = format(new Date(2000, i, 1), "LLLL", { locale })
                return { value: String(i), label: name.charAt(0).toUpperCase() + name.slice(1) }
            }),
        [locale],
    )

    const pickMonth = (y: number, m: number) => {
        const d = new Date(y, m, 1)
        setRange(startOfMonth(d), endOfMonth(d))
    }

    const range: DateRange | undefined = from || to ? { from, to } : undefined

    return (
        <div className="flex w-full items-center gap-2">
            <Select
                className="!bg-muted/50"
                value={String(year)}
                setValue={(v) => pickMonth(Number(v), month ?? base.getMonth())}
                options={years}
                label={t("fin.kv2.year")}
            />
            <Select
                className="!bg-muted/50"
                value={month == null ? null : String(month)}
                setValue={(v) => pickMonth(year, Number(v))}
                options={months}
                label={t("fin.kv2.month")}
            />
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={t("ui.date_picker.select_days")}
                        title={from && to && !wholeMonth ? `${format(from, "dd/MM/yyyy")} - ${format(to, "dd/MM/yyyy")}` : t("ui.date_picker.select_days")}
                        className={cn("shrink-0 !bg-muted/50", from && to && !wholeMonth && "border-primary text-primary")}
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={from}
                        selected={range}
                        onSelect={(r) => setRange(r?.from, r?.to ?? r?.from)}
                        numberOfMonths={2}
                        locale={locale}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
