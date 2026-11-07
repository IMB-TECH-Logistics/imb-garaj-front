import ParamInput from "@/components/as-params/input"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { PlusCircle, UserMinus, UserPlus } from "lucide-react"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"
import { format } from "date-fns"
import DismissDriverModal, { DISMISS_MODAL } from "./dismiss-modal"
import { useTranslation } from "react-i18next"
import AddDriverModal from "./add-driver"
import { useColumnsDriverTable } from "./driver-cols"

const Drivers = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_drivers_control")
    const navigate = useNavigate()
    const search = useSearch({ strict: false })
    const dismissedView = (search as any).dstatus === "dismissed"

    const { data, isLoading } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        {
            options: { refetchOnMount: "always" },
            params: {
                status: dismissedView ? "dismissed" : undefined,
                search: search.driver_search,
                page: search.page,
                page_size: search.page_size,
                ordering: (search as any).ordering,
            },
        },
    )

    const { getData, setData, clearKey } = useGlobalStore()
    const item = getData<DriversType>(SETTINGS_DRIVERS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const baseColumns = useColumnsDriverTable()
    const columns = dismissedView
        ? [
              ...baseColumns,
              {
                  id: "dismissed_at",
                  header: t("dismiss.date"),
                  cell: ({ row }: any) => (row.original.dismissed_at ? format(new Date(row.original.dismissed_at), "dd.MM.yyyy") : "—"),
              },
              {
                  id: "dismiss_comment",
                  header: t("dismiss.comment"),
                  cell: ({ row }: any) => row.original.dismiss_comment || <span className="text-muted-foreground">—</span>,
              },
          ]
        : baseColumns
    const { openModal: openDismiss } = useModal(DISMISS_MODAL)
    const [dismissing, setDismissing] = useState<DriversType | null>(null)
    const qc = useQueryClient()
    const { mutate: post, isPending: rehiring } = usePost()
    const rehire = (d: DriversType) =>
        post(`${SETTINGS_DRIVERS}/${d.id}/rehire`, {}, {
            onSuccess: () => {
                toast.success(t("dismiss.rehired"))
                qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("users/drivers") || String(q.queryKey[0]).startsWith("checkout/kassa-v2") })
            },
        })
    const setView = (v: "active" | "dismissed") =>
        navigate({ search: ((prev: any) => ({ ...prev, dstatus: v === "dismissed" ? "dismissed" : undefined, page: undefined })) as any })

    const handleDelete = (row: { original: DriversType }) => {
        setData(SETTINGS_DRIVERS, row.original)
        openDeleteModal()
    }

    const handleEdit = (item: DriversType) => {
        setData(SETTINGS_DRIVERS, item)
        openCreateModal()
    }

    const handleAdd = () => {
        clearKey(SETTINGS_DRIVERS)
        openCreateModal()
    }

    const handleRowClick = (item: DriversType) => {
        navigate({
            to: "/manager-trips/$id",
            params: { id: item.id.toString() },
            search: {
                driver_id: item.id,
                name: `${item.first_name} ${item.last_name}`,
            } as any,
        })
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                manualSorting
                numeration
                columns={columns}
                data={data?.results}
                onEdit={
                    hasControl && !dismissedView ?
                        ({ original }) => handleEdit(original)
                    :   undefined
                }
                rowAction={
                    hasControl ?
                        (d: DriversType) =>
                            dismissedView ? (
                                <Button size="sm" variant="outline" className="h-8 gap-1" disabled={rehiring} onClick={(e) => { e.stopPropagation(); rehire(d) }}>
                                    <UserPlus size={14} />
                                    {t("dismiss.rehire")}
                                </Button>
                            ) : (
                                <Button size="sm" variant="outline" className="h-8 gap-1 text-red-600" onClick={(e) => { e.stopPropagation(); setDismissing(d); openDismiss() }}>
                                    <UserMinus size={14} />
                                    {t("dismiss.action")}
                                </Button>
                            )
                    :   undefined
                }
                onRowClick={handleRowClick}
                head={
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">
                                {t("nav.drivers")}
                            </h1>

                            <Badge className="text-sm">
                                {formatMoney(data?.count ?? 0)}
                            </Badge>
                            <div className="ml-2 inline-flex rounded-md border p-0.5">
                                <Button size="sm" variant={dismissedView ? "ghost" : "default"} className="h-7" onClick={() => setView("active")}>{t("dismiss.tab_active")}</Button>
                                <Button size="sm" variant={dismissedView ? "default" : "ghost"} className="h-7" onClick={() => setView("dismissed")}>{t("dismiss.tab_dismissed")}</Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ParamInput
                                searchKey="driver_search"
                                pageKey="page"
                            />

                            {hasControl && (
                                <Button
                                    className="flex items-center gap-2"
                                    onClick={handleAdd}
                                    icon={<PlusCircle size={18} />}
                                >
                                    {t("actions.add")}
                                </Button>
                            )}
                        </div>
                    </div>
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />

            <DeleteModal
                path={SETTINGS_DRIVERS}
                refetchKeys={[SETTINGS_DRIVERS]}
                id={item?.id}
            />

            <Modal size="max-w-md" title={t("dismiss.title")} modalKey={DISMISS_MODAL}>
                <DismissDriverModal driver={dismissing} />
            </Modal>

            <Modal
                size="max-w-2xl"
                title={
                    item?.id ?
                        t("form.edit_driver")
                    :   t("form.add_driver")
                }
                modalKey="create"
            >
                <AddDriverModal />
            </Modal>
        </>
    )
}

export default Drivers
