import { ParamCombobox } from "@/components/as-params/combobox"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_ITEMS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { OmborSearchParams } from "../types"
import { useItemCols } from "./cols"
import ItemDetailSheet from "./detail-sheet"
import {
    type ItemCondition,
    type ItemState,
    type WhItem,
} from "./types"

const STATES: ItemState[] = ["in_stock", "installed", "repair", "written_off"]
const CONDITIONS: ItemCondition[] = ["new", "used"]

const buttonClass = { className: "!bg-background dark:!bg-secondary" }

const ItemsTab = ({ searchKey = "search" }: { searchKey?: string }) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as OmborSearchParams
    const navigate = useNavigate()

    const query = String((search as Record<string, unknown>)[searchKey] ?? "").trim()

    const { data, isLoading } = useGet<ListResponse<WhItem>>(WAREHOUSE_ITEMS, {
        params: {
            state: search.istate,
            condition: search.icond,
            search: query || undefined,
            page: search.ipage,
            page_size: search.ipage_size,
        },
    })

    const stateOptions = useMemo(
        () =>
            STATES.map((value) => ({
                value,
                label: t(`wh.items.state.${value}`),
            })),
        [t],
    )
    const conditionOptions = useMemo(
        () =>
            CONDITIONS.map((value) => ({
                value,
                label: t(`wh.items.condition.${value}`),
            })),
        [t],
    )

    const filterKey = [search.istate, search.icond, query].join("|")
    const prevFilterKey = useRef(filterKey)
    useEffect(() => {
        if (prevFilterKey.current === filterKey) return
        prevFilterKey.current = filterKey
        if (search.ipage) {
            navigate({
                search: { ...search, ipage: undefined } as never,
                replace: true,
            })
        }
    }, [filterKey])

    const columns = useItemCols()

    const select = (item?: number) =>
        navigate({
            search: (prev: Record<string, unknown>) => ({ ...prev, item }),
        } as never)

    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onRowClick={(row) => select(row.id)}
                rowColor={(row) => (row.id === search.item ? "!bg-primary/10" : "")}
                height="h-40"
                className="min-w-[980px]"
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "ipage",
                    pageSizeParamName: "ipage_size",
                }}
                head={
                    <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg">{t("wh.items.title")}</h1>
                            <Badge>{data?.count ?? 0}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ParamCombobox
                                paramName="istate"
                                options={stateOptions}
                                valueKey="value"
                                labelKey="label"
                                label={t("wh.items.state_label")}
                                isSearch={false}
                                asloClear={["ipage"]}
                                addButtonProps={buttonClass}
                            />
                            <ParamCombobox
                                paramName="icond"
                                options={conditionOptions}
                                valueKey="value"
                                labelKey="label"
                                label={t("wh.items.condition_label")}
                                isSearch={false}
                                asloClear={["ipage"]}
                                addButtonProps={buttonClass}
                            />
                        </div>
                    </div>
                }
            />

            <ItemDetailSheet
                itemId={search.item}
                onClose={() => select(undefined)}
            />
        </>
    )
}

export default ItemsTab
