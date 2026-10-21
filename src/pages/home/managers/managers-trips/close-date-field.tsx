import { DatePicker } from "@/components/ui/datepicker"
import { Button } from "@/components/ui/button"
import { todayIso } from "@/lib/today-iso"
import { format, parseISO } from "date-fns"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function CloseDateField({ value, onChange }: { value?: string; onChange: (d: string) => void }) {
    const { t } = useTranslation()
    const today = parseISO(todayIso())
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("trips.kclose.close_date")}</span>
            <div className="flex items-center gap-2">
                <DatePicker
                    fullWidth
                    date={value ? parseISO(value) : undefined}
                    setDate={(d: Date | undefined) => {
                        const v = d ? format(d, "yyyy-MM-dd") : ""
                        onChange(v === todayIso() ? "" : v)
                    }}
                    placeholder={t("trips.kclose.close_date_today")}
                    calendarProps={{ disabled: { after: today } }}
                />
                {value && (
                    <Button type="button" variant="outline" size="icon" onClick={() => onChange("")}>
                        <X size={14} />
                    </Button>
                )}
            </div>
            <span className="text-xs text-muted-foreground">{t("trips.kclose.close_date_hint")}</span>
        </div>
    )
}
