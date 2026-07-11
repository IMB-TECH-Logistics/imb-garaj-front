import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Laptop, Smartphone, Tablet } from "lucide-react"
import { useMemo } from "react"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "orange"

const ACTION_MAP: Record<number, { label: string; variant: BadgeVariant }> = {
    1: { label: "Yaratildi", variant: "default" },
    2: { label: "Yangilandi", variant: "secondary" },
    3: { label: "O'chirildi", variant: "destructive" },
    4: { label: "Kirish", variant: "outline" },
    5: { label: "Chiqish", variant: "orange" },
    6: { label: "Eksport qilindi", variant: "outline" },
    7: { label: "Import qilindi", variant: "outline" },
}

const DeviceIcon = ({ device }: { device: string | null }) => {
    if (!device) return <span className="text-muted-foreground">—</span>
    const d = device.toLowerCase()
    const className = "h-4 w-4"
    if (d.includes("mobile")) return <Smartphone className={className} />
    if (d.includes("tablet")) return <Tablet className={className} />
    return <Laptop className={className} />
}

export const useLogsCols = (onView: (log: LogItem) => void) => {
    return useMemo<ColumnDef<LogItem>[]>(
        () => [
            {
                header: "Bo'lim",
                accessorKey: "section",
                size: 120,
                enableSorting: true,
            },
            {
                header: "Model",
                accessorKey: "model",
                size: 120,
            },
            {
                header: "Obyekt ID",
                accessorKey: "obj_id",
                size: 80,
            },
            {
                header: "Tavsif",
                accessorKey: "comment",
                size: 260,
            },
            {
                header: "Harakat",
                accessorKey: "action",
                size: 130,
                enableSorting: true,
                cell: ({ row }) => {
                    const action = row.original.action
                    const config = ACTION_MAP[action]
                    return (
                        <Badge variant={config?.variant ?? "default"}>
                            {config?.label ?? "Noma'lum"}
                        </Badge>
                    )
                },
            },
            {
                header: "Foydalanuvchi",
                accessorKey: "full_name",
                size: 150,
                cell: ({ row }) => {
                    const fn = row.original.full_name?.trim()
                    return fn || row.original.username || "—"
                },
            },
            {
                header: "Lavozim",
                accessorKey: "role_name",
                size: 120,
                cell: ({ row }) => row.original.role_name || "—",
            },
            {
                header: "Qurilma",
                accessorKey: "device",
                size: 100,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <DeviceIcon device={row.original.device} />
                        <span>{row.original.device || "—"}</span>
                    </div>
                ),
            },
            {
                header: "IP manzil",
                accessorKey: "ip_address",
                size: 130,
                cell: ({ row }) => row.original.ip_address || "—",
            },
            {
                header: "Sana",
                accessorKey: "created",
                size: 150,
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.created
                        ? format(new Date(row.original.created), "yyyy-MM-dd  HH:mm")
                        : "—",
            },
            {
                header: "Tafsilot",
                id: "actions",
                size: 80,
                cell: ({ row }) => (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onView(row.original)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                ),
            },
        ],
        [onView],
    )
}
