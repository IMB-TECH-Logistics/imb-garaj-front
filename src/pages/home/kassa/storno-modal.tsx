import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CHECKOUT_MAIN, TRANSACTIONS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import type { Transaction } from "./transaction-cols"

export const STORNO_MODAL_KEY = "kassa-storno"

/**
 * Kassa yozuvini SO'NDIRISH (storno) — KT-24.
 *
 * Backend `reversal_of` maydonini va `POST transaction/<id>/reverse/`
 * endpointini oldi, lekin UI'da undan foydalanadigan hech narsa yo'q edi:
 * jadvalda birorta amal tugmasi bo'lmagani uchun xato yozuvni tuzatishning
 * iloji yo'q edi (sinov yozuvlarini ham qo'lda teskari yozuv qo'shib
 * "o'chirishga" to'g'ri kelgan).
 *
 * O'chirish emas, aynan storno: asl yozuv joyida qoladi va "bekor qilingan"
 * deb belgilanadi, ustiga teskari belgili yangi yozuv qo'shiladi. Shunda
 * pul reyestrining audit izi buzilmaydi.
 */
const StornoModal = ({ row }: { row: Transaction | null }) => {
    const [reason, setReason] = useState("")
    const queryClient = useQueryClient()
    const { closeModal } = useModal(STORNO_MODAL_KEY)

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(
                "Yozuv so'ndirildi — teskari yozuv qo'shildi va balans to'g'rilandi",
            )
            setReason("")
            closeModal()
            queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] })
            queryClient.invalidateQueries({ queryKey: [CHECKOUT_MAIN] })
        },
    })

    const handleConfirm = () => {
        if (!row?.id) return
        mutate(`${TRANSACTIONS}/${row.id}/reverse`, {
            comment: reason.trim() || undefined,
        })
    }

    return (
        <Modal
            modalKey={STORNO_MODAL_KEY}
            title="Yozuvni so'ndirish (storno)"
            size="max-w-md"
        >
            {row ? (
                <div className="space-y-4">
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Yozuv</span>
                            <span className="font-medium">#{row.id}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Summa</span>
                            <span className="font-medium">
                                {formatMoney(Number(row.amount))}
                                {row.currency === 2 ? " USD" : " so'm"}
                            </span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Turi</span>
                            <span className="font-medium">
                                {row.type === -1 ? "Chiqim" : "Tushum"}
                            </span>
                        </div>
                        {row.comment && (
                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">
                                    Izoh
                                </span>
                                <span className="font-medium text-right">
                                    {row.comment}
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Yozuv o'chirilmaydi: u "bekor qilingan" deb belgilanadi
                        va ustiga teskari yozuv qo'shiladi. Kassa balansi shunga
                        mos to'g'rilanadi.
                    </p>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="storno-reason"
                            className="text-sm font-medium"
                        >
                            Sabab (ixtiyoriy)
                        </label>
                        <Textarea
                            id="storno-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            placeholder="Masalan: summa xato kiritilgan"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeModal}
                            disabled={isPending}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirm}
                            loading={isPending}
                            disabled={isPending}
                        >
                            So'ndirish
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    )
}

export default StornoModal
