import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { SquarePen, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { OmborCategory } from "@/store/ombor-store"

export const useOmborCols = (opts: {
    onEdit: (item: OmborCategory) => void
    onDelete: (item: OmborCategory) => void
}) => {
    const { onEdit, onDelete } = opts
    return useMemo<ColumnDef<OmborCategory>[]>(
        () => [
            {
                header: "Nomi",
                accessorKey: "name",
                enableSorting: true,
            },
            {
                header: "Birlik",
                accessorKey: "unit_label",
                enableSorting: true,
            },
            {
                header: "Birlik narxi",
                accessorKey: "unit_price",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{formatMoney(row.original.unit_price)} so'm</span>
                ),
            },
            {
                header: "Miqdori",
                accessorKey: "quantity",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>
                        {formatMoney(row.original.quantity)} {row.original.unit_label}
                    </span>
                ),
            },
            {
                id: "total",
                header: "Jami summa",
                enableSorting: true,
                accessorFn: (row) => row.unit_price * row.quantity,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {formatMoney(row.original.unit_price * row.original.quantity)} so'm
                    </span>
                ),
            },
            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            icon={<SquarePen className="text-primary" size={16} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-3"
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(row.original)
                            }}
                        />
                        <Button
                            icon={<Trash2 className="text-red-500" size={16} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-3"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(row.original)
                            }}
                        />
                    </div>
                ),
            },
        ],
        [onEdit, onDelete],
    )
}
