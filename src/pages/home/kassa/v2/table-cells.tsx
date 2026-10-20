import { Combobox } from "@/components/ui/combobox"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate, CloseBreakdown, money, n } from "./api"

export const Money = ({ v, dir }: { v: number | string; dir?: "in" | "out" }) => {
    const x = n(v)
    const sign = dir ? (dir === "in" ? "+" : "−") : x < 0 ? "−" : "+"
    const pos = dir ? dir === "in" : x >= 0
    return <span className={cn("font-semibold tabular-nums whitespace-nowrap", pos ? "text-green-600" : "text-destructive")}>{sign}{formatMoney(Math.abs(x))}</span>
}

export const Party = ({ name, trip }: { name: string | null; trip: number | null }) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col">
            <span className="whitespace-nowrap">{name || "—"}</span>
            {trip && <span className="text-xs text-muted-foreground">{t("fin.kv2.turnover_n", { id: trip })}</span>}
        </div>
    )
}

export const Note = ({ v }: { v: string | null | undefined }) => <span className="text-muted-foreground line-clamp-2 max-w-48">{v || "—"}</span>

export const CloseLines = ({ c }: { c: CloseBreakdown }) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col text-xs tabular-nums whitespace-nowrap">
            {n(c.earned) !== 0 && <span>{t("fin.kv2.trip_cash_paren")}: <span className="text-green-600">+{money(c.earned)}</span></span>}
            {n(c.avans_left) !== 0 && (
                <span>
                    {n(c.avans_left) > 0 ? t("fin.kv2.advance_left") : t("fin.kv2.advance_overspent")}:{" "}
                    <span className={n(c.avans_left) > 0 ? "text-green-600" : "text-destructive"}>{n(c.avans_left) > 0 ? "+" : "−"}{money(Math.abs(n(c.avans_left)))}</span>
                </span>
            )}
            {n(c.salary) !== 0 && <span>{t("table.monthly_salary")}: <span className="text-destructive">−{money(c.salary)}</span></span>}
        </div>
    )
}

export const DateCell = ({ v }: { v: string | null }) => <span className="whitespace-nowrap text-muted-foreground">{fmtDate(v)}</span>

export const Head = ({ left, right }: { left: ReactNode; right?: ReactNode }) => (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">{left}</div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">{right}</div>
    </div>
)

export const Filter = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) => (
    <Combobox
        label=""
        options={options.map(([id, name]) => ({ id, name }))}
        value={value}
        setValue={(v: any) => v != null && v !== "" && onChange(String(v))}
        labelKey="name"
        valueKey="id"
        isClearIcon={false}
        isSearch={false}
        className="h-10 w-44"
    />
)

export const Part = ({ v, sign }: { v: number | string | undefined; sign: "+" | "−" }) => {
    const x = n(v)
    if (!x) return <span className="text-muted-foreground">—</span>
    const plus = sign === "+" ? x > 0 : x < 0
    return <span className={cn("tabular-nums whitespace-nowrap font-medium", plus ? "text-green-600" : "text-destructive")}>{plus ? "+" : "−"}{money(Math.abs(x))}</span>
}
