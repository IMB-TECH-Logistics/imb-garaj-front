import Modal from "@/components/custom/modal"
import { DatePickerWithRange } from "@/components/form/date-range-picker"
import { Button } from "@/components/ui/button"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useModal } from "@/hooks/useModal"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { KV2_EXCEL, usePeriod } from "./api"

export const EXCEL_MODAL = "kassa-v2-excel"

export const ExcelModal = () => {
    const { t } = useTranslation()
    const period = usePeriod()
    const { isOpen, closeModal } = useModal(EXCEL_MODAL)
    const [range, setRange] = useState<DateRange | undefined>()
    useEffect(() => {
        if (!isOpen) return
        setRange({
            from: period.from_date ? new Date(period.from_date) : undefined,
            to: period.to_date ? new Date(period.to_date) : undefined,
        })
    }, [isOpen])
    const params = {
        from_date: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
        to_date: range?.to ? format(range.to, "yyyy-MM-dd") : range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
    }
    const excel = useDownloadAsExcel({ url: KV2_EXCEL, name: `kassa_${params.from_date ?? t("fin.kv2.file_from_start")}_${params.to_date ?? t("fin.kv2.file_until_today")}`, params })
    return (
        <Modal modalKey={EXCEL_MODAL} title={`Excel ${t("actions.download")}`} size="max-w-md">
            <div className="flex flex-col gap-3">
                <DatePickerWithRange date={range} setDate={setRange} />
                <Button loading={excel.isFetching} onClick={async () => { await excel.trigger(); closeModal() }}>
                    <Download size={16} />
                    {t("actions.download")}
                </Button>
            </div>
        </Modal>
    )
}
