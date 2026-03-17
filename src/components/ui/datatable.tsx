import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable,
    VisibilityState,
    type Row,
} from "@tanstack/react-table"
import * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DEFAULT_PAGE_SIZE, PAGE_KEY, PAGE_SIZE_KEY } from "@/constants/default"
import { useHasAction } from "@/constants/useUser"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"
import CursorPagination from "../as-params/cursor-pagination"
import LimitOffsetPagination from "../as-params/limit-offset-pagination"
import ParamPagination from "../as-params/pagination"
import EmptyBox from "../custom/empty-box"
import TableActions from "../custom/table-actions"
import { Checkbox } from "./checkbox"

interface DataTableProps<TData> {
    data: TData[] | undefined
    columns: ColumnDef<TData>[]
    loading?: boolean
    className?: string
    deleteSelecteds?: (val: number[]) => void
    onRightClick?: (val: TData) => void
    selecteds_count?: boolean
    selecteds_row?: boolean
    onRowClick?: (data: TData) => void
    disabled?: boolean
    rowColor?: (data: TData) => string
    paginationProps?: PaginationProps
    cursorPagination?: {
        next: string | null | undefined
        previous: string | null | undefined
        disabed?: boolean
        changePageSize?: boolean
        pageSizeParamName?: string
        paramName?: string
    }
    limitOffsetPagination?: {
        next: string | null | undefined
        previous: string | null | undefined
        disabed?: boolean
        changePageSize?: boolean
        pageSizeParamName?: string
        paramName?: string
    }
    viewAll?: boolean
    head?: React.ReactNode
    viewCount?: number | boolean | undefined
    sortable?: boolean
    numeration?: boolean
    wrapperClassName?: string
    actionMenuMode?: boolean
    onEdit?: (data: Row<TData>) => void
    onDelete?: (data: Row<TData>) => void
    onUndo?: (data: Row<TData>) => void
    onView?: (data: Row<TData>) => void
    onRedo?: (data: Row<TData>) => void
    onFinished?: (data: Row<TData>) => void
    tableWrapperClassName?: string
    skeletonRowCount?: number
    onSelectedRowsChange?: (rows: TData[]) => void
    actionPermissions?: string[]
    height?: string
    clearSelectionTrigger?: any
    controlledRowSelection?: RowSelectionState
    onAllSelectedChange?: (allSelected: boolean) => void
}

export function DataTable<TData>({
    data,
    columns,
    loading,
    className = "min-w-[1100px]",
    deleteSelecteds,
    onRightClick,
    selecteds_count,
    selecteds_row,
    onRowClick,
    disabled,
    rowColor,
    paginationProps,
    cursorPagination,
    limitOffsetPagination,
    viewAll,
    head,
    numeration = false,
    wrapperClassName,
    actionMenuMode,
    onEdit,
    onDelete,
    onUndo,
    onView,
    onFinished,
    onRedo,
    tableWrapperClassName,
    onSelectedRowsChange,
    skeletonRowCount = 15,
    height,
    actionPermissions,
    clearSelectionTrigger,
    controlledRowSelection,
    onAllSelectedChange,
}: DataTableProps<TData>) {
    const {
        paramName = PAGE_KEY,
        pageSizeParamName = PAGE_SIZE_KEY,
        totalPages,
    } = paginationProps || {}
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        controlledRowSelection ?? {},
    )

    const hasActions = actionPermissions && useHasAction(actionPermissions)

    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const search: any = useSearch({ from: "/_main" })

    const orderedColumns = React.useMemo(() => {
        if (hasActions) return columns

        if (onDelete || onEdit || onUndo || onView || onRedo) {
            return [
                ...columns,
                {
                    header: " ",
                    accessorKey: "action",
                    enableSorting: false,
                    cell: ({ row }) => (
                        <TableActions
                            menuMode={actionMenuMode}
                            onDelete={
                                onDelete ? () => onDelete?.(row) : undefined
                            }
                            onEdit={onEdit ? () => onEdit?.(row) : undefined}
                            onUndo={onUndo ? () => onUndo?.(row) : undefined}
                            onView={onView ? () => onView?.(row) : undefined}
                            onRedo={onRedo ? () => onRedo?.(row) : undefined}
                            onFinished={
                                onFinished ? () => onFinished?.(row) : undefined
                            }
                        />
                    ),
                },
            ]
        } else return columns
    }, [actionMenuMode, columns, onDelete, onEdit, onUndo, onView,onFinished, hasActions])

    React.useEffect(() => {
        if (
            controlledRowSelection &&
            !isRowSelectionEqual(rowSelection, controlledRowSelection)
        ) {
            setRowSelection(controlledRowSelection)
        }
    }, [controlledRowSelection])

    const table = useReactTable({
        data: data || [],
        columns: orderedColumns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel({
            initialSync: true,
        }),
        getRowId: (row: any) => String(row.id),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: search[paramName] ? +search[paramName] - 1 : 0,
                pageSize:
                    search[pageSizeParamName] ? +search[pageSizeParamName] : 10,
            },
        },
        manualPagination:
            !!totalPages ||
            !!cursorPagination ||
            viewAll ||
            !!limitOffsetPagination,
    })

    React.useEffect(() => {
        if (!onSelectedRowsChange) return
        const rows = table.getSelectedRowModel().rows.map((r) => r.original)
        onSelectedRowsChange(rows)
    }, [rowSelection])

    React.useEffect(() => {
        table.resetRowSelection()
    }, [clearSelectionTrigger])

    React.useEffect(() => {
        if (onAllSelectedChange) {
            onAllSelectedChange(table.getIsAllRowsSelected())
        }
    }, [rowSelection])

    return (
        <main
            className={cn("w-full   p-4 bg-card rounded-md ", wrapperClassName)}
        >
            {!!head && <div>{head}</div>}
            {selecteds_count && (
                <div className="flex flex-col gap-2 sm:flex-row items-end sm:items-center sm:justify-between pb-2">
                    <p
                        className={cn(
                            "flex-1 text-sm text-muted-foreground",
                            !deleteSelecteds && "text-end",
                        )}
                    >
                        {table.getFilteredRowModel().rows?.length} {"dan"}{" "}
                        {table.getFilteredSelectedRowModel().rows?.length}{" "}
                        {"ta"}
                        {"qator tanlandi"}.
                    </p>
                    <div></div>
                </div>
            )}

            <div
                className={cn(
                    "relative overflow-x-auto overflow-y-hidden no-scollbar-x   rounded-md ",
                    tableWrapperClassName,
                )}
            >
                {loading && (
                    <Table className="flex flex-col gap-1">
                        {Array.from({ length: skeletonRowCount })?.map(
                            (_, index) => (
                                <TableBody key={index}>
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup, index) => (
                                            <TableRow
                                                key={index}
                                                className={`grid gap-1 `}
                                                style={{
                                                    gridTemplateColumns: `repeat(${
                                                        headerGroup?.headers
                                                            ?.length || 0
                                                    }, minmax(0, 1fr))`,
                                                }}
                                            >
                                                {headerGroup.headers.map(
                                                    (_, index) => {
                                                        return (
                                                            <TableCell
                                                                key={index}
                                                                className="px-0 py-0"
                                                            >
                                                                <Skeleton
                                                                    className={
                                                                        "h-full"
                                                                    }
                                                                />
                                                            </TableCell>
                                                        )
                                                    },
                                                )}
                                            </TableRow>
                                        ))}
                                </TableBody>
                            ),
                        )}
                    </Table>
                )}

                {data?.length ?
                    <Table
                        className={`${className} select-text  bg-card rounded-md`}
                    >
                        <TableHeader>
                            {table
                                .getHeaderGroups()
                                .map((headerGroup, index) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none "
                                    >
                                        {selecteds_row && (
                                            <TableHead>
                                                <Checkbox
                                                    checked={
                                                        table.getIsAllPageRowsSelected() ||
                                                        (table.getIsSomePageRowsSelected() &&
                                                            "indeterminate")
                                                    }
                                                    onCheckedChange={(value) =>
                                                        table.toggleAllPageRowsSelected(
                                                            !!value,
                                                        )
                                                    }
                                                    aria-label="Select all"
                                                />
                                            </TableHead>
                                        )}
                                        {numeration && (
                                            <TableHead
                                                className={cn(
                                                    " px-2  cursor-pointer",
                                                    index === 0 && "w-8",
                                                )}
                                            >
                                                №
                                            </TableHead>
                                        )}

                                        {headerGroup.headers.map(
                                            (header, index) => {
                                                return (
                                                    <TableHead
                                                        key={header.id}
                                                        className={cn(
                                                            " px-2 cursor-pointer",
                                                        )}
                                                        onClick={
                                                            (
                                                                header.column
                                                                    .columnDef
                                                                    .enableSorting
                                                            ) ?
                                                                header.column.getToggleSortingHandler()
                                                            :   undefined
                                                        }
                                                    >
                                                        <div className="cursor-pointer flex items-center gap-1 select-none w-max">
                                                            {flexRender(
                                                                header.column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext(),
                                                            )}

                                                            {(
                                                                header.column
                                                                    .columnDef
                                                                    .enableSorting
                                                            ) ?
                                                                ({
                                                                    asc: (
                                                                        <ChevronUp
                                                                            className="text-muted-foreground"
                                                                            width={
                                                                                16
                                                                            }
                                                                        />
                                                                    ),
                                                                    desc: (
                                                                        <ChevronDown
                                                                            className="text-muted-foreground"
                                                                            width={
                                                                                16
                                                                            }
                                                                        />
                                                                    ),
                                                                }[
                                                                    header.column.getIsSorted() as string
                                                                ] ?? (
                                                                    <ChevronsUpDown
                                                                        className="text-muted-foreground"
                                                                        width={
                                                                            16
                                                                        }
                                                                    />
                                                                ))
                                                            :   null}
                                                        </div>
                                                    </TableHead>
                                                )
                                            },
                                        )}
                                    </TableRow>
                                ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows?.length > 0 ?
                                table.getRowModel().rows?.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && "selected"
                                        }
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            onRightClick?.(row.original)
                                        }}
                                        className={cn(
                                            "hover:bg-zinc-200/90 dark:hover:bg-secondary border border-transparent ",
                                            rowColor?.(row.original),
                                            index % 2 !== 0 &&
                                                "dark:bg-secondary/70 bg-zinc-200/70 rounded-xl ",
                                        )}
                                    >
                                        {selecteds_row && (
                                            <TableCell className="w-8 ">
                                                <Checkbox
                                                    checked={row.getIsSelected()}
                                                    onCheckedChange={(value) =>
                                                        row.toggleSelected(
                                                            !!value,
                                                        )
                                                    }
                                                    aria-label="Select row"
                                                />
                                            </TableCell>
                                        )}
                                        {numeration && (
                                            <TableCell className="w-8 ">
                                                {((search[paramName] || 1) -
                                                    1) *
                                                    (search[
                                                        pageSizeParamName
                                                    ] || DEFAULT_PAGE_SIZE) +
                                                    index +
                                                    1}
                                            </TableCell>
                                        )}

                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                onClick={() => {
                                                    onRowClick?.(
                                                        cell.row.original,
                                                    )
                                                }}
                                                className={cn(
                                                    `cursor-pointer border-r   dark:border-secondary/50 border-secondary last:border-none 
                                                         `,
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            :   <TableRow>
                                    <TableCell
                                        colSpan={columns?.length}
                                        className="h-24 text-center"
                                    >
                                        {"Mavjud emas"}
                                    </TableCell>
                                </TableRow>
                            }
                        </TableBody>
                        <TableFooter></TableFooter>
                    </Table>
                :   null}
                {data?.length === 0 && !loading ?
                    <EmptyBox height={height} />
                :   null}
            </div>
            {!viewAll && data?.length ?
                <div className="pt-4 mx-auto w-full relative flex justify-center">
                    {totalPages ?
                        <ParamPagination
                            disabled={disabled || loading}
                            {...paginationProps}
                        />
                    : cursorPagination ?
                        <CursorPagination
                            {...cursorPagination}
                            disabled={disabled || loading}
                        />
                    : limitOffsetPagination ?
                        <LimitOffsetPagination
                            {...limitOffsetPagination}
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
            :   ""}
        </main>
    )
}

function isRowSelectionEqual(
    a: RowSelectionState = {},
    b: RowSelectionState = {},
) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((k) => a[k] === b[k])
}
