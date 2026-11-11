import Modal from "@/components/custom/modal"
import { NoteButton } from "@/components/custom/note-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_LIST, SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { getRequest, useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import AddDriverModal from "@/pages/home/settings/driver/add-driver"
import DismissDriverModal, { DISMISS_MODAL } from "@/pages/home/settings/driver/dismiss-modal"
import { useGlobalStore } from "@/store/global-store"
import { PlusCircle, UserMinus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { formatExperience } from "@/lib/format-experience"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type DriverRow = {
    id: number
    first_name: string
    last_name: string
    full_name: string
    username: string
    phone: string | null
    experience: number
    hired_at: string | null
    experience_months: number | null
    completed_trips: number
    total_trips: number
    ongoing_trips: number
    completed_orders: number
    total_orders: number
    revenue_uzs: string | number
    salary_due_uzs: string | number
    salary_paid_uzs: string | number
    total_distance_km: string | number
    total_fuel_liters: string | number
    fuel_per_100km: string | number
    total_fuel_gas: string | number
    fuel_gas_per_100km: string | number
    coverage: number
    balance_uzs: string | number
    salary_balance_uzs?: string | number
    latest_trip_id: number | null
    latest_trip_end: string | null
    score: string | number
    tier: "A" | "B" | "C" | "D"
    can_go_abroad?: boolean
    note?: string
}

const num = (v: unknown) => Number(v ?? 0) || 0


const useCols = () => {
    const { t } = useTranslation()
    const canEdit = useHasAction("hr_drivers_control")
    return useMemo<ColumnDef<DriverRow>[]>(
        () => [
            {
                id: "note",
                header: t("note.column"),
                enableSorting: false,
                cell: ({ row }) => (
                    <NoteButton
                        value={row.original.note}
                        url={`${SETTINGS_DRIVERS}/${row.original.id}`}
                        payload={(note) => ({ driver: { note } })}
                        refetchPrefix="users/drivers"
                        canEdit={canEdit}
                        title={row.original.full_name}
                    />
                ),
            },
            {
                header: t("form.first_name"),
                accessorKey: "first_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                ),
            },
            {
                header: t("form.phone"),
                accessorKey: "phone",
                cell: ({ row }) =>
                    formatPhoneNumber(row.original.phone || "—"),
            },
            {
                header: t("table.experience"),
                id: "experience",
                accessorFn: (row) =>
                    row.experience_months ?? Number(row.experience || 0) * 12,
                enableSorting: true,
                cell: ({ row }) =>
                    formatExperience(
                        t,
                        row.original.experience_months,
                        row.original.experience,
                    ),
            },
            {
                header: t("form.can_go_abroad"),
                id: "can_go_abroad",
                accessorFn: (row) => (row.can_go_abroad ? 1 : 0),
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.can_go_abroad ?
                        <span className="font-medium text-emerald-600">{t("actions.yes")}</span>
                    :   <span className="text-muted-foreground">{t("actions.no")}</span>,
            },
            {
                header: t("page.trips"),
                accessorKey: "completed_orders",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.completed_orders} /{" "}
                        {row.original.total_orders}
                    </span>
                ),
            },
            {
                header: t("fleet.drivers.fuel_l_100km"),
                accessorKey: "fuel_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.fuel_per_100km)
                    if (v <= 0)
                        return (
                            <span className="text-muted-foreground">—</span>
                        )
                    const cls =
                        v <= 26
                            ? "text-emerald-500"
                            : v <= 32
                              ? "text-amber-500"
                              : "text-rose-500"
                    return (
                        <span
                            className={`tabular-nums font-medium ${cls}`}
                        >
                            {v.toFixed(1)}
                        </span>
                    )
                },
            },
            {
                header: t("fleet.drivers.fuel_gas_100km"),
                accessorKey: "fuel_gas_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.fuel_gas_per_100km)
                    if (v <= 0)
                        return (
                            <span className="text-muted-foreground">—</span>
                        )
                    return (
                        <span className="tabular-nums font-medium text-sky-500">
                            {v.toFixed(1)}
                        </span>
                    )
                },
            },
            {
                header: t("fleet.drivers.revenue_cash"),
                accessorKey: "revenue_uzs",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(num(row.original.revenue_uzs))}
                    </span>
                ),
            },
            {
                header: t("fleet.drivers.salary_due"),
                accessorKey: "salary_due_uzs",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.salary_due_uzs)
                    return (
                        <span className={v > 0 ? "font-medium text-amber-600" : v < 0 ? "font-medium text-red-500" : "text-muted-foreground"}>
                            {formatMoney(v)}
                        </span>
                    )
                },
            },
        ],
        [t, canEdit],
    )
}


export default function HaydovchilarList() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false })
    const cols = useCols()

    const { data, isLoading } = useGet<DriverRow[]>(DRIVERS_LIST, {
        params: { search: search.driver_search },
    })

    const rows = data ?? []

    const hasControl = useHasAction("hr_drivers_control")
    const { getData, setData, clearKey } = useGlobalStore()
    const editing = getData<DriversType>(SETTINGS_DRIVERS)
    const { openModal: openCreateModal } = useModal("create")
    const { openModal: openDismiss } = useModal(DISMISS_MODAL)
    const [dismissing, setDismissing] = useState<DriversType | null>(null)
    const [loadingEdit, setLoadingEdit] = useState(false)

    const handleAdd = () => {
        clearKey(SETTINGS_DRIVERS)
        openCreateModal()
    }

    const handleEdit = async (row: DriverRow) => {
        if (loadingEdit) return
        setLoadingEdit(true)
        try {
            const full = await getRequest(`${SETTINGS_DRIVERS}/${row.id}`)
            setData(SETTINGS_DRIVERS, full)
            openCreateModal()
        } catch {
            toast.error(t("trips.row.error"))
        } finally {
            setLoadingEdit(false)
        }
    }

    const handleRowClick = (row: DriverRow) => {
        navigate({
            to: "/haydovchilar/$id",
            params: { id: row.id.toString() },
            search: { name: row.full_name } as any,
        })
    }

    return (
        <>
        <DataTable
            loading={isLoading}
            columns={cols}
            data={rows}
            onEdit={hasControl ? ({ original }) => handleEdit(original) : undefined}
            rowAction={
                hasControl ?
                    (d: DriverRow) => (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-red-600"
                            onClick={(e) => {
                                e.stopPropagation()
                                setDismissing(d as unknown as DriversType)
                                openDismiss()
                            }}
                        >
                            <UserMinus size={14} />
                            {t("dismiss.action")}
                        </Button>
                    )
                :   undefined
            }
            paginationProps={{
                page_sizes: [25, 50, 100, 250, 500],
                PageSize: 50,
            }}
            numeration
            onRowClick={handleRowClick}
            head={
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">{t("nav.drivers")}</h1>
                        <Badge className="text-sm">
                            {formatMoney(rows.length)}
                        </Badge>
                    </div>
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
            }
        />

        <Modal size="max-w-md" title={t("dismiss.title")} modalKey={DISMISS_MODAL}>
            <DismissDriverModal driver={dismissing} />
        </Modal>

        <Modal
            size="max-w-2xl"
            title={editing?.id ? t("form.edit_driver") : t("form.add_driver")}
            modalKey="create"
        >
            <AddDriverModal />
        </Modal>
        </>
    )
}
