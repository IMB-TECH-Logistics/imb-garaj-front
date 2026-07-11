import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { TooltipProvider } from "@/components/ui/tooltip"
import DownloadAsExcel from "@/components/download-as-excel"
import { WAREHOUSE_PRODUCTS, WAREHOUSE_STATS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useDelete } from "@/hooks/useDelete"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import OmborAddEdit from "./add-edit"
import OmborWithdraw from "./withdraw"
import { expiryRowClass, useOmborCols, type OmborProduct } from "./cols"
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

type Stats = { total_balance: string | number; product_count: number }

const Ombor = () => {
    const queryClient = useQueryClient()
    const { openModal: openCreate } = useModal("ombor-create")
    const { openModal: openWithdraw } = useModal("ombor-withdraw")

    const [editing, setEditing] = useState<OmborProduct | null>(null)
    const [withdrawing, setWithdrawing] = useState<OmborProduct | null>(null)
    const [toDelete, setToDelete] = useState<OmborProduct | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const search: any = useSearch({ strict: false })

    const { data: products, isLoading } = useGet<ListResponse<OmborProduct>>(
        WAREHOUSE_PRODUCTS,
        { params: { page_size: 1000, search: search.search } },
    )
    const { data: stats } = useGet<Stats>(WAREHOUSE_STATS)
    const items = products?.results ?? []

    const { mutate: deleteMutate, isPending: deleting } = useDelete({
        onSuccess: () => {
            toast.success("O'chirildi")
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_STATS] })
            setToDelete(null)
        },
    })

    const handleAdd = () => {
        setEditing(null)
        openCreate()
    }

    const handleEdit = (item: OmborProduct) => {
        setEditing(item)
        openCreate()
    }

    const handleWithdraw = (item: OmborProduct) => {
        setWithdrawing(item)
        openWithdraw()
    }

    const cols = useOmborCols({
        onEdit: handleEdit,
        onDelete: (item) => setToDelete(item),
        onWithdraw: handleWithdraw,
    })

    return (
        <TooltipProvider delayDuration={150}>
            <div className="flex md:flex-row flex-col w-full gap-3 md:items-start">
                <div className="md:max-w-sm md:min-w-sm w-full md:sticky md:top-0 shrink-0">
                    <Card className="bg-muted/60">
                        <CardHeader className="space-y-0">
                            <CardTitle className="font-medium text-lg">
                                Ombor balansi
                            </CardTitle>
                            <span>
                                <span className="text-xl font-semibold">
                                    {formatMoney(Number(stats?.total_balance ?? 0))}
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
                                    {items.map((cat, i) => (
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
                                                {formatMoney(
                                                    Number(cat.unit_price) *
                                                        Number(cat.quantity),
                                                )}{" "}
                                                so'm
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <DataTable
                        numeration
                        loading={isLoading}
                        columns={cols}
                        data={items}
                        rowColor={(row: OmborProduct) =>
                            expiryRowClass(row.expiry_status)
                        }
                        head={
                            <div className="flex justify-between items-center gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg">Ombor mahsulotlari</h1>
                                    <Badge>{items.length}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DownloadAsExcel
                                        url={`${WAREHOUSE_PRODUCTS}/excel`}
                                        name="Ombor"
                                    />
                                    <Button onClick={handleAdd} icon={<Plus size={18} />}>
                                        Qo'shish
                                    </Button>
                                </div>
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

                <Modal
                    modalKey="ombor-withdraw"
                    title="Ombordan chiqarish"
                    size="max-w-md"
                >
                    <OmborWithdraw product={withdrawing} />
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
                                disabled={deleting}
                                onClick={() => {
                                    if (toDelete)
                                        deleteMutate(
                                            `${WAREHOUSE_PRODUCTS}/${toDelete.id}`,
                                        )
                                }}
                            >
                                O'chirish
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    )
}

export default Ombor
