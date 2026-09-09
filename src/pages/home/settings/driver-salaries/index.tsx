import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import {
    COMMON_DIRECTIONS,
    DRIVER_SALARIES,
    SETTINGS_SELECTABLE_CARGO_TYPE,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Info, Save, Wallet } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import TableHeader from "../table-header"
import {
    type DirectionPrice,
    type DirectionRow,
} from "../route-configs/cols"
import BulkSalaryModal from "./bulk-salary-modal"
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
    cargo_type: number
    cargo_type_name: string
    payment_type: number
    currency: 1 | 2
    current_price: DirectionPrice | null
    prices?: DirectionPrice[]
    driver_salary_amount: string | null
    created?: string
    updated?: string
}

type SelectItem = { id: number | string; name: string }

const todayIso = () => new Date().toISOString().slice(0, 10)

/**
 * Filters live in the URL (`?sf_owner=12,13`) so a filtered view can be shared
 * and survives a page reload — previously they were component state only, which
 * made the URL lie about what the table was showing (UI audit S1-42). The
 * prefix keeps them from colliding with the page/search params.
 */
const FILTER_PARAM_PREFIX = "sf_"

const DriverSalariesPage = () => {
    const hasControl = useHasAction("settings_driver_salaries_control")
    // 2-raund YANGI-03: ilgari sahifa ruxsati YO'Q rolga ham "sahifa faqat ko'rish
    // rejimida" deb yozardi — holbuki GET ham 403 qaytarardi va jadval bo'sh edi.
    // Ko'rish ruxsati bor-yo'qligi endi alohida tekshiriladi.
    const hasView = useHasAction("settings_driver_salaries_view")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const { openModal: openBulkModal } = useModal("bulk-salary")
    const queryClient = useQueryClient()

    const filters = useMemo<Record<string, string[]>>(() => {
        const out: Record<string, string[]> = {}
        for (const col of SALARY_FILTER_COLUMNS) {
            const raw = search[`${FILTER_PARAM_PREFIX}${col.value}`]
            if (typeof raw === "string" && raw.length > 0) {
                out[col.value] = raw.split(",").filter(Boolean)
            }
        }
        return out
    }, [search])

    const setFilter = useCallback(
        (column: string, values: string[]) => {
            navigate({
                search: ((prev: Record<string, unknown>) => ({
                    ...prev,
                    [`${FILTER_PARAM_PREFIX}${column}`]:
                        values?.length ? values.join(",") : undefined,
                    page: undefined,
                })) as any,
            })
        },
        [navigate],
    )

    const clearFilters = useCallback(() => {
        navigate({
            search: ((prev: Record<string, unknown>) => {
                const next: Record<string, unknown> = {
                    ...prev,
                    page: undefined,
                }
                for (const col of SALARY_FILTER_COLUMNS) {
                    delete next[`${FILTER_PARAM_PREFIX}${col.value}`]
                }
                return next
            }) as any,
        })
    }, [navigate])

    const [selectedRows, setSelectedRows] = useState<DirectionRow[]>([])
    const [clearSelectionTick, setClearSelectionTick] = useState(0)
    const [priceEdits, setPriceEdits] = useState<Record<number, string>>({})
    const { mutateAsync: bulkUpdateAsync, isPending: isSaving } = usePatch()

    const serverFilters = useMemo(() => {
        const out: Record<string, string> = {}
        for (const [key, vals] of Object.entries(filters)) {
            if (Array.isArray(vals) && vals.length > 0) {
                out[key] = vals.join(",")
            }
        }
        return out
    }, [filters])

    const { data, isLoading, error } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        {
            params: {
                search: search.salary_search,
                page: search.page,
                page_size: search.page_size,
                /**
                 * Bu sahifa ustunlarni `route-configs/cols.tsx` dan qayta
                 * ishlatadi (`useDirectionColumns`), ya'ni u yerdagi server
                 * tomon saralash sarlavhalari SHU YERGA ham keladi. Endpoint
                 * ham bir xil (`routes/`). Agar `ordering` shu so'rovga
                 * qo'shilmasa, sarlavha bosiladi, URL o'zgaradi, lekin
                 * serverga hech nima yetmaydi — ya'ni "bosiladigandek
                 * ko'rinib hech nima qilmaydigan" ustun paydo bo'lardi.
                 */
                ordering: search.ordering,
                ...serverFilters,
            },
        },
    )

    const { data: paymentTypeData } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_PAYMENT_TYPE,
        { params: { model_name: "payment-type" } },
    )
    const { data: clientData } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_CLIENT,
        { params: { model_name: "client" } },
    )
    const { data: regionData } = useGet<SelectItem[]>("selectable/region", {
        params: { model_name: "region" },
    })
    const { data: cargoTypeData } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_CARGO_TYPE,
        { params: { model_name: "cargo-type" } },
    )

    const paymentMap = useMemo(
        () =>
            Object.fromEntries(
                (paymentTypeData ?? []).map((i) => [Number(i.id), i.name]),
            ),
        [paymentTypeData],
    )

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
                cargo_type: d.cargo_type,
                cargo_type_name: d.cargo_type_name ?? String(d.cargo_type),
                payment_type: d.payment_type,
                payment_type_name:
                    paymentMap[d.payment_type] ?? String(d.payment_type),
                currency: d.currency,
                current_price: d.current_price,
                prices: d.prices,
                driver_salary_amount: d.driver_salary_amount ?? null,
            })),
        [data, paymentMap],
    )

    const filterOptions = useMemo(
        () =>
            buildSalaryFilterOptions(enriched, {
                regions: regionData,
                clients: clientData,
                cargo_types: cargoTypeData,
                payment_types: paymentTypeData,
            }),
        [enriched, regionData, clientData, cargoTypeData, paymentTypeData],
    )

    const activeFilterCount = Object.values(filters).filter(
        (v) => Array.isArray(v) && v.length > 0,
    ).length

    const selectedIds = selectedRows.map((r) => r.id)
    const inlineEditable = hasControl

    const priceEditsRef = useRef(priceEdits)
    priceEditsRef.current = priceEdits

    const getEdit = useCallback((id: number) => priceEditsRef.current[id], [])
    const handlePriceChange = useCallback((id: number, value: string) => {
        setPriceEdits((prev) => ({ ...prev, [id]: value }))
    }, [])

    const editOpts = useMemo(
        () => ({
            editable: inlineEditable,
            disabled: selectedIds.length > 0,
            getEdit,
            onChange: handlePriceChange,
        }),
        [inlineEditable, selectedIds.length, getEdit, handlePriceChange],
    )
    const columns = useSalaryColumns(editOpts)

    const pendingEdits = useMemo(
        () =>
            Object.entries(priceEdits).filter(([id, value]) => {
                const row = enriched.find((r) => r.id === Number(id))
                if (!row) return false
                const raw = String(row.driver_salary_amount ?? "0")
                const original = raw.includes(".")
                    ? raw.replace(/\.?0+$/, "")
                    : raw
                return value !== original && value.trim().length > 0
            }),
        [priceEdits, enriched],
    )

    const handleSaveEdits = async () => {
        if (pendingEdits.length === 0) return

        const negative = pendingEdits.filter(([, amount]) => Number(amount) < 0)
        if (negative.length > 0) {
            toast.error(
                `${negative.length} ta qatorda oylik manfiy — saqlanmadi. Oylik 0 dan kichik bo'lishi mumkin emas.`,
            )
            return
        }

        const valid_from = todayIso()

        const byAmount = pendingEdits.reduce<Record<string, number[]>>(
            (acc, [id, amount]) => {
                (acc[amount] ||= []).push(Number(id))
                return acc
            },
            {},
        )

        const groups = Object.entries(byAmount)
        const results = await Promise.allSettled(
            groups.map(([amount, directions]) =>
                bulkUpdateAsync(`${DRIVER_SALARIES}/bulk-update`, {
                    directions,
                    amount,
                    valid_from,
                }),
            ),
        )

        const okGroups = results.filter((r) => r.status === "fulfilled")
        const failedGroups = results.length - okGroups.length
        const okRows = groups.reduce(
            (sum, [, ids], i) =>
                results[i].status === "fulfilled" ? sum + ids.length : sum,
            0,
        )

        if (okRows > 0) {
            toast.success(`${okRows} ta yo'nalish oyligi yangilandi`)
            await queryClient.invalidateQueries({
                queryKey: [COMMON_DIRECTIONS],
            })
        }
        if (failedGroups > 0)
            toast.error(`${failedGroups} ta guruh yangilanmadi`)
        setPriceEdits({})
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                error={error}
                columns={columns}
                data={enriched}
                selecteds_row={hasControl}
                onSelectedRowsChange={setSelectedRows}
                clearSelectionTrigger={clearSelectionTick}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <div className="flex flex-col gap-3 mb-3">
                        {/*
                          * Without `settings_driver_salaries_control` this page
                          * rendered as a plain table with no checkboxes, no
                          * editable cells and no buttons, and never said why
                          * (UI audit S1-40). Say it out loud instead.
                          */}
                        {!hasControl && hasView && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                                <Info size={16} className="mt-0.5 shrink-0" />
                                <span>
                                    Sizda oylik tariflarini o'zgartirish
                                    huquqi yo'q — sahifa faqat ko'rish
                                    rejimida. Tahrirlash uchun administratordan
                                    "Oylik tariflar — boshqarish" ruxsatini
                                    so'rang.
                                </span>
                            </div>
                        )}
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
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            {SALARY_FILTER_COLUMNS.map((col) => (
                                <div
                                    key={col.value}
                                    className="flex-1 min-w-[160px]"
                                >
                                    <MultiCombobox
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
                            {activeFilterCount > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    Tozalash
                                </Button>
                            )}
                            {hasControl && selectedIds.length > 0 ? (
                                <Button
                                    type="button"
                                    onClick={openBulkModal}
                                    icon={<Wallet size={16} />}
                                >
                                    Beriladigan oylik
                                </Button>
                            ) : pendingEdits.length > 0 ? (
                                <Button
                                    type="button"
                                    onClick={handleSaveEdits}
                                    loading={isSaving}
                                    icon={<Save size={16} />}
                                >
                                    Saqlash ({pendingEdits.length})
                                </Button>
                            ) : null}
                        </div>
                    </div>
                }
            />
            <Modal
                title="Beriladigan oylikni tayinlash"
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
