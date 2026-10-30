import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { ReactNode } from "react"
import { n, Overview } from "./api"
import { Exp } from "./summary-panel"

export const DriverHead = ({ switcher, selected, setDriver, setView }: { switcher: ReactNode; selected: Overview["drivers"][number]; setDriver: (v: null) => void; setView: (v: "kassa") => void }) => {
    const { t } = useTranslation()
    return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
            {switcher}
            <Badge className="gap-1.5 cursor-pointer" onClick={() => { setDriver(null); setView("kassa") }}>
                {selected.name}{selected.plate ? ` · ${selected.plate}` : ""}
                <X size={12} />
            </Badge>
        </div>
        <span className="text-sm">
            {t("fin.kv2.balance_label")} <b className="tabular-nums">{formatMoney(n(selected.balance))} {t("page.som")}</b>
        </span>
    </div>
    )
}

export const ExpensesHead = ({ switcher, exp, setView, amount, filters }: { switcher: ReactNode; exp: Exp; setView: (v: "kassa") => void; amount?: number | null; filters?: ReactNode }) => {
    const { t } = useTranslation()
    return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
            {switcher}
            <Badge className="gap-1.5 cursor-pointer" onClick={() => setView("kassa")}>
                {exp.label}
                <X size={12} />
            </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
            {filters}
            <span className="text-sm">
                <b className="tabular-nums">{formatMoney(amount ?? exp.amount)} {t("page.som")}</b>
            </span>
        </div>
    </div>
    )
}
