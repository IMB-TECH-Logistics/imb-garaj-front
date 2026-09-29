import { Badge } from "@/components/ui/badge"
import { isAllTenantsMode } from "@/lib/tenant-scope"
import type { ColumnDef } from "@tanstack/react-table"
import * as React from "react"

export const useTenantColumns = <TData,>(
    columns: ColumnDef<TData>[],
    data: TData[] | undefined,
) => {
    const hasTenant =
        isAllTenantsMode() &&
        !!data?.some((row) => !!(row as { tenant_schema?: string })?.tenant_schema)

    return React.useMemo(
        () =>
            hasTenant ?
                [
                    {
                        id: "__tenant",
                        header: "Tenant",
                        enableSorting: false,
                        cell: ({ row }) => (
                            <Badge
                                variant="secondary"
                                className="whitespace-nowrap px-2 py-0 font-medium"
                            >
                                {(row.original as { tenant_name?: string })
                                    ?.tenant_name ?? "—"}
                            </Badge>
                        ),
                    } as ColumnDef<TData>,
                    ...columns,
                ]
            :   columns,
        [columns, hasTenant],
    )
}
