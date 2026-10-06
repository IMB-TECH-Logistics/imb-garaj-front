import ParamTabs from "@/components/as-params/tabs"
import { Badge } from "@/components/ui/badge"
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
import { TECHNICAL_INSPECT_INSTALLED } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import ItemDetailSheet from "../ombor/items/detail-sheet"
import { fmtDate, toNumber } from "../ombor/utils"
import { lifespanHint } from "./cols"

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

const VehicleItemsSheet = ({
    row,
    onClose,
    onOpenItem,
}: {
    row: VehicleRow | null
    onClose: () => void
    onOpenItem: (lot: number) => void
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
                {row && row.items.length === 0 ?
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        {t("texnik.vehicles.empty")}
                    </p>
                :   <Table className="mt-4">
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
                    <div className="mb-3">
                        <ParamTabs
                            paramName="ti_status"
                            options={[
                                { value: "all", label: t("texnik.vehicles.all") },
                                { value: "expired", label: t("texnik.vehicles.expired") },
                                { value: "soon", label: t("texnik.vehicles.soon") },
                            ]}
                        />
                    </div>
                }
            />
            <VehicleItemsSheet
                row={itemId ? null : openRow}
                onClose={() => setOpenId(null)}
                onOpenItem={(lot) => setItem(lot)}
            />
            <ItemDetailSheet itemId={itemId} onClose={() => setItem(undefined)} />
        </>
    )
}

export default VehiclesTab
