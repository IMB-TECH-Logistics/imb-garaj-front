import { ParamCombobox } from "@/components/as-params/combobox"
import ParamInput from "@/components/as-params/input"
import ParamTabs from "@/components/as-params/tabs"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { LOGS_LIST, LOGS_SECTION } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useLogsCols } from "./cols"
import LogDetailSheet from "./log-detail"
import { getSectionLabel } from "./sections"

const ACTION_OPTIONS = [
    { value: "1", label: "Yaratildi" },
    { value: "2", label: "Yangilandi" },
    { value: "3", label: "O'chirildi" },
    { value: "4", label: "Kirish" },
    { value: "5", label: "Chiqish" },
    { value: "6", label: "Eksport qilindi" },
    { value: "7", label: "Import qilindi" },
]

const DEVICE_OPTIONS = [
    { value: "Desktop", label: "Desktop" },
    { value: "Mobile", label: "Mobile" },
    { value: "Tablet", label: "Tablet" },
]

export default function LogsPage() {
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

    const tabOptions = useMemo(
        () => [
            { value: "", label: "Barchasi" },
            ...((logs_sections as LogSection[]) || []).map((item) => ({
                value: item.section,
                label: `${getSectionLabel(item.section)} (${item.count})`,
            })),
        ],
        [logs_sections],
    )

    return (
        <>
            <div className="space-y-3">
                <div className="my-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl">Faoliyat jurnali</h1>
                        <Badge>{formatMoney(logs?.count ?? 0)}</Badge>
                    </div>

                    <ParamTabs paramName="section" options={tabOptions} />

                    <div className="flex flex-wrap items-center gap-2">
                        <ParamInput />

                        <ParamCombobox
                            paramName="action"
                            options={ACTION_OPTIONS}
                            label="Harakat turi"
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
                            label="Qurilma"
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
