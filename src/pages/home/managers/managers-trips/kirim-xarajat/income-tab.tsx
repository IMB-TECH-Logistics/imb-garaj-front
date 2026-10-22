import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useModal } from "@/hooks/useModal"
import { useGet } from "@/hooks/useGet"
import { useGlobalStore } from "@/store/global-store"
import { MANAGERS_CASHFLOW, MANAGERS_EXPENSE_CATEGORIES, MANAGERS_EXPENSES, MANAGERS_INCOMES } from "@/constants/api-endpoints"
import { useTranslation } from "react-i18next"
import { useTripCashClosed } from "../use-trip-cash-closed"
import { FinanceRow, Category } from "./types"
import { CategoryTabs } from "./category-tabs"
import { AddCategoryForm } from "./add-category-form"
import { useIncomeCols } from "./columns"

// ──── Tab content components ────

export function IncomeTab({ tripId, onCategoryChange, onCategoryIdChange, onCategoryCodeChange }: { tripId?: number; onCategoryChange: (name: string | null) => void; onCategoryIdChange: (id: number | null) => void; onCategoryCodeChange: (code: string | null) => void }) {
    const { t } = useTranslation()
    const locked = useTripCashClosed(tripId)
    const lockedTitle = locked ? t("trips.reys_cols.trip_locked") : undefined
    const { setData, clearKey } = useGlobalStore()
    const { openModal } = useModal("kirim-xarajat-add")
    const { openModal: openDeleteModal } = useModal(`${MANAGERS_EXPENSES}-delete`)
    const { openModal: openAddCategory } = useModal("add-category")

    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        { params: { page_size: 100000, action: 1, trip_id: tripId }, enabled: !!tripId },
    )
    const categories = categoriesData?.results ?? []
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null)

    useEffect(() => {
        if (categories.length > 0 && !categories.some((c) => c.id === selectedCatId)) {
            const first = categories[0]
            setSelectedCatId(first.id ?? null)
            onCategoryChange(first.name)
            onCategoryIdChange(first.id ?? null)
            onCategoryCodeChange(first.code ?? null)
        }
    }, [categoriesData])

    const { data: expensesData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, category: selectedCatId, action: 1, page_size: 100 },
            enabled: selectedCatId != null,
            options: { queryKey: [MANAGERS_CASHFLOW, "income", tripId, selectedCatId] },
        },
    )
    const rows = expensesData?.results ?? []

    const handleDelete = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openDeleteModal()
    }

    const columns = useIncomeCols()

    const handleSelect = (cat: Category) => {
        setSelectedCatId(cat.id ?? null)
        onCategoryChange(cat.name)
        onCategoryIdChange(cat.id ?? null)
        onCategoryCodeChange(cat.code ?? null)
    }

    const handleAdd = () => {
        clearKey(MANAGERS_EXPENSES)
        openModal()
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0">
                <CategoryTabs
                    prefix="income"
                    categories={categories}
                    selectedId={selectedCatId}
                    onSelect={handleSelect}
                    onAdd={openAddCategory}
                />
            </div>
            <div className="mt-4 flex-1 overflow-y-auto min-h-0">
                <DataTable
                    columns={columns}
                    data={rows}
                    numeration
                    viewAll
                    onDelete={({ original }) => handleDelete(original)}
                    actionsDisabled={locked}
                    actionsDisabledTitle={lockedTitle}
                    onEdit={({ original }) => { setData(MANAGERS_EXPENSES, original); openModal() }}
                    head={
                        <div className="flex mb-3 justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl">{t("page.income_history")}</h1>
                                <Badge className="text-sm">{rows.length}</Badge>
                            </div>
                            <Button disabled={locked} title={lockedTitle} onClick={handleAdd}>
                                <Plus size={18} />
                                {t("page.add_income")}
                            </Button>
                        </div>
                    }
                />
            </div>
            <DeleteModal
                path={MANAGERS_INCOMES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-delete`}
                refetchKeys={[MANAGERS_CASHFLOW, MANAGERS_EXPENSE_CATEGORIES]}
            />
            <Modal modalKey="add-category" title={`${t("actions.add")} ${t("table.category")}`} size="max-w-sm">
                <AddCategoryForm flowType={1} />
            </Modal>
        </div>
    )
}
