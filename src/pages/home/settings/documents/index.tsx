import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import {
    VEHICLE_DOCUMENT_ALERTS,
    VEHICLE_DOCUMENTS,
    VEHICLE_DOCUMENTS_TRUCKS,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useDocumentAlerts } from "@/hooks/use-document-alerts"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { TriangleAlert } from "lucide-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddDocumentModal from "./add-document"
import { useColumnsDocumentsTable } from "./documents-cols"
import {
    DOC_TYPE_LABELS,
    DocType,
    VehicleDocumentsRow,
    VehicleDocumentType,
} from "./types"

const DocumentsPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_vehicles_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()
    const onlyAlerts = search.doc_alert === "1" || search.doc_alert === 1
    const { count: alertCount } = useDocumentAlerts()

    const { data, isLoading } = useGet<ListResponse<VehicleDocumentsRow>>(
        VEHICLE_DOCUMENTS_TRUCKS,
        {
            params: {
                search: search.documents_search,
                page: search.page,
                page_size: search.page_size,
                ordering: search.ordering,
                alert: onlyAlerts ? 1 : undefined,
            },
        },
    )

    const { getData, setData } = useGlobalStore()
    const item = getData<Partial<VehicleDocumentType>>(VEHICLE_DOCUMENTS)

    const { openModal: openCreateModal } = useModal("create")

    const handleCellClick = useCallback(
        (row: VehicleDocumentsRow, docType: DocType) => {
            const doc = row.documents[docType]
            setData(VEHICLE_DOCUMENTS, {
                ...(doc ?? {}),
                vehicle: row.id,
                truck_number: row.truck_number,
                doc_type: docType,
                doc_type_name: DOC_TYPE_LABELS[docType],
            })
            openCreateModal()
        },
        [setData, openCreateModal],
    )

    const columns = useColumnsDocumentsTable(hasControl, handleCellClick)

    const toggleAlerts = () =>
        navigate({
            search: {
                ...search,
                doc_alert: onlyAlerts ? undefined : "1",
                page: undefined,
            } as any,
        })

    const modalTitle =
        item?.truck_number ?
            `${item.truck_number} — ${item.doc_type_name}`
        :   t("actions.add") + " " + t("nav.documents").toLowerCase()

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                manualSorting
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Hujjatlar"
                        url="excel"
                        storeKey={hasControl ? VEHICLE_DOCUMENTS : undefined}
                        searchKey="documents_search"
                        pageKey="page"
                        count={data?.count}
                        extraRight={
                            <Button
                                variant={onlyAlerts ? "destructive" : "outline"}
                                icon={<TriangleAlert size={18} />}
                                onClick={toggleAlerts}
                            >
                                Muddati tugaganlar
                                {alertCount > 0 && (
                                    <span className="ml-1 rounded-full bg-red-500 text-white text-[11px] font-bold min-w-5 h-5 px-1.5 inline-flex items-center justify-center">
                                        {alertCount}
                                    </span>
                                )}
                            </Button>
                        }
                    />
                }
            />

            <DeleteModal
                path={VEHICLE_DOCUMENTS}
                id={item?.id}
                refetchKeys={[VEHICLE_DOCUMENTS_TRUCKS, VEHICLE_DOCUMENT_ALERTS]}
                name={
                    item?.id ?
                        `«${item.truck_number} — ${item.doc_type_name}» `
                    :   ""
                }
            />

            <Modal title={modalTitle} modalKey="create" size="max-w-2xl">
                <AddDocumentModal />
            </Modal>
        </>
    )
}

export default DocumentsPage
