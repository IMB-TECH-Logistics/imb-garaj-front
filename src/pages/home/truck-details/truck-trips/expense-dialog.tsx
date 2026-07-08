import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MANAGERS_CASHFLOW, MANAGERS_EXPENSES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatDateTime } from "@/lib/format-date"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { ColumnDef, Row } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"
import ExpenseEditForm, {
    EXPENSE_EDIT_MODAL_KEY,
    EXPENSE_EDIT_STORE_KEY,
} from "./expense-edit-form"

const PAGE_PARAM = "expense_page"
const PAGE_SIZE_PARAM = "expense_page_size"
const DEFAULT_PAGE_SIZE = 25
const DELETE_MODAL_KEY = "trip-expense-delete"

type ExpenseRow = {
    id: number
    amount: number
    comment: string | null
    category: number
    category_name: string
    payment_type: number | null
    payment_type_name: string
    created: string
    currency: number
    currency_course: string | null
    quantity: string | null
}

function formatAmount(row: ExpenseRow) {
    if (row.currency === 2 && row.currency_course) {
        const usd = Number(row.amount)
        const uzs = usd * Number(row.currency_course)
        return <>{formatMoney(usd)} USD (={formatMoney(uzs)} UZS)</>
    }
    return formatMoney(row.amount)
}

const useExpenseViewCols = () => {
    return useMemo<ColumnDef<ExpenseRow>[]>(
        () => [
            {
                header: "Kategoriya",
                accessorKey: "category_name",
                enableSorting: true,
            },
            {
                header: "Summa",
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-red-500 font-medium whitespace-nowrap">
                        - {formatAmount(row.original)}
                    </span>
                ),
            },
            {
                header: "To'lov turi",
                accessorKey: "payment_type_name",
                enableSorting: true,
            },
            {
                header: "Sana",
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">{formatDateTime(row.original.created)}</span>
                ),
            },
        ],
        [],
    )
}

interface ExpenseDialogProps {
    tripId: number | null
    totalExpense?: number | null
    open: boolean
    onClose: () => void
}

export default function ExpenseDialog({ tripId, totalExpense, open, onClose }: ExpenseDialogProps) {
    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })
    const canControl = useHasAction("manager_cashflow_control")
    const { setData, getData, clearKey } = useGlobalStore()
    const { openModal: openEditModal } = useModal(EXPENSE_EDIT_MODAL_KEY)
    const { openModal: openDeleteModal } = useModal(DELETE_MODAL_KEY)

    const page = Number(search?.[PAGE_PARAM]) || 1
    const pageSize = Number(search?.[PAGE_SIZE_PARAM]) || DEFAULT_PAGE_SIZE

    useEffect(() => {
        if (!open || tripId == null) return
        if (search?.[PAGE_PARAM]) {
            const { [PAGE_PARAM]: _p, ...rest } = search
            navigate({ search: rest, replace: true })
        }
    }, [tripId, open])

    const { data, isLoading } = useGet<ListResponse<ExpenseRow>>(
        MANAGERS_CASHFLOW,
        {
            params: {
                trip: tripId,
                action: -1,
                page,
                page_size: pageSize,
            },
            enabled: !!tripId && open,
        },
    )

    const rows = data?.results ?? []
    const totalCount = data?.count ?? 0
    const columns = useExpenseViewCols()

    const handleEdit = (row: Row<ExpenseRow>) => {
        setData(EXPENSE_EDIT_STORE_KEY, row.original)
        openEditModal()
    }

    const handleDelete = (row: Row<ExpenseRow>) => {
        setData(EXPENSE_EDIT_STORE_KEY, row.original)
        openDeleteModal()
    }

    const handleClose = () => {
        const { [PAGE_PARAM]: _p, [PAGE_SIZE_PARAM]: _s, ...rest } = search ?? {}
        navigate({ search: rest, replace: true })
        clearKey(EXPENSE_EDIT_STORE_KEY)
        onClose()
    }

    const currentRow = getData<ExpenseRow>(EXPENSE_EDIT_STORE_KEY)

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
                <DialogContent
                    className="max-w-6xl w-[95vw] max-h-[85vh] p-0 lg:p-0 gap-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
                >
                    <DialogHeader className="px-6 py-4 border-b bg-muted/40">
                        <DialogTitle className="flex flex-wrap items-center gap-3 pr-10">
                            <span className="text-lg font-semibold">Xarajatlar ro'yxati</span>
                            <Badge variant="secondary" className="text-sm">
                                {totalCount} ta
                            </Badge>
                            {totalExpense != null && (
                                <span className="ml-auto text-sm font-normal text-muted-foreground">
                                    Jami:{" "}
                                    <span className="text-red-500 font-semibold">
                                        - {formatMoney(totalExpense)} UZS
                                    </span>
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 p-4 flex flex-col overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={rows}
                            loading={isLoading}
                            numeration
                            wrapperClassName="p-0 bg-transparent flex-1 min-h-0 flex flex-col"
                            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
                            onEdit={canControl ? handleEdit : undefined}
                            onDelete={canControl ? handleDelete : undefined}
                            paginationProps={{
                                totalPages: data?.total_pages,
                                paramName: PAGE_PARAM,
                                pageSizeParamName: PAGE_SIZE_PARAM,
                                PageSize: pageSize,
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {canControl && (
                <>
                    <Modal
                        modalKey={EXPENSE_EDIT_MODAL_KEY}
                        size="max-w-2xl"
                        classNameTitle="font-medium text-xl"
                        title="Xarajatni tahrirlash"
                    >
                        <div className="max-h-[80vh] overflow-y-auto p-0.5">
                            <ExpenseEditForm />
                        </div>
                    </Modal>

                    <DeleteModal
                        path={MANAGERS_EXPENSES}
                        id={currentRow?.id}
                        modalKey={DELETE_MODAL_KEY}
                        refetchKeys={[MANAGERS_CASHFLOW]}
                    />
                </>
            )}
        </>
    )
}
