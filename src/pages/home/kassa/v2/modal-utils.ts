import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { errorText } from "./api"

export const useAmountRules = () => {
    const { t } = useTranslation()
    return { validate: (v: unknown) => Number(v) > 0 || t("kassa.amount_gt_zero") }
}

export const toLocalInput = (iso: string) => {
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
}

export const onErr = (e: unknown) => toast.error(errorText(e))
