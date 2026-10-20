import ParamDateRange from "@/components/as-params/date-picker-range"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParamCombobox } from "@/components/as-params/combobox"
import { TRANSACTIONS } from "@/constants/api-endpoints"
import { KassaSummaryGroup } from "./summary"
import { formatMoney } from "@/lib/format-money"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ReactNode } from "react"
import { Transaction } from "./transaction-cols"
import { DriverRow } from "./kassa-sidebar"

type TransactionsHeadProps = {
    viewSwitcher: ReactNode
    transactionsData: ListResponse<Transaction> | undefined
    groupFilter: KassaSummaryGroup | undefined
    clearGroupFilter: () => void
    selectedDriver: DriverRow | null | undefined
    clearDriverFilter: () => void
    vehicles: { id: number; name: string }[]
    kindFilter: "all" | "cash" | "card"
    handleKindChange: (val: string) => void
    typeFilter: "all" | "1" | "-1"
    handleTypeChange: (val: string) => void
    filterParams: Record<string, unknown>
}

export const TransactionsHead = ({ viewSwitcher, transactionsData, groupFilter, clearGroupFilter, selectedDriver, clearDriverFilter, vehicles, kindFilter, handleKindChange, typeFilter, handleTypeChange, filterParams }: TransactionsHeadProps) => {
    const { t } = useTranslation()
    return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
            {viewSwitcher}
            <Badge>
                {formatMoney(transactionsData?.count)}
            </Badge>
            {groupFilter && (
                <Badge
                    variant="outline"
                    className="gap-1 pr-1"
                >
                    {t(`kassa.group_${groupFilter}`)}
                    <button
                        type="button"
                        onClick={clearGroupFilter}
                        className="ml-1 p-0.5 rounded hover:bg-muted"
                        aria-label={t("page.clear_filters")}
                    >
                        <X size={12} />
                    </button>
                </Badge>
            )}
            {selectedDriver && (
                <Badge
                    variant="outline"
                    className="gap-1 pr-1"
                >
                    {t("form.driver")}: {selectedDriver.full_name}
                    <button
                        type="button"
                        onClick={clearDriverFilter}
                        className="ml-1 p-0.5 rounded hover:bg-muted"
                        aria-label={t("page.clear_filters")}
                    >
                        <X size={12} />
                    </button>
                </Badge>
            )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <ParamCombobox
                paramName="vehicle"
                options={vehicles}
                label={t("form.vehicle")}
                addButtonProps={{
                    className: "!bg-background dark:!bg-secondary min-w-40 justify-start",
                }}
            />
            <Tabs
                value={kindFilter}
                onValueChange={handleKindChange}
            >
                <TabsList className="h-9">
                    <TabsTrigger value="all">
                        {t("status.all")}
                    </TabsTrigger>
                    <TabsTrigger value="cash">
                        {t("kassa.cash")}
                    </TabsTrigger>
                    <TabsTrigger value="card">
                        {t("kassa.card")}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <Tabs
                value={typeFilter}
                onValueChange={handleTypeChange}
            >
                <TabsList className="h-9">
                    <TabsTrigger value="all">
                        {t("status.all")}
                    </TabsTrigger>
                    <TabsTrigger value="1">
                        {t("form.income")}
                    </TabsTrigger>
                    <TabsTrigger value="-1">
                        {t("form.expense")}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <ParamDateRange
                from="from_date"
                to="to_date"
            />
            <DownloadAsExcel
                url={`${TRANSACTIONS}/excel`}
                name={t("fin.kassa.excel_name")}
                params={filterParams}
            />
        </div>
    </div>
    )
}
