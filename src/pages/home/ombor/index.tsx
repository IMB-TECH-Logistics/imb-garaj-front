import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { OmborCategory, useOmborStore } from "@/store/ombor-store"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import OmborAddEdit from "./add-edit"
import { useOmborCols } from "./cols"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const Ombor = () => {
    const { categories, removeCategory } = useOmborStore()
    const { openModal: openCreate } = useModal("ombor-create")

    const [editing, setEditing] = useState<OmborCategory | null>(null)
    const [toDelete, setToDelete] = useState<OmborCategory | null>(null)

    const total = useMemo(
        () =>
            categories.reduce(
                (sum, c) => sum + c.unit_price * c.quantity,
                0,
            ),
        [categories],
    )

    const handleAdd = () => {
        setEditing(null)
        openCreate()
    }

    const handleEdit = (item: OmborCategory) => {
        setEditing(item)
        openCreate()
    }

    const cols = useOmborCols({
        onEdit: handleEdit,
        onDelete: (item) => setToDelete(item),
    })

    return (
        <div className="flex md:flex-row flex-col w-full gap-3 md:items-start">
            {/* Left sidebar */}
            <div className="md:max-w-sm md:min-w-sm w-full md:sticky md:top-0 shrink-0">
                <Card className="bg-muted/60">
                    <CardHeader className="space-y-0">
                        <CardTitle className="font-medium text-lg">
                            Ombor balansi
                        </CardTitle>
                        <span>
                            <span className="text-xl font-semibold">
                                {formatMoney(total)}
                            </span>{" "}
                            <span className="text-base">so'm</span>
                        </span>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        <div className="border-t pt-3">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                Batafsil
                            </p>
                            <div className="space-y-1">
                                {categories.map((cat, i) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-md"
                                    >
                                        <span className="text-sm flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground w-4 text-right">
                                                {i + 1}
                                            </span>
                                            {cat.name}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {formatMoney(cat.unit_price * cat.quantity)} so'm
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right table */}
            <div className="w-full min-w-0 overflow-x-auto">
                <DataTable
                    numeration
                    columns={cols}
                    data={categories}
                    head={
                        <div className="flex justify-between items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg">Ombor mahsulotlari</h1>
                                <Badge>{categories.length}</Badge>
                            </div>
                            <Button onClick={handleAdd} icon={<Plus size={18} />}>
                                Qo'shish
                            </Button>
                        </div>
                    }
                />
            </div>

            <Modal
                modalKey="ombor-create"
                title={editing ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish"}
                size="max-w-md"
            >
                <OmborAddEdit current={editing} />
            </Modal>

            <AlertDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>O'chirishni tasdiqlang</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{toDelete?.name}" mahsulotini o'chirmoqchimisiz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (toDelete) removeCategory(toDelete.id)
                                setToDelete(null)
                            }}
                        >
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default Ombor
