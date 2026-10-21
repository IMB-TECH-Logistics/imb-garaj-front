import { useTranslation } from "react-i18next"
import CloseDateField from "./close-date-field"

export default function PayDateField({ value, onChange }: { value: string; onChange: (d: string) => void }) {
    const { t } = useTranslation()
    return <CloseDateField value={value} onChange={onChange} label={t("fin.kv2.pay_date")} hint={t("fin.kv2.pay_date_hint")} placeholder={t("trips.kclose.close_date_today")} />
}
