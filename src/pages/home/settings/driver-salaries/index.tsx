import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import {
    COMMON_DIRECTIONS,
    SETTINGS_SELECTABLE_CARGO_TYPE,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Wallet } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import {
    type DirectionPrice,
    type DirectionRow,
} from "../route-configs/cols"
import BulkSalaryModal from "./bulk-salary-modal"
import EditSalaryModal from "./edit-salary-modal"
import {
    buildSalaryFilterOptions,
    SALARY_FILTER_COLUMNS,
    useSalaryColumns,
} from "./cols"

type Direction = {
    id: number
    owner: number
    owner_name: string
    owner_code: string
    load: number
    load_name: string
    unload: number
    unload_name: string
    load_city_name?: string | null
    unload_city_name?: string | null
    load_place_display?: string | null
    unload_place_display?: string | null
    cargo_type: number
    cargo_type_name: string
    payment_type: number
    currency: 1 | 2
    current_price: DirectionPrice | null
    prices?: DirectionPrice[]
    driver_salary_amount: string | null
    driver_salary_valid_from?: string | null
    driver_salary_history?: DirectionRow["driver_salary_history"]
    created?: string
    updated?: string
}

type SelectItem = { id: number | string; name: string }

const filterParam = (key: string) => `sf_${key}`

const regionPlace = (
    cityName: string | null | undefined,
    regionName: string | null | undefined,
): string | null =>
    cityName && regionName && cityName !== regionName ? regionName : null

const DriverSalariesPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_driver_salaries_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const { openModal: openBulkModal } = useModal("bulk-salary")
    const { openModal: openEditModal } = useModal("edit-salary")
    const [editingRow, setEditingRow] = useState<DirectionRow | null>(null)

    const [selectedRows, setSelectedRows] = useState<DirectionRow[]>([])
    const [clearSelectionTick, setClearSelectionTick] = useState(0)

    const filters = useMemo(() => {
        const out: Record<string, string[]> = {}
        for (const col of SALARY_FILTER_COLUMNS) {
            const raw = search[filterParam(col.value)]
            if (raw) {
                out[col.value] = String(raw).split(",").filter(Boolean)
            }
        }
        return out
    }, [search])

    const setFilter = useCallback(
        (key: string, vals: string[]) =>
            navigate({
                search: ((prev: Record<string, unknown>) => ({
                    ...prev,
                    [filterParam(key)]: vals.length ? vals.join(",") : undefined,
                    page: undefined,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                })) as any,
            }),
        [navigate],
    )

    const clearFilters = useCallback(
        () =>
            navigate({
                search: ((prev: Record<string, unknown>) => {
                    const next: Record<string, unknown> = {
                        ...prev,
                        page: undefined,
                    }
                    for (const col of SALARY_FILTER_COLUMNS) {
                        next[filterParam(col.value)] = undefined
                    }
                    return next
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }) as any,
            }),
        [navigate],
    )

    const missingOnly = search.sf_missing === "1" || search.sf_missing === 1

    const serverFilters = useMemo(() => {
        const out: Record<string, string> = {}
        for (const [key, vals] of Object.entries(filters)) {
            if (Array.isArray(vals) && vals.length > 0) {
                out[key] = vals.join(",")
            }
        }
        return out
    }, [filters])

    const { data, isLoading } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        {
            params: {
                search: search.salary_search,
                page: search.page,
                page_size: search.page_size,
                ordering: search.ordering,
                unique_route: 1,
                ...serverFilters,
                ...(missingOnly ? { driver_salary_missing: "true" } : {}),
            },
        },
    )

    const { data: regionData } = useGet<SelectItem[]>("selectable/region", {
        params: { model_name: "region" },
    })
    const { data: cargoTypeData } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_CARGO_TYPE,
        { params: { model_name: "cargo-type" } },
    )
    const { data: filterSourceData } = useGet<{
        driver_salary_amount: string[]
    }>(`${COMMON_DIRECTIONS}/filter-options`)

    const enriched: DirectionRow[] = useMemo(
        () =>
            (data?.results ?? []).map((d) => ({
                id: d.id,
                owner: d.owner,
                owner_name: d.owner_name ?? String(d.owner),
                owner_code: d.owner_code ?? "",
                load: d.load,
                load_name: d.load_name ?? String(d.load),
                unload: d.unload,
                unload_name: d.unload_name ?? String(d.unload),
                load_city_name: d.load_city_name,
                unload_city_name: d.unload_city_name,
                load_place_display:
                    d.load_place_display ||
                    regionPlace(d.load_city_name, d.load_name),
                unload_place_display:
                    d.unload_place_display ||
                    regionPlace(d.unload_city_name, d.unload_name),
                cargo_type: d.cargo_type,
                cargo_type_name: d.cargo_type_name ?? String(d.cargo_type),
                payment_type: d.payment_type,
                payment_type_name: "",
                currency: d.currency,
                current_price: d.current_price,
                prices: d.prices,
                driver_salary_amount: d.driver_salary_amount ?? null,
                driver_salary_valid_from: d.driver_salary_valid_from ?? null,
                driver_salary_history: d.driver_salary_history ?? [],
            })),
        [data],
    )

    const filterOptions = useMemo(
        () =>
            buildSalaryFilterOptions(enriched, {
                regions: regionData,
                cargo_types: cargoTypeData,
                salary_amounts: filterSourceData?.driver_salary_amount,
            }),
        [enriched, regionData, cargoTypeData, filterSourceData],
    )

    const activeFilterCount = Object.values(filters).filter(
        (v) => Array.isArray(v) && v.length > 0,
    ).length

    const selectedIds = selectedRows.map((r) => r.id)
    const columns = useSalaryColumns()

    const handleEdit = (row: { original: DirectionRow }) => {
        setEditingRow(row.original)
        openEditModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={enriched}
                selecteds_row={hasControl}
                onEdit={hasControl ? handleEdit : undefined}
                onSelectedRowsChange={setSelectedRows}
                clearSelectionTrigger={clearSelectionTick}
                numeration
                manualSorting
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <TableHeader
                        fileName="Oylik tariflar"
                        url="excel"
                        searchKey="salary_search"
                        pageKey="page"
                        count={data?.count}
                        extraTitle={
                            selectedIds.length > 0 ? (
                                <Badge
                                    variant="secondary"
                                    className="text-sm"
                                >
                                    {selectedIds.length} tanlandi
                                </Badge>
                            ) : null
                        }
                        extraRight={
                            <>
                                {SALARY_FILTER_COLUMNS.map((col) => (
                                    <div key={col.value} className="w-44">
                                        <MultiCombobox
                                            className="h-8 text-sm"
                                            label={col.label}
                                            options={filterOptions[col.value]}
                                            values={filters[col.value] ?? []}
                                            setValues={(vals: string[]) =>
                                                setFilter(col.value, vals ?? [])
                                            }
                                            labelKey="label"
                                            valueKey="value"
                                        />
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={missingOnly ? "destructive" : "outline"}
                                    onClick={() =>
                                        navigate({
                                            search: ((prev: Record<string, unknown>) => ({
                                                ...prev,
                                                sf_missing: missingOnly ? undefined : "1",
                                                page: undefined,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            })) as any,
                                        })
                                    }
                                >
                                    {t("form.tariff_no")}
                                </Button>
                                {activeFilterCount > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        {t("actions.reset")}
                                    </Button>
                                )}
                                {hasControl && selectedIds.length > 0 ? (
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
                title={t("actions.edit")}
                modalKey="edit-salary"
                size="max-w-md"
            >
                {editingRow && <EditSalaryModal row={editingRow} />}
            </Modal>
            <Modal
                title={t("actions.give_salary_btn")}
                modalKey="bulk-salary"
                size="max-w-md"
            >
                <BulkSalaryModal
                    selectedIds={selectedIds}
                    onApplied={() => setClearSelectionTick((t) => t + 1)}
                />
            </Modal>
        </>
    )
}

export default DriverSalariesPage
