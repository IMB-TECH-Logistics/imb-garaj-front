import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import KassaSummary, { KassaSummaryData, KassaSummaryGroup } from "./summary"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, Plus, Send } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RefObject } from "react"

export type DriverRow = {
    id?: number
    full_name: string
    balance: string
}

export type PendingCounts = {
    requests: number
    order_cashflows: number
}

type KassaSidebarProps = {
    view: "transactions" | "logs" | "requests" | "report"
    groupFilter: KassaSummaryGroup | undefined
    kindFilter: "all" | "cash" | "card"
    pendingCounts: PendingCounts | undefined
    hasControl: boolean
    handleSummaryGroup: (group: KassaSummaryGroup, data: KassaSummaryData) => void
    handleSummaryKind: (kind: "cash" | "card") => void
    handleSummaryDrivers: () => void
    goToRequests: () => void
    openExpense: () => void
    openTopUp: () => void
    openTransfer: () => void
    openRequest: () => void
    driversRef: RefObject<HTMLDivElement>
    driversHighlight: boolean
    driversTotal: number
    drivers: DriverRow[]
    driverFilterId: number | null
    handleDriverClick: (driver: DriverRow) => void
}

export const KassaSidebar = ({ view, groupFilter, kindFilter, pendingCounts, hasControl, handleSummaryGroup, handleSummaryKind, handleSummaryDrivers, goToRequests, openExpense, openTopUp, openTransfer, openRequest, driversRef, driversHighlight, driversTotal, drivers, driverFilterId, handleDriverClick }: KassaSidebarProps) => {
    const { t } = useTranslation()
    return (
        <Card className="bg-muted/60 md:h-full flex flex-col overflow-hidden">
            <CardHeader className="space-y-2 shrink-0 p-3">
                <KassaSummary
                    activeGroup={view === "transactions" ? groupFilter : undefined}
                    activeKind={view === "transactions" && kindFilter !== "all" ? kindFilter : undefined}
                    onGroup={handleSummaryGroup}
                    onKind={handleSummaryKind}
                    onDrivers={handleSummaryDrivers}
                />
                {!!pendingCounts?.requests && (
                    <button type="button" onClick={goToRequests} className="w-fit">
                        <Badge variant="orange">
                            {t("kassa.pending_requests", { count: pendingCounts.requests })}
                        </Badge>
                    </button>
                )}
            </CardHeader>
            <CardContent className="pt-0 space-y-3 flex-1 min-h-0 flex flex-col">
                {hasControl && (
                    <div className="gap-2 flex items-center flex-wrap shrink-0">
                        <Button
                            variant="destructive"
                            type="button"
                            className="flex-1 min-w-[45%]"
                            onClick={openExpense}
                        >
                            <Plus size={20} />
                            {t("actions.add_expense_btn")}
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 min-w-[45%]"
                            onClick={openTopUp}
                        >
                            <Plus size={20} />
                            {t("page.top_up_balance")}
                        </Button>
                        <Button
                            variant="secondary"
                            type="button"
                            className="flex-1 min-w-[45%]"
                            onClick={openTransfer}
                        >
                            <ArrowLeftRight size={18} />
                            {t("kassa.transfer")}
                        </Button>
                        <Button
                            variant="secondary"
                            type="button"
                            className="flex-1 min-w-[45%]"
                            onClick={openRequest}
                        >
                            <Send size={18} />
                            {t("kassa.request")}
                        </Button>
                    </div>
                )}

                <div
                    ref={driversRef}
                    className={cn(
                        "border-t pt-3 shrink-0 rounded-md transition-colors",
                        driversHighlight && "bg-primary/10",
                    )}
                >
                    <p className="text-sm text-muted-foreground">
                        {t("page.drivers_balance")}
                    </p>
                    <p className="text-xl font-semibold mt-0.5">
                        {formatMoney(driversTotal)} {t("page.som")}
                    </p>
                </div>

                <div className="border-t pt-3 flex-1 min-h-0 flex flex-col">
                    <p className="text-sm font-medium text-muted-foreground mb-2 shrink-0">
                        {t("page.details")}
                    </p>
                    <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
                        {drivers.map((driver, i) => {
                            const isActive =
                                driverFilterId === driver.id
                            return (
                                <div
                                    key={driver.id}
                                    onClick={() =>
                                        handleDriverClick(driver)
                                    }
                                    className={cn(
                                        "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted/80",
                                    )}
                                >
                                    <span className="text-sm flex items-center gap-2 min-w-0">
                                        <span className="text-xs text-muted-foreground w-4 text-right">
                                            {i + 1}
                                        </span>
                                        <span className="truncate">{driver.full_name}</span>
                                    </span>
                                    <span className="text-sm font-medium">
                                        {formatMoney(Number(driver.balance ?? 0))}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
