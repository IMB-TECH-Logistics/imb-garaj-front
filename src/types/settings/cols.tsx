import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Laptop, Smartphone, Tablet } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "orange"

const ACTION_MAP: Record<number, { labelKey: string; variant: BadgeVariant }> = {
    1: { labelKey: "log.created", variant: "default" },
    2: { labelKey: "log.updated", variant: "secondary" },
    3: { labelKey: "log.deleted", variant: "destructive" },
    4: { labelKey: "log.login", variant: "outline" },
    5: { labelKey: "log.logout", variant: "orange" },
    6: { labelKey: "log.exported", variant: "outline" },
    7: { labelKey: "log.imported", variant: "outline" },
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
    const { t } = useTranslation()
    return useMemo<ColumnDef<LogItem>[]>(
        () => [
            {
                header: t("page.section"),
                accessorKey: "section",
                size: 120,
                enableSorting: true,
            },
            {
                header: t("table.model"),
                accessorKey: "model",
                size: 120,
            },
            {
                header: t("table.object_id"),
                accessorKey: "obj_id",
                size: 80,
            },
            {
                header: t("table.description_col"),
                accessorKey: "comment",
                size: 260,
            },
            {
                header: t("table.action_log"),
                accessorKey: "action",
                size: 130,
                enableSorting: true,
                cell: ({ row }) => {
                    const action = row.original.action
                    const config = ACTION_MAP[action]
                    return (
                        <Badge variant={config?.variant ?? "default"}>
                            {config ? t(config.labelKey) : t("log.unknown")}
                        </Badge>
                    )
                },
            },
            {
                header: t("table.user_col"),
                accessorKey: "full_name",
                size: 150,
                cell: ({ row }) => {
                    const fn = row.original.full_name?.trim()
                    return fn || row.original.username || "—"
                },
            },
            {
                header: t("table.position"),
                accessorKey: "role_name",
                size: 120,
                cell: ({ row }) => row.original.role_name || "—",
            },
            {
                header: t("form.device"),
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
                header: t("table.ip_address"),
                accessorKey: "ip_address",
                size: 130,
                cell: ({ row }) => row.original.ip_address || "—",
            },
            {
                header: t("form.date"),
                accessorKey: "created",
                size: 150,
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.created
                        ? format(new Date(row.original.created), "dd/MM/yyyy HH:mm")
                        : "—",
            },
            {
                header: t("page.details"),
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
        [onView, t],
    )
}
