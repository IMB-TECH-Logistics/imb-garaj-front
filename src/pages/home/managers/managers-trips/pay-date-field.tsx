import { todayIso } from "@/lib/today-iso"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import CloseDateField from "./close-date-field"

export default function PayDateField({ value, onChange }: { value: string; onChange: (d: string) => void }) {
    const { t } = useTranslation()
    return <CloseDateField value={value} onChange={onChange} label={t("fin.kv2.pay_date")} hint={t("fin.kv2.pay_date_hint")} placeholder={t("trips.kclose.close_date_today")} />
}

export const usePayDate = (tripEnd?: string | null, key?: unknown) => {
    const [payDate, setPayDate] = useState("")
    useEffect(() => {
        const end = tripEnd?.slice(0, 10)
        setPayDate(end && end < todayIso() ? end : "")
    }, [tripEnd, key])
    return [payDate, setPayDate] as const
}
