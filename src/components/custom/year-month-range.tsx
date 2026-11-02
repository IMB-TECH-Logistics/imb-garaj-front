import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Select from "@/components/ui/select"
import { useDateLocale } from "@/components/custom/use-date-locale"
import { cn } from "@/lib/utils"
import { endOfMonth, endOfYear, format, isSameDay, startOfMonth, startOfYear } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const DAY = "yyyy-MM-dd"
const FIRST_YEAR = 2025

const parseDay = (value?: string | null) => {
    if (!value) return undefined
    const d = new Date(`${value.slice(0, 10)}T00:00:00`)
    return Number.isNaN(d.getTime()) ? undefined : d
}

type Props = {
    from?: string | null
    to?: string | null
    onChange: (from?: string, to?: string) => void
    clearable?: boolean
    className?: string
    selectClassName?: string
}

export const YearMonthRange = ({ from: fromValue, to: toValue, onChange, clearable, className, selectClassName }: Props) => {
    const { t } = useTranslation()
    const locale = useDateLocale()
    const from = parseDay(fromValue)
    const to = parseDay(toValue)

    const emit = (start?: Date, end?: Date) => onChange(start ? format(start, DAY) : undefined, end ? format(end, DAY) : undefined)

    const wholeMonth = !!from && !!to && isSameDay(from, startOfMonth(from)) && isSameDay(to, endOfMonth(from))
    const wholeYear = !!from && !!to && isSameDay(from, startOfYear(from)) && isSameDay(to, endOfYear(from))
    const custom = !!(from || to) && !wholeMonth && !wholeYear
    const year = from && !custom ? from.getFullYear() : null
    const month = wholeMonth ? from!.getMonth() : null

    const years = useMemo(() => {
        const now = new Date().getFullYear()
        const last = Math.max(now, year ?? now)
        const first = Math.min(FIRST_YEAR, year ?? now)
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

    const pickYear = (y: number) => {
        if (month != null) {
            const d = new Date(y, month, 1)
            emit(startOfMonth(d), endOfMonth(d))
            return
        }
        const d = new Date(y, 0, 1)
        emit(startOfYear(d), endOfYear(d))
    }

    const pickMonth = (m: number) => {
        const d = new Date(year ?? new Date().getFullYear(), m, 1)
        emit(startOfMonth(d), endOfMonth(d))
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select
                className={cn("min-w-24", selectClassName)}
                value={year == null ? null : String(year)}
                setValue={(v) => pickYear(Number(v))}
                options={years}
                label={t("fin.kv2.year")}
            />
            <Select
                className={cn("min-w-32", selectClassName)}
                value={month == null ? null : String(month)}
                setValue={(v) => pickMonth(Number(v))}
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
                        title={custom && from ? `${format(from, "dd/MM/yyyy")} - ${format(to ?? from, "dd/MM/yyyy")}` : t("ui.date_picker.select_days")}
                        className={cn("shrink-0", selectClassName, custom && "border-primary text-primary")}
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={from}
                        selected={from || to ? { from, to } : undefined}
                        onSelect={(r) => emit(r?.from, r?.to ?? r?.from)}
                        numberOfMonths={2}
                        locale={locale}
                    />
                </PopoverContent>
            </Popover>
            {clearable && (from || to) && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" aria-label={t("contragent.filter.all")} onClick={() => emit()}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
