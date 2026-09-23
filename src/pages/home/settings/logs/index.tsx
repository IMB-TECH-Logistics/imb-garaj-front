import { ParamCombobox } from "@/components/as-params/combobox"
import ParamInput from "@/components/as-params/input"
import ParamTabs from "@/components/as-params/tabs"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { LOGS_LIST, LOGS_SECTION, SETTINGS_SELECTABLE_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useLogsCols } from "./cols"
import LogDetailSheet from "./log-detail"
import { getSectionLabel } from "./sections"
import { useTranslation } from "react-i18next"

const useActionOptions = () => {
    const { t } = useTranslation()
    return [
        { value: "1", label: t("log.created") },
        { value: "2", label: t("log.updated") },
        { value: "3", label: t("log.deleted") },
        { value: "4", label: t("log.login") },
        { value: "5", label: t("log.logout") },
        { value: "6", label: t("log.exported") },
        { value: "7", label: t("log.imported") },
    ]
}

const DEVICE_OPTIONS = [
    { value: "Desktop", label: "Desktop" },
    { value: "Mobile", label: "Mobile" },
    { value: "Tablet", label: "Tablet" },
]

export default function LogsPage() {
    const { t } = useTranslation()
    const ACTION_OPTIONS = useActionOptions()
    const search = useSearch({ strict: false }) as Record<string, unknown>

    const { data: logs, isLoading } = useGet<ListResponse<LogItem>>(LOGS_LIST, {
        params: search,
    })

    const { section: _section, ...sectionParams } = search as any
    const { data: logs_sections } = useGet<LogSection[]>(LOGS_SECTION, {
        params: sectionParams,
    })

    const [selected, setSelected] = useState<LogItem | null>(null)
    const cols = useLogsCols((log) => setSelected(log))

    const { data: users } = useGet<any[]>(SETTINGS_SELECTABLE_USERS)
    const userOptions = useMemo(
        () =>
            (users || []).map((u: any) => ({
                value: u.id,
                label:
                    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                    u.username ||
                    String(u.id),
            })),
        [users],
    )

    const tabOptions = useMemo(
        () => [
            { value: "", label: t("page.all_label") },
            ...((logs_sections as LogSection[]) || []).map((item) => ({
                value: item.section,
                label: `${getSectionLabel(item.section)} (${item.count})`,
            })),
        ],
        [logs_sections, t],
    )

    return (
        <>
            <div className="space-y-3">
                <div className="my-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl">{t("nav.activity_log")}</h1>
                        <Badge>{formatMoney(logs?.count ?? 0)}</Badge>
                    </div>

                    <ParamTabs paramName="section" options={tabOptions} />

                    <div className="flex flex-wrap items-center gap-2">
                        <ParamInput />

                        <ParamDateRange from="from_date" to="to_date" />

                        <ParamCombobox
                            paramName="user"
                            options={userOptions}
                            label={t("table.user_col")}
                            className="w-56"
                            labelKey="label"
                            valueKey="value"
                            addButtonProps={{
                                className:
                                    "w-full sm:w-56 shrink-0 justify-between font-normal",
                            }}
                        />

                        <ParamCombobox
                            paramName="action"
                            options={ACTION_OPTIONS}
                            label={t("form.action_type")}
                            className="w-48"
                            labelKey="label"
                            valueKey="value"
                            addButtonProps={{
                                className:
                                    "w-full sm:w-48 shrink-0 justify-between font-normal",
                            }}
                        />

                        <ParamCombobox
                            paramName="device"
                            options={DEVICE_OPTIONS}
                            label={t("form.device")}
                            labelKey="label"
                            valueKey="value"
                            className="w-48"
                            addButtonProps={{
                                className:
                                    "w-full sm:w-48 shrink-0 justify-between font-normal",
                            }}
                        />
                    </div>
                </div>

                <DataTable
                    columns={cols}
                    data={logs?.results || []}
                    loading={isLoading}
                    numeration
                    paginationProps={{
                        totalPages: logs?.total_pages,
                        paramName: "page",
                        pageSizeParamName: "page_size",
                    }}
                />
            </div>

            <LogDetailSheet log={selected} onClose={() => setSelected(null)} />
        </>
    )
}
