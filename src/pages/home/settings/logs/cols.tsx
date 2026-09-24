import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Laptop, Smartphone, Tablet } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { getSectionLabel } from "./sections"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "orange"

const ACTION_VARIANTS: Record<number, BadgeVariant> = {
    1: "default",
    2: "secondary",
    3: "destructive",
    4: "outline",
    5: "orange",
    6: "outline",
    7: "outline",
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
                size: 140,
                enableSorting: true,
                cell: ({ row }) => getSectionLabel(row.original.section),
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
                header: t("form.description"),
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
                    const ACTION_LABEL_MAP: Record<number, string> = {
                        1: t("log.created"),
                        2: t("log.updated"),
                        3: t("log.deleted"),
                        4: t("log.login"),
                        5: t("log.logout"),
                        6: t("log.exported"),
                        7: t("log.imported"),
                    }
                    return (
                        <Badge variant={ACTION_VARIANTS[action] ?? "default"}>
                            {ACTION_LABEL_MAP[action] ?? t("log.unknown")}
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
                        ? format(new Date(row.original.created), "yyyy-MM-dd  HH:mm")
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
