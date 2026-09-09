import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Laptop, Smartphone, Tablet } from "lucide-react"
import { useMemo } from "react"
import SortableHeader from "../../sortable-header"
import { getSectionLabel } from "./sections"

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

/**
 * SARALASH — SERVER TOMONDA (B-70, 5-raund).
 *
 * Jurnalda ~4 900 yozuv, ya'ni ~198 sahifa. Mijoz tomondagi saralash aynan
 * shu yerda eng zararli edi: jurnal "oxirgi o'zgarishni kim qildi" degan
 * savolga javob berish uchun ochiladi, tanstack esa faqat ekrandagi 25
 * qatorni tartiblab, o'sha 25 tasining eng yangisini butun jurnalning eng
 * yangisi qilib ko'rsatardi.
 *
 * "Tavsif" (`comment`) ustuni backend `ordering_fields` ida YO'Q, shuning
 * uchun unga ataylab ko'rsatkich qo'yilmagan — bosiladigandek ko'rinib hech
 * nima qilmaydigan sarlavha qolmasligi kerak.
 */
export const useLogsCols = (onView: (log: LogItem) => void) => {
    return useMemo<ColumnDef<LogItem>[]>(
        () => [
            {
                header: () => (
                    <SortableHeader field="section" label="Bo'lim" />
                ),
                accessorKey: "section",
                size: 140,
                cell: ({ row }) => getSectionLabel(row.original.section),
            },
            {
                header: () => (
                    <SortableHeader field="model" label="Model" />
                ),
                accessorKey: "model",
                size: 120,
            },
            {
                header: () => (
                    <SortableHeader field="obj_id" label="Obyekt ID" />
                ),
                accessorKey: "obj_id",
                size: 80,
            },
            {
                header: "Tavsif",
                accessorKey: "comment",
                size: 260,
            },
            {
                header: () => (
                    <SortableHeader field="action" label="Harakat" />
                ),
                accessorKey: "action",
                size: 130,
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
                header: () => (
                    <SortableHeader field="full_name" label="Foydalanuvchi" />
                ),
                accessorKey: "full_name",
                size: 150,
                cell: ({ row }) => {
                    const fn = row.original.full_name?.trim()
                    return fn || row.original.username || "—"
                },
            },
            {
                header: () => (
                    <SortableHeader field="role_name" label="Lavozim" />
                ),
                accessorKey: "role_name",
                size: 120,
                cell: ({ row }) => row.original.role_name || "—",
            },
            {
                header: () => (
                    <SortableHeader field="device" label="Qurilma" />
                ),
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
                header: () => (
                    <SortableHeader field="ip_address" label="IP manzil" />
                ),
                accessorKey: "ip_address",
                size: 130,
                cell: ({ row }) => row.original.ip_address || "—",
            },
            {
                header: () => (
                    <SortableHeader field="created" label="Sana" />
                ),
                accessorKey: "created",
                size: 150,
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
