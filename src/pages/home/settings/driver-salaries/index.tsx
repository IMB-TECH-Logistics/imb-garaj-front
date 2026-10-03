import ParamInput from "@/components/as-params/input"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { DataTable } from "@/components/ui/datatable"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import BulkSalaryModal from "./bulk-salary-modal"
import {
    routeLabel,
    useSalaryColumns,
    VILOYAT_TARIFFS,
    type ViloyatTariffRow,
    type ViloyatTariffsResponse,
} from "./cols"
import EditSalaryModal from "./edit-salary-modal"
import PrastoyCard from "./prastoy-card"

const DriverSalariesPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_driver_salaries_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const { openModal: openBulkModal } = useModal("bulk-salary")
    const { openModal: openEditModal } = useModal("edit-salary")
    const [editingRow, setEditingRow] = useState<ViloyatTariffRow | null>(null)
    const [selectedRows, setSelectedRows] = useState<ViloyatTariffRow[]>([])
    const [clearSelectionTick, setClearSelectionTick] = useState(0)

    const { data, isLoading } = useGet<ViloyatTariffsResponse>(VILOYAT_TARIFFS)

    const viloyat: string | undefined = search.sf_viloyat
        ? String(search.sf_viloyat)
        : undefined
    const query: string = String(search.salary_search ?? "")
        .trim()
        .toLowerCase()

    const internalLabel = (name: string) => t("page.vt_internal", { name })

    const rows = useMemo<ViloyatTariffRow[]>(
        () =>
            (data?.results ?? [])
                .map((r) => ({ ...r, id: r.key }))
                .filter(
                    (r) =>
                        !viloyat ||
                        String(r.from_region) === viloyat ||
                        String(r.to_region) === viloyat,
                )
                .filter(
                    (r) =>
                        !query ||
                        routeLabel(r, (name) => name)
                            .toLowerCase()
                            .includes(query),
                ),
        [data, viloyat, query],
    )

    const columns = useSalaryColumns()

    const setViloyat = (val: string | number | null) =>
        navigate({
            search: ((prev: Record<string, unknown>) => ({
                ...prev,
                sf_viloyat: val ? String(val) : undefined,
                page: undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            })) as any,
        })

    const handleEdit = (row: { original: ViloyatTariffRow }) => {
        setEditingRow(row.original)
        openEditModal()
    }

    return (
        <>
            {data && "prastoy_daily_amount" in data && (
                <PrastoyCard
                    amount={data.prastoy_daily_amount ?? null}
                    validFrom={data.prastoy_valid_from}
                    canEdit={hasControl}
                />
            )}
            <DataTable
                loading={isLoading}
                columns={columns}
                data={rows}
                selecteds_row={hasControl}
                onEdit={hasControl ? handleEdit : undefined}
                onSelectedRowsChange={setSelectedRows}
                clearSelectionTrigger={clearSelectionTick}
                numeration
                paginationProps={{
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100],
                    PageSize: 100,
                }}
                head={
                    <TableHeader
                        fileName={t("page.vt_title")}
                        url="excel"
                        pageKey="page"
                        count={rows.length}
                        extraTitle={
                            selectedRows.length > 0 ? (
                                <Badge variant="secondary" className="text-sm">
                                    {t("page.vt_selected", {
                                        count: selectedRows.length,
                                    })}
                                </Badge>
                            ) : null
                        }
                        extraRight={
                            <>
                                <div className="w-52">
                                    <Combobox
                                        className="h-10 text-sm"
                                        label={t("page.vt_viloyat")}
                                        options={data?.viloyats}
                                        value={viloyat ?? null}
                                        setValue={setViloyat}
                                        labelKey="name"
                                        valueKey="id"
                                    />
                                </div>
                                <div className="w-full sm:w-72">
                                    <ParamInput
                                        fullWidth
                                        searchKey="salary_search"
                                        pageKey="page"
                                    />
                                </div>
                                {hasControl && selectedRows.length > 0 ? (
                                    <Button
                                        type="button"
                                        onClick={openBulkModal}
                                        icon={<Wallet size={16} />}
                                    >
                                        {t("actions.give_salary_btn")}
                                    </Button>
                                ) : null}
                            </>
                        }
                    />
                }
            />
            <Modal
                title={t("page.vt_edit_title")}
                modalKey="edit-salary"
                size="max-w-md"
            >
                {editingRow && (
                    <EditSalaryModal
                        row={editingRow}
                        title={routeLabel(editingRow, internalLabel)}
                    />
                )}
            </Modal>
            <Modal
                title={t("actions.give_salary_btn")}
                modalKey="bulk-salary"
                size="max-w-md"
            >
                <BulkSalaryModal
                    selected={selectedRows}
                    onApplied={() => setClearSelectionTick((n) => n + 1)}
                />
            </Modal>
        </>
    )
}

export default DriverSalariesPage
