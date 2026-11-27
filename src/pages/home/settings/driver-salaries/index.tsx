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
import { Switch } from "@/components/ui/switch"
import { MapPin, Wallet } from "lucide-react"
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
import CitiesModal from "./cities-modal"
import EditSalaryModal from "./edit-salary-modal"
import PrastoyCard from "./prastoy-card"

const DriverSalariesPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_driver_salaries_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const { openModal: openBulkModal } = useModal("bulk-salary")
    const { openModal: openEditModal } = useModal("edit-salary")
    const { openModal: openCitiesModal } = useModal("separate-cities")
    const onlyUnpriced = String(search.sf_unpriced ?? "") === "1"
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

    const order = useMemo(
        () =>
            new Map(
                [...(data?.viloyats ?? []), ...(data?.cities ?? [])].map((v, idx) => [v.id, idx]),
            ),
        [data],
    )
    // shahar → uning viloyati (viloyat filtri shaharlarni ham ko'rsatsin)
    const cityParent = useMemo(
        () => new Map((data?.cities ?? []).map((c) => [c.id, c.viloyat])),
        [data],
    )
    const unpricedTotal = useMemo(
        () => (data?.results ?? []).filter((r) => (r.unpriced_count ?? 0) > 0).length,
        [data],
    )
    const rows = useMemo<ViloyatTariffRow[]>(
        () =>
            (data?.results ?? [])
                .flatMap((r) =>
                    r.from_region === r.to_region
                        ? [{ ...r, id: r.key }]
                        : [
                              { ...r, id: r.key },
                              {
                                  ...r,
                                  id: `${r.key}-r`,
                                  from_region: r.to_region,
                                  from_region_name: r.to_region_name,
                                  to_region: r.from_region,
                                  to_region_name: r.from_region_name,
                              },
                          ],
                )
                .filter((r) => !onlyUnpriced || (r.unpriced_count ?? 0) > 0)
                .filter(
                    (r) =>
                        !viloyat ||
                        String(r.from_region) === viloyat ||
                        String(r.to_region) === viloyat ||
                        String(cityParent.get(r.from_region)) === viloyat ||
                        String(cityParent.get(r.to_region)) === viloyat,
                )
                .filter(
                    (r) =>
                        !query ||
                        routeLabel(r, (name) => name)
                            .toLowerCase()
                            .includes(query),
                )
                .map((r, index) => ({ r, index }))
                .sort(
                    (a, b) =>
                        Number((b.r.unpriced_count ?? 0) > 0) - Number((a.r.unpriced_count ?? 0) > 0) ||
                        Number(a.r.amount == null) - Number(b.r.amount == null) ||
                        (order.get(a.r.from_region) ?? 0) - (order.get(b.r.from_region) ?? 0) ||
                        (order.get(a.r.to_region) ?? 0) - (order.get(b.r.to_region) ?? 0) ||
                        a.index - b.index,
                )
                .map(({ r }) => r),
        [data, viloyat, query, order, onlyUnpriced, cityParent],
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

    const setOnlyUnpriced = (val: boolean) =>
        navigate({
            search: ((prev: Record<string, unknown>) => ({
                ...prev,
                sf_unpriced: val ? "1" : undefined,
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
                                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                    <Switch checked={onlyUnpriced} onCheckedChange={setOnlyUnpriced} />
                                    {t("page.vt_only_unpriced")}
                                    {unpricedTotal > 0 && (
                                        <Badge variant="destructive" className="text-xs">
                                            {unpricedTotal}
                                        </Badge>
                                    )}
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={openCitiesModal}
                                    icon={<MapPin size={16} />}
                                >
                                    {t("page.vt_cities_btn")}
                                    {(data?.cities?.length ?? 0) > 0 && (
                                        <Badge variant="secondary" className="ml-1 text-xs">
                                            {data?.cities?.length}
                                        </Badge>
                                    )}
                                </Button>
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
                title={t("page.vt_cities_title")}
                modalKey="separate-cities"
                size="max-w-lg"
            >
                <CitiesModal canEdit={hasControl} />
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
