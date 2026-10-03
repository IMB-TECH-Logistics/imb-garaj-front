import ParamTabs from "@/components/as-params/tabs"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/components/ui/datatable"
import {
    VEHICLE_DOCUMENT_ALERTS,
    VEHICLE_DOCUMENTS,
    VEHICLE_DOCUMENTS_DRIVERS,
    VEHICLE_DOCUMENTS_TRUCKS,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useDocumentAlerts } from "@/hooks/use-document-alerts"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ReactNode, useCallback } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddDocumentModal from "./add-document"
import AddVehicleDocumentsModal from "./add-vehicle-documents"
import DeleteVehicleDocumentsModal from "./delete-vehicle-documents"
import {
    useColumnsDriverDocuments,
    useColumnsVehicleDocuments,
} from "./documents-cols"
import {
    DocTab,
    DriverDocumentsRow,
    VehicleDocumentsRow,
    VehicleDocumentType,
} from "./types"

const CountBadge = ({ count }: { count: number }) =>
    count > 0 && (
        <span className="ml-1 rounded-full bg-red-500 text-white text-[11px] font-bold min-w-5 h-5 px-1.5 inline-flex items-center justify-center">
            {count}
        </span>
    )

const DocumentsPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_vehicles_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()
    const tab: DocTab = search.tab === "vehicles" ? "vehicles" : "drivers"
    const onlyAlerts = search.doc_alert === "1" || search.doc_alert === 1
    const { data: alerts } = useDocumentAlerts()

    const params = {
        search: search.documents_search,
        page: search.page,
        page_size: search.page_size,
        alert: onlyAlerts ? 1 : undefined,
        ordering: search.ordering,
    }
    const { data: driversData, isLoading: isLoadingDrivers } = useGet<
        ListResponse<DriverDocumentsRow>
    >(VEHICLE_DOCUMENTS_DRIVERS, { params, enabled: tab === "drivers" })
    const { data: trucksData, isLoading: isLoadingTrucks } = useGet<
        ListResponse<VehicleDocumentsRow>
    >(VEHICLE_DOCUMENTS_TRUCKS, { params, enabled: tab === "vehicles" })
    const data = tab === "drivers" ? driversData : trucksData
    const isLoading = tab === "drivers" ? isLoadingDrivers : isLoadingTrucks

    const { getData, setData, clearKey } = useGlobalStore()
    const item = getData<VehicleDocumentType & { owner_name?: string }>(
        VEHICLE_DOCUMENTS,
    )

    const { openModal: openCreateModal } = useModal("create")
    const { openModal: openDeleteModal } = useModal("delete")

    const openDriverDoc = useCallback(
        (row: DriverDocumentsRow) => {
            setData(VEHICLE_DOCUMENTS, {
                ...(row.documents.driver_license ?? {}),
                driver: row.id,
                owner_name: row.full_name,
                doc_type: "driver_license",
            })
            openCreateModal()
        },
        [setData, openCreateModal],
    )

    const deleteDriverDoc = useCallback(
        (row: DriverDocumentsRow) => {
            setData(VEHICLE_DOCUMENTS, {
                ...(row.documents.driver_license ?? {}),
                driver: row.id,
                owner_name: row.full_name,
                doc_type: "driver_license",
            })
            openDeleteModal()
        },
        [setData, openDeleteModal],
    )

    const { openModal: openVehicleDocsModal } = useModal("vehicle-docs")
    const { openModal: openDeleteVehicleDocsModal } = useModal(
        "delete-vehicle-docs",
    )

    const addVehicleDocs = useCallback(() => {
        clearKey(VEHICLE_DOCUMENTS_TRUCKS)
        openVehicleDocsModal()
    }, [clearKey, openVehicleDocsModal])

    const editVehicleDocs = useCallback(
        (row: VehicleDocumentsRow) => {
            setData(VEHICLE_DOCUMENTS_TRUCKS, row)
            openVehicleDocsModal()
        },
        [setData, openVehicleDocsModal],
    )

    const deleteVehicleDocs = useCallback(
        (row: VehicleDocumentsRow) => {
            setData(VEHICLE_DOCUMENTS_TRUCKS, row)
            openDeleteVehicleDocsModal()
        },
        [setData, openDeleteVehicleDocsModal],
    )

    const driverColumns = useColumnsDriverDocuments(
        hasControl,
        openDriverDoc,
        deleteDriverDoc,
    )
    const vehicleColumns = useColumnsVehicleDocuments(
        hasControl,
        editVehicleDocs,
        deleteVehicleDocs,
    )

    const toggleAlerts = () =>
        navigate({
            search: {
                ...search,
                doc_alert: onlyAlerts ? undefined : "1",
                page: undefined,
            } as any,
        })

    const modalTitle =
        item?.owner_name ?
            `${item.owner_name} — ${t(`documents_page.${item.doc_type}`)}`
        :   t("documents_page.add_title")

    const vehicleRow = getData<VehicleDocumentsRow>(VEHICLE_DOCUMENTS_TRUCKS)
    const vehicleModalTitle =
        vehicleRow?.truck_number ?
            `${vehicleRow.truck_number} — ${t("documents_page.documents_title")}`
        :   t("documents_page.add_title")

    const head: ReactNode = (
        <TableHeader
            fileName={t("nav.documents")}
            url="excel"
            storeKey={hasControl ? VEHICLE_DOCUMENTS : undefined}
            onAdd={
                hasControl && tab === "vehicles" ? addVehicleDocs : undefined
            }
            searchKey="documents_search"
            pageKey="page"
            count={data?.count}
            extraLeft={
                <div className="flex items-center gap-2 shrink-0">
                    <Switch id="doc-alert-switch" checked={onlyAlerts} onCheckedChange={toggleAlerts} />
                    <Label htmlFor="doc-alert-switch" className="cursor-pointer text-sm">
                        {t("documents_page.expired_only")}
                    </Label>
                </div>
            }
        />
    )

    const paginationProps = {
        totalPages: data?.total_pages,
        paramName: "page",
        pageSizeParamName: "page_size",
    }

    return (
        <>
            <ParamTabs
                paramName="tab"
                dontCleanOthers={false}
                className="mb-4"
                options={[
                    {
                        value: "drivers",
                        label: (
                            <>
                                {t("documents_page.tab_drivers")}
                                <CountBadge count={alerts?.drivers ?? 0} />
                            </>
                        ),
                    },
                    {
                        value: "vehicles",
                        label: (
                            <>
                                {t("documents_page.tab_vehicles")}
                                <CountBadge count={alerts?.vehicles ?? 0} />
                            </>
                        ),
                    },
                ]}
            />
            {tab === "drivers" ?
                <DataTable
                    loading={isLoading}
                    columns={driverColumns}
                    data={driversData?.results}
                    manualSorting
                    numeration
                    paginationProps={paginationProps}
                    head={head}
                />
            :   <DataTable
                    loading={isLoading}
                    columns={vehicleColumns}
                    data={trucksData?.results}
                    manualSorting
                    numeration
                    paginationProps={paginationProps}
                    head={head}
                />
            }

            <DeleteModal
                path={VEHICLE_DOCUMENTS}
                id={item?.id}
                refetchKeys={[
                    VEHICLE_DOCUMENTS_DRIVERS,
                    VEHICLE_DOCUMENTS_TRUCKS,
                    VEHICLE_DOCUMENT_ALERTS,
                ]}
                name={
                    item?.id && item.owner_name ?
                        `«${item.owner_name} — ${t(`documents_page.${item.doc_type}`)}» `
                    :   ""
                }
            />

            <Modal
                title={vehicleModalTitle}
                modalKey="vehicle-docs"
                size="max-w-2xl"
            >
                <AddVehicleDocumentsModal />
            </Modal>
            <DeleteVehicleDocumentsModal />

            <Modal title={modalTitle} modalKey="create" size="max-w-2xl">
                <AddDocumentModal />
            </Modal>
        </>
    )
}

export default DocumentsPage
