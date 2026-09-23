import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange, { isReversedRange } from "@/components/as-params/date-picker-range"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_RUNS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { Download } from "lucide-react"
import BuxgalteriyaExcelModal, {
    useBuxgalteriyaExcelModal,
} from "../buxgalteriya/excel-modal"
import { useRunFilterOptions } from "../buxgalteriya/loading-options"
import { ReysOrder, useFlightsColumns } from "./columns"
import { useTranslation } from "react-i18next"

export default function FlightsPage() {
    const { t } = useTranslation()
    const search: any = useSearch({ strict: false })

    const { openModal: openExcelModal } = useBuxgalteriyaExcelModal()

    const currentDate = new Date()
    const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
    )

    const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
    )

    const isReversed = isReversedRange(search?.from_date, search?.to_date)

    const defaultDateRange =
        (!search?.from_date && !search?.to_date) || isReversed ?
            { from: startOfMonth, to: endOfMonth }
        :   undefined

    const {
        loadingOptions,
        unloadingOptions,
        clientOptions,
        cargoTypeOptions,
    } = useRunFilterOptions({
        from_date: search?.from_date,
        to_date: search?.to_date,
        search: search?.search,
        enabled: !isReversed,
    })

    const { data, isLoading } = useGet<ListResponse<ReysOrder>>(MANAGERS_RUNS, {
        enabled: !isReversed,
        params: {
            from_date: search?.from_date,
            to_date: search?.to_date,
            page: search?.page,
            page_size: search?.page_size,
            search: search?.search,
            client: search?.client,
            loading: search?.loading,
            unloading: search?.unloading,
            cargo_type: search?.cargo_type,
            ordering: search?.ordering,
        },
    })

    const columns = useFlightsColumns()

    const comboStyle = {
        className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
    }

    return (
        <div className="space-y-3">
            <DataTable
                columns={columns ?? []}
                loading={isLoading}
                data={data?.results || []}
                numeration
                manualSorting
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <div className="space-y-3 mb-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg">{t("nav.flights")}</h1>
                                <Badge>{formatMoney(data?.count ?? 0)}</Badge>
                            </div>

                            <div className="flex items-center justify-end gap-3 flex-wrap">
                                <ParamCombobox
                                    paramName="client"
                                    options={clientOptions}
                                    label={t("form.company_name")}
                                    addButtonProps={comboStyle}
                                />

                                <ParamCombobox
                                    paramName="loading"
                                    options={loadingOptions}
                                    label={t("form.loading_location")}
                                    addButtonProps={comboStyle}
                                />

                                <ParamCombobox
                                    paramName="unloading"
                                    options={unloadingOptions}
                                    label={t("form.unloading_location")}
                                    addButtonProps={comboStyle}
                                />

                                <ParamCombobox
                                    paramName="cargo_type"
                                    options={cargoTypeOptions}
                                    label={t("form.cargo_type")}
                                    addButtonProps={comboStyle}
                                />

                                <ParamDateRange
                                    from="from_date"
                                    to="to_date"
                                    defaultValue={defaultDateRange}
                                    addButtonProps={{
                                        className:
                                            "!bg-background dark:!bg-secondary min-w-44 justify-start",
                                    }}
                                />

                                <Button
                                    icon={<Download width={16} />}
                                    onClick={openExcelModal}
                                >
                                    Excel
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            />

            <BuxgalteriyaExcelModal />
        </div>
    )
}
