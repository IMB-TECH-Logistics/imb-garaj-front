import { DatePicker } from "@/components/ui/datepicker"
import type { MonitoringFilters } from "./types"
import { useTranslation } from "react-i18next"

type Props = {
    value: MonitoringFilters
    onChange: (next: MonitoringFilters) => void
}

export default function MonitoringFilterBar({ value, onChange }: Props) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap items-center gap-2">
            <DatePicker
                date={value.fromDate ? new Date(value.fromDate) : ""}
                setDate={(d: string) =>
                    onChange({ ...value, fromDate: d, toDate: d })
                }
                placeholder={t("form.date")}
                defaultValue={new Date()}
                className="h-9 w-auto min-w-[120px]"
                calendarProps={{ disabled: { after: new Date() } }}
            />
        </div>
    )
}
