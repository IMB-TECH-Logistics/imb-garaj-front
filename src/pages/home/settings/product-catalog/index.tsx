import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { ParamCombobox } from "@/components/as-params/combobox"
import { WAREHOUSE_CATEGORIES, WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import type { WhCategory, WhProduct } from "@/pages/home/ombor/types"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddProductModal from "./add-product"
import { useColumnsCatalogTable } from "./catalog-cols"

const ProductCatalogPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("warehouse_control")
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<WhProduct>>(
        WAREHOUSE_PRODUCTS,
        {
            params: {
                search: search.catalog_search,
                category: search.category,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const { data: categories } = useGet<WhCategory[]>(WAREHOUSE_CATEGORIES)

    const { getData, setData } = useGlobalStore()
    const item = getData<WhProduct>(WAREHOUSE_PRODUCTS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useColumnsCatalogTable()

    const handleDelete = (row: { original: WhProduct }) => {
        setData(WAREHOUSE_PRODUCTS, row.original)
        openDeleteModal()
    }

    const handleEdit = (product: WhProduct) => {
        setData(WAREHOUSE_PRODUCTS, product)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={
                    hasControl ? ({ original }) => handleEdit(original) : undefined
                }
                numeration
                height="h-40"
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName={t("wh.catalog")}
                        url="excel"
                        storeKey={hasControl ? WAREHOUSE_PRODUCTS : undefined}
                        searchKey="catalog_search"
                        pageKey="page"
                        count={data?.count}
                        extraBeforeAdd={
                            <ParamCombobox
                                paramName="category"
                                options={categories ?? []}
                                valueKey="id"
                                labelKey="name"
                                label={t("wh.category")}
                                addButtonProps={{
                                    className:
                                        "!bg-background dark:!bg-secondary",
                                }}
                            />
                        }
                    />
                }
            />

            <DeleteModal
                path={WAREHOUSE_PRODUCTS}
                id={item?.id}
                name={item?.name ? `«${item.name}» ` : ""}
            />

            <Modal
                title={item?.id ? t("wh.product_edit") : t("wh.product_add")}
                modalKey="create"
            >
                <AddProductModal />
            </Modal>
        </>
    )
}

export default ProductCatalogPage
