import ParamTabs from "@/components/as-params/tabs"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    TECHNICAL_INSPECT,
    TECHNICAL_INSPECT_INSTALLED,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import ItemDetailSheet from "../ombor/items/detail-sheet"
import { fmtDate, toNumber } from "../ombor/utils"
import AddExpenseModal from "./add-expense"
import { lifespanHint, type VehicleExpenseRow } from "./cols"
import ExpenseDetailSheet from "./detail-sheet"

type ItemStatus = "expired" | "soon" | "ok" | null

type InstalledItem = {
    withdrawal: number
    lot: number
    inspection_id: number | null
    product: number
    product_name: string
    unit_name: string
    factory_number: string | null
    quantity: string
    installed_at: string
    expires_at: string | null
    status: ItemStatus
    days_left: number | null
}

type VehicleRow = {
    id: number
    truck_number: string
    driver_name: string | null
    expired: number
    expiring: number
    items: InstalledItem[]
}

const STATUS_CLASS: Record<string, string> = {
    expired: "bg-red-600/15 text-red-600",
    soon: "bg-amber-500/15 text-amber-600",
    ok: "bg-emerald-600/15 text-emerald-600",
}

const StatusBadge = ({ item }: { item: InstalledItem }) => {
    const { t } = useTranslation()
    if (!item.status || !item.expires_at) {
        return <span className="text-muted-foreground">—</span>
    }
    return (
        <span
            className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                STATUS_CLASS[item.status],
            )}
        >
            {item.status === "ok" ?
                t("texnik.vehicles.ok")
            :   lifespanHint(item.days_left)}
        </span>
    )
}

const VehicleExpenses = ({
    vehicleId,
    onOpen,
}: {
    vehicleId: number
    onOpen: (row: VehicleExpenseRow) => void
}) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, unknown>
    const { data, isLoading } = useGet<ListResponse<VehicleExpenseRow>>(TECHNICAL_INSPECT, {
        params: {
            vehicle: vehicleId,
            from_date: search.from_date || undefined,
            to_date: search.to_date || undefined,
            page_size: 500,
        },
    })
    const rows = data?.results ?? []

    if (isLoading) {
        return <p className="py-6 text-center text-sm text-muted-foreground">…</p>
    }
    if (rows.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                {t("texnik.vehicles.no_expenses")}
            </p>
        )
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("form.date")}</TableHead>
                    <TableHead>{t("form.expense_type")}</TableHead>
                    <TableHead className="text-right">{t("form.amount")}</TableHead>
                    <TableHead>{t("form.lifespan")}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r)}>
                        <TableCell className="whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                        <TableCell>{r.category_name || "—"}</TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium text-red-600">
                            {formatMoney(Number(r.amount ?? r.warehouse_total ?? 0) || 0)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                            {r.lifespan ? fmtDate(r.lifespan) : "—"}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const VehicleItemsSheet = ({
    row,
    onClose,
    onOpenItem,
    onOpenExpense,
    onAddExpense,
}: {
    row: VehicleRow | null
    onClose: () => void
    onOpenItem: (lot: number) => void
    onOpenExpense: (row: VehicleExpenseRow) => void
    onAddExpense: (vehicleId: number) => void
}) => {
    const { t } = useTranslation()
    return (
        <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {row?.truck_number}
                        {row?.driver_name && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {row.driver_name}
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{t("texnik.tab_expenses")}</h3>
                    {row && (
                        <Button size="sm" onClick={() => onAddExpense(row.id)}>
                            <Plus size={16} />
                            {t("actions.add")}
                        </Button>
                    )}
                </div>
                {row && <VehicleExpenses vehicleId={row.id} onOpen={onOpenExpense} />}
                <h3 className="mt-6 text-sm font-semibold">{t("texnik.vehicles.installed")}</h3>
                {row && row.items.length === 0 ?
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        {t("texnik.vehicles.empty")}
                    </p>
                :   <Table className="mt-2">
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("wh.product")}</TableHead>
                                <TableHead>{t("form.quantity")}</TableHead>
                                <TableHead>{t("texnik.vehicles.installed_at")}</TableHead>
                                <TableHead>{t("texnik.vehicles.expires_at")}</TableHead>
                                <TableHead>{t("texnik.vehicles.status")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {row?.items.map((item) => (
                                <TableRow
                                    key={item.withdrawal}
                                    className={cn(item.factory_number && "cursor-pointer")}
                                    onClick={() => item.factory_number && onOpenItem(item.lot)}
                                >
                                    <TableCell>
                                        <div className="font-medium">{item.product_name}</div>
                                        {item.factory_number && (
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {item.factory_number}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatMoney(toNumber(item.quantity))} {item.unit_name}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {fmtDate(item.installed_at)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {item.expires_at ? fmtDate(item.expires_at) : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge item={item} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                }
            </SheetContent>
        </Sheet>
    )
}

const VehiclesTab = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as Record<string, unknown>
    const status = search.ti_status === "expired" || search.ti_status === "soon" ? search.ti_status : undefined
    const [openId, setOpenId] = useState<number | null>(null)
    const [expense, setExpense] = useState<VehicleExpenseRow | null>(null)
    const [addVehicle, setAddVehicle] = useState<number | undefined>(undefined)
    const { setData, getData, clearKey } = useGlobalStore()
    const { openModal } = useModal("add-expense")
    const currentExpense = getData<VehicleExpenseRow>(TECHNICAL_INSPECT)

    const addExpense = (vehicleId?: number) => {
        clearKey(TECHNICAL_INSPECT)
        setAddVehicle(vehicleId)
        openModal()
    }

    const editExpense = (row: VehicleExpenseRow) => {
        setExpense(null)
        setData(TECHNICAL_INSPECT, row)
        setAddVehicle(undefined)
        openModal()
    }
    const itemId = typeof search.item === "number" ? search.item : search.item ? Number(search.item) : undefined

    const { data, isLoading } = useGet<VehicleRow[]>(TECHNICAL_INSPECT_INSTALLED, {
        params: {
            vehicle_search: search.vehicle_search || undefined,
            status,
        },
    })

    const columns = useMemo<ColumnDef<VehicleRow>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: t("wh.plate"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">{row.original.truck_number}</span>
                ),
            },
            {
                accessorKey: "driver_name",
                header: t("texnik.vehicles.driver"),
                cell: ({ row }) => row.original.driver_name || "—",
            },
            {
                id: "items",
                header: t("texnik.vehicles.installed"),
                cell: ({ row }) => row.original.items.length || "—",
            },
            {
                id: "alerts",
                header: t("texnik.vehicles.status"),
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1.5">
                        {row.original.expired > 0 && (
                            <Badge className="bg-red-600/15 text-red-600 hover:bg-red-600/15">
                                {t("texnik.vehicles.expired_count", { count: row.original.expired })}
                            </Badge>
                        )}
                        {row.original.expiring > 0 && (
                            <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                                {t("texnik.vehicles.soon_count", { count: row.original.expiring })}
                            </Badge>
                        )}
                        {!row.original.expired && !row.original.expiring && (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </div>
                ),
            },
        ],
        [t],
    )

    const openRow = data?.find((r) => r.id === openId) ?? null

    const setItem = (lot?: number) =>
        navigate({
            search: (prev: Record<string, unknown>) => ({ ...prev, item: lot }),
        } as never)

    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data ?? []}
                onRowClick={(row) => setOpenId(row.id)}
                head={
                    <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                        <ParamTabs
                            paramName="ti_status"
                            options={[
                                { value: "all", label: t("texnik.vehicles.all") },
                                { value: "expired", label: t("texnik.vehicles.expired") },
                                { value: "soon", label: t("texnik.vehicles.soon") },
                            ]}
                        />
                        <Button onClick={() => addExpense()}>
                            <Plus size={16} />
                            {t("actions.add")}
                        </Button>
                    </div>
                }
            />
            <VehicleItemsSheet
                row={itemId || expense ? null : openRow}
                onClose={() => setOpenId(null)}
                onOpenItem={(lot) => setItem(lot)}
                onOpenExpense={setExpense}
                onAddExpense={addExpense}
            />
            <ExpenseDetailSheet
                row={expense}
                onClose={() => setExpense(null)}
                onEdit={editExpense}
            />
            <Modal
                modalKey="add-expense"
                title={currentExpense?.id ? "Xarajatni tahrirlash" : "Xarajat qo'shish"}
                size="max-w-2xl"
            >
                <AddExpenseModal vehicleId={addVehicle} />
            </Modal>
            <DeleteModal path={TECHNICAL_INSPECT} id={currentExpense?.id} />
            <ItemDetailSheet itemId={itemId} onClose={() => setItem(undefined)} />
        </>
    )
}

export default VehiclesTab
