import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useTenantColumns } from "@/components/custom/tenant-column"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import {
    ColumnDef,
    ColumnFiltersState,
    ExpandedState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import * as React from "react"
import CursorPagination from "../as-params/cursor-pagination"
import ParamPagination from "../as-params/pagination"
import EmptyBox from "../custom/empty-box"
import Spinner from "./spinner"

interface DataTableProps<TData> {
    data: TData[] | undefined
    columns: ColumnDef<TData>[]
    loading?: boolean
    className?: string
    deleteSelecteds?: (val: number[]) => void
    rowSelection?: any
    setRowSelection?: (val: any) => void
    onRightClick?: (val: TData) => void
    selecteds_count?: boolean
    onRowClick?: (data: TData) => void
    disabled?: boolean
    rowColor?: (data: TData) => string
    paginationProps?: PaginationProps
    cursorPagination?: {
        next: string | null | undefined
        previous: string | null | undefined
        disabled?: boolean
        changePageSize?: boolean
        pageSizeParamName?: string
        paramName?: string
    }
    viewAll?: boolean
    head?: React.ReactNode
    onCollapse?: (data: TData) => void
    wrapperClassName?: string
    tableWrapperClassName?: string
}

export function CollapsibleDataTable<TData>({
    data,
    columns,
    loading,
    className,
    deleteSelecteds,
    rowSelection,
    setRowSelection,
    onRightClick,
    selecteds_count,
    onRowClick,
    disabled,
    rowColor,
    paginationProps,
    cursorPagination,
    viewAll,
    head,
    onCollapse,
    wrapperClassName,
    tableWrapperClassName,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [expanded, setExpanded] = React.useState<ExpandedState>({})
    const [selecteds, setSelecteds] = React.useState<any>([])
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const search: any = useSearch({ from: "__root__" })
    const tableColumns = useTenantColumns(columns, data)

    const table = useReactTable({
        data: data || [],
        columns: tableColumns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection: rowSelection ?? selecteds,
            pagination: {
                pageIndex:
                    search[paginationProps?.paramName || "page"] ?
                        +search[paginationProps?.paramName || "page"] - 1
                    :   0,
                pageSize:
                    search[paginationProps?.pageSizeParamName || "page_size"] ?
                        +search[
                            paginationProps?.pageSizeParamName || "page_size"
                        ]
                    :   25,
            },
            expanded,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection ?? setSelecteds,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel({ initialSync: true }),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        manualPagination:
            !!paginationProps?.totalPages || !!cursorPagination || viewAll,
        getSubRows: (row: any) => row.subRows,
    })

    function toggle(row: Row<TData>) {
        return () => {
            if (row.getCanExpand()) {
                onCollapse?.(row.original)
                row.getToggleExpandedHandler()()
            }
        }
    }
    return (
        <main
            className={cn(
                "w-full bg-card border rounded-md pb-4",
                wrapperClassName,
            )}
        >
            {!!head && <div className="px-4 py-4">{head}</div>}
            {selecteds_count && (
                <div className="flex flex-col gap-2 sm:flex-row items-end sm:items-center sm:justify-between pb-2">
                    <div
                        className={cn(
                            "flex-1 text-sm text-muted-foreground",
                            !deleteSelecteds && "text-end",
                        )}
                    >
                        {table.getFilteredRowModel().rows.length} dan{" "}
                        {table.getFilteredSelectedRowModel().rows.length} ta
                        qator tanlandi.
                    </div>
                    <div></div>
                </div>
            )}
            <div
                className={cn(
                    "relative overflow-x-auto",
                    tableWrapperClassName,
                )}
            >
                {loading && (
                    <div className="absolute top-0 w-full h-full grid place-items-center bg-black/80 z-20">
                        <Spinner color="secondary" />
                    </div>
                )}
                <Table className={`${className} select-text bg-card`}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header, i) => (
                                    <TableHead
                                        key={i}
                                        className={cn(
                                            rowSelection &&
                                                header.index === 0 &&
                                                "w-8",
                                            "px-2 border",
                                        )}
                                    >
                                        {header.isPlaceholder ? null : (
                                            flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ?
                            table.getRowModel().rows.map((row, i) => (
                                <TableRow
                                    key={i}
                                    data-tenant={(row.original as any)?.tenant_schema}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        onRightClick?.(row.original)
                                    }}
                                    className={cn(
                                        `hover:bg-border/50 border-none border`,
                                        (
                                            !row.original?.id ||
                                                row.getCanExpand()
                                        ) ?
                                            "bg-border/40"
                                        :   "",
                                        row.original.is_parent &&
                                            "bg-background",
                                        // row.getIsExpanded() && "bg-destructive",
                                        "h-full",
                                        rowColor?.(row.original),
                                    )}
                                    onClick={
                                        row.getCanExpand() ?
                                            toggle(row)
                                        :   undefined
                                    }
                                >
                                    {row.getVisibleCells().map((cell, i) => (
                                        <TableCell
                                            key={i}
                                            onClick={() => {
                                                onRowClick?.(cell.row.original)
                                                notCollapse?.includes(
                                                    cell.column.id,
                                                ) &&
                                                    row.getToggleExpandedHandler()()
                                            }}
                                            className={`cursor-pointer border px-2 !h-10 !text-sm ${cell.column.id === "non-clickable" && "cursor-default"}`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                    {/* <TableCell>
                                        {row.original.is_parent &&
                                            (row.getIsExpanded() ?
                                                <ChevronDown size={16} />
                                            :   <ChevronRight size={16} />)}
                                    </TableCell> */}
                                </TableRow>
                            ))
                        :   <TableRow>
                                <TableCell colSpan={columns.length}>
                                    <EmptyBox />
                                </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                    <TableFooter />
                </Table>
            </div>
            {!viewAll && (
                <div className="pt-4 mx-auto w-max">
                    {paginationProps?.totalPages ?
                        <ParamPagination
                            disabled={disabled || loading}
                            {...paginationProps}
                        />
                    : cursorPagination ?
                        <CursorPagination
                            {...cursorPagination}
                            disabled={disabled || loading}
                        />
                    :   <ParamPagination
                            disabled={disabled || loading}
                            {...paginationProps}
                            totalPages={table.getPageCount() || 1}
                            PageSize={table.getState().pagination.pageSize}
                        />
                    }
                </div>
            )}
        </main>
    )
}

const notCollapse = ["non-collapsible"]
