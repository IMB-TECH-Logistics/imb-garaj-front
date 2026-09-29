import { formatDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
    DOC_TYPE_OPTIONS,
    DocType,
    DocumentCell,
    VehicleDocumentsRow,
} from "./types"

const STATUS_CLASSES: Record<string, string> = {
    expired:
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800 font-semibold",
    expiring:
        "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 font-semibold",
    ok: "border-transparent",
}

const statusHint = (doc: DocumentCell) => {
    if (doc.days_left === null) return ""
    if (doc.days_left < 0) return `Muddati ${-doc.days_left} kun oldin tugagan`
    if (doc.days_left === 0) return "Muddati bugun tugaydi"
    return `${doc.days_left} kun qoldi`
}

type CellProps = {
    doc: DocumentCell | null
    canEdit: boolean
    onClick: () => void
}

const DocCell = ({ doc, canEdit, onClick }: CellProps) => {
    if (!doc) {
        return canEdit ?
                <button
                    type="button"
                    onClick={onClick}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                    <Plus size={14} /> Qo'shish
                </button>
            :   <span className="text-muted-foreground">-</span>
    }
    return (
        <button
            type="button"
            disabled={!canEdit}
            onClick={onClick}
            title={[doc.number, statusHint(doc)].filter(Boolean).join(" · ")}
            className={cn(
                "rounded-md border px-2 py-0.5 text-sm tabular-nums disabled:cursor-default",
                canEdit && "hover:ring-1 hover:ring-primary/40",
                STATUS_CLASSES[doc.status ?? "ok"],
            )}
        >
            {doc.expires_date ? formatDate(doc.expires_date) : "Muddati yo'q"}
        </button>
    )
}

export const useColumnsDocumentsTable = (
    canEdit: boolean,
    onCellClick: (row: VehicleDocumentsRow, docType: DocType) => void,
) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleDocumentsRow>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: t("form.vehicle_number"),
                enableSorting: true,
            },
            {
                accessorKey: "driver_name",
                header: t("form.driver"),
                enableSorting: true,
                cell: ({ row }) => row.original.driver_name || "-",
            },
            ...DOC_TYPE_OPTIONS.map(
                ({ value, label }): ColumnDef<VehicleDocumentsRow> => ({
                    id: value,
                    header: label,
                    enableSorting: false,
                    cell: ({ row }) => (
                        <DocCell
                            doc={row.original.documents[value]}
                            canEdit={canEdit}
                            onClick={() => onCellClick(row.original, value)}
                        />
                    ),
                }),
            ),
        ],
        [t, canEdit, onCellClick],
    )
}
