import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_CATEGORIES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import type { WhCategory } from "@/pages/home/ombor/types"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddCategoryModal from "./add-category"
import { useColumnsCategoryTable } from "./category-cols"

const ProductCategoriesPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("warehouse_control")
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<WhCategory[]>(WAREHOUSE_CATEGORIES)

    const { getData, setData } = useGlobalStore()
    const item = getData<WhCategory>(WAREHOUSE_CATEGORIES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useColumnsCategoryTable()

    const rows = useMemo(() => {
        const query = String(search.category_search ?? "")
            .trim()
            .toLowerCase()
        if (!query) return data
        return data?.filter((row) => row.name.toLowerCase().includes(query))
    }, [data, search.category_search])

    const handleDelete = (row: { original: WhCategory }) => {
        setData(WAREHOUSE_CATEGORIES, row.original)
        openDeleteModal()
    }

    const handleEdit = (category: WhCategory) => {
        setData(WAREHOUSE_CATEGORIES, category)
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
                        fileName={t("wh.categories")}
                        url="excel"
                        storeKey={hasControl ? WAREHOUSE_CATEGORIES : undefined}
                        searchKey="category_search"
                        pageKey="page"
                        count={data?.length}
                    />
                }
            />

            <DeleteModal
                path={WAREHOUSE_CATEGORIES}
                id={item?.id}
                name={item?.name ? `«${item.name}» ` : ""}
                refetchKeys={["warehouse/products"]}
            />

            <Modal
                title={
                    item?.id ? t("wh.category_edit") : t("wh.category_add")
                }
                modalKey="create"
            >
                <AddCategoryModal />
            </Modal>
        </>
    )
}

export default ProductCategoriesPage
