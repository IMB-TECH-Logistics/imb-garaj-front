import { ColumnDef } from "@tanstack/react-table"
import { ChevronRight } from "lucide-react"
import { useMemo } from "react"
import SortableHeader from "../../../../../sortable-header"

/**
 * `selectedId` is the location whose districts are currently shown. The chevron
 * is the only affordance telling the user the row opens a third level, so it
 * has to be visible before the row is clicked (see S1-12).
 *
 * Saralash server tomonda (B-70, 5-raund). Bu ekranda IKKITA jadval bor
 * (Davlatlar va Joylashuvlar), shuning uchun URL parametri alohida —
 * `region_ordering`: umumiy `ordering` ishlatilsa ikki jadval bir-birining
 * tartibini almashtirib yuborardi.
 */
export const useColumnsRegionsTable = (selectedId?: string | number) => {
    return useMemo<ColumnDef<RegionsType>[]>(
        () => [
            {
                accessorKey: "name",
                header: () => (
                    <SortableHeader
                        field="name"
                        label="Joylashuv nomi"
                        paramName="region_ordering"
                    />
                ),
                cell: ({ row }) => {
                    const isSelected =
                        String(selectedId) === String(row.original.id)
                    return (
                        <div className="flex items-center gap-1.5">
                            <ChevronRight
                                size={16}
                                className={`shrink-0 text-muted-foreground transition-transform ${
                                    isSelected ? "rotate-90 text-foreground" : ""
                                }`}
                            />
                            <span
                                className={isSelected ? "font-medium" : ""}
                                title="Tumanlarni ko'rish uchun bosing"
                            >
                                {row.original.name || "-"}
                            </span>
                        </div>
                    )
                },
            },
        ],
        [selectedId],
    )
}
