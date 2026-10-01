import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_UNITS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import type { WhUnit } from "@/pages/home/ombor/types"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddUnitModal from "./add-unit"
import { useColumnsUnitTable } from "./unit-cols"

const UnitsPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("warehouse_control")
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<WhUnit[]>(WAREHOUSE_UNITS)

    const { getData, setData } = useGlobalStore()
    const item = getData<WhUnit>(WAREHOUSE_UNITS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useColumnsUnitTable()

    const rows = useMemo(() => {
        const query = String(search.unit_search ?? "")
            .trim()
            .toLowerCase()
        if (!query) return data
        return data?.filter((unit) => unit.name.toLowerCase().includes(query))
    }, [data, search.unit_search])

    const handleDelete = (row: { original: WhUnit }) => {
        setData(WAREHOUSE_UNITS, row.original)
        openDeleteModal()
    }

    const handleEdit = (unit: WhUnit) => {
        setData(WAREHOUSE_UNITS, unit)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={rows}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={
                    hasControl ? ({ original }) => handleEdit(original) : undefined
                }
                numeration
                viewAll
                height="h-40"
                head={
                    <TableHeader
                        fileName={t("wh.units")}
                        url="excel"
                        storeKey={hasControl ? WAREHOUSE_UNITS : undefined}
                        searchKey="unit_search"
                        pageKey="page"
                        count={data?.length}
                    />
                }
            />

            <DeleteModal
                path={WAREHOUSE_UNITS}
                id={item?.id}
                name={item?.name ? `«${item.name}» ` : ""}
                refetchKeys={["warehouse/products"]}
            />

            <Modal
                title={item?.id ? t("wh.unit_edit") : t("wh.unit_add")}
                modalKey="create"
            >
                <AddUnitModal />
            </Modal>
        </>
    )
}

export default UnitsPage
