import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import type { VehicleExpenseRow } from "./cols"

type Row = Pick<VehicleExpenseRow, "amount" | "warehouse_total" | "items" | "services" | "services_total">

/** Texnik ko'rik summasi tarkibi: ombordan olingan mahsulot + usta xizmati = jami.
 *  Kassada faqat xizmat (naqd to'lanadigan qism) turadi, ombor mahsuloti kassaga tushmaydi —
 *  shuning uchun ikkalasi doim alohida ko'rsatiladi. */
export const expenseParts = (row: Row) => {
    const products =
        Number(row.warehouse_total) ||
        (row.items ?? []).reduce((sum, item) => sum + (Number(item.total) || 0), 0)
    const services =
        Number(row.services_total) ||
        (row.services ?? []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0) ||
        Number(row.amount) ||
        0
    return { products, services, total: products + services }
}

export function ExpenseBreakdown({ row, size = "sm" }: { row: Row; size?: "sm" | "lg" }) {
    const { t } = useTranslation()
    const { products, services, total } = expenseParts(row)
    const both = products > 0 && services > 0
    const line = size === "lg" ? "text-sm" : "text-xs"
    return (
        <div className={cn("flex flex-col gap-0.5 tabular-nums whitespace-nowrap", size === "lg" ? "items-stretch" : "items-end")}>
            {both && (
                <>
                    <span className={cn(line, "text-muted-foreground flex w-full justify-between gap-3")}>
                        <span>{t("texnik.breakdown.products")}</span>
                        <span>{formatMoney(products)}</span>
                    </span>
                    <span className={cn(line, "text-muted-foreground flex w-full justify-between gap-3")}>
                        <span>{t("texnik.breakdown.services")}</span>
                        <span>{formatMoney(services)}</span>
                    </span>
                </>
            )}
            <span
                className={cn(
                    "font-semibold text-red-600 flex w-full justify-between gap-3",
                    size === "lg" ? "text-base" : "text-sm",
                    both && "border-t pt-0.5",
                )}
            >
                {both ? <span>{t("texnik.breakdown.total")}</span> : <span />}
                <span>
                    {formatMoney(total)}
                    {size === "lg" ? ` ${t("page.som")}` : ""}
                </span>
            </span>
        </div>
    )
}
