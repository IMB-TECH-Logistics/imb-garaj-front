import { handleFormError } from "@/lib/show-form-errors"
import { useDelete } from "@/hooks/useDelete"
import { useModal } from "@/hooks/useModal"
import { useQueryClient } from "@tanstack/react-query"
import { ReactNode, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { DialogDescription, DialogFooter, DialogHeader } from "../ui/dialog"
import Modal from "./modal"

interface IProps {
    path: string
    id: string | number | undefined
    url?: string
    name?: ReactNode
    onSuccessAction?: () => void
    modalKey?: string
    disableRefetch?: boolean
    refetchKey?: string
    refetchKeys?: unknown[]
}

export default function DeleteModal({
    path,
    id,
    url,
    name = "",
    onSuccessAction,
    modalKey = "delete",
    disableRefetch = false,
    refetchKeys,
    refetchKey,
}: IProps) {
    const { closeModal } = useModal(modalKey)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { mutate, isPending } = useDelete({
        onSuccess: () => {
            toast.success("Muvaffaqiyatli o'chirildi", { icon: "✅" })
            if (onSuccessAction) {
                onSuccessAction()
            }
            if (!disableRefetch) {
                queryClient.refetchQueries({
                    queryKey: [path],
                })
            }
            if (refetchKeys) {
                queryClient.refetchQueries({
                    predicate: (q) => {
                        return refetchKeys?.includes(q.queryKey[0])
                    },
                })
            } else if (refetchKey) {
                queryClient.removeQueries({ queryKey: [refetchKey] })
            }
            closeModal()
            if (url) {
                navigate({ to: url })
            }
        },
        /**
         * S3-40: muvaffaqiyatsizlikdan keyin ham oyna YOPILADI.
         *
         * Ilgari o'chirish rad etilganda (masalan yuk turi ishlatilayotgani
         * uchun) tasdiq oynasi ochiqligicha qolardi va sababni tushuntirgan
         * toastni to'sib turardi — foydalanuvchi esa xuddi shu tugmani
         * qayta-qayta bosardi, natija esa har safar bir xil bo'lardi.
         * Sabab toastda aytilgan, shuning uchun oyna joyni bo'shatadi.
         */
        onError: (error) => {
            handleFormError(error)
            closeModal()
        },
    })

    const handleDelete = () => {
        mutate(path + `/${id}`)
    }

    /**
     * B-85: o'chirish oynasi Ombor sahifasidagi tasdiq oynasi bilan
     * bir xil ko'rinishga keltirildi.
     *
     * Ilgari bu oyna sarlavhasiz edi va bekor qilishning yagona yo'li
     * burchakdagi X belgisi bo'lgan — foydalanuvchi bir joyda "Bekor qilish"
     * tugmasini, boshqa joyda faqat X ni ko'rardi. Endi ko'rinadigan
     * sarlavha `Modal` ning `title` propi orqali beriladi (shu sababli bu
     * yerda DialogTitle chizilmaydi — aks holda bitta oynada ikkita
     * sarlavha paydo bo'lardi) va "O'chirish" dan chapda `outline`
     * "Bekor qilish" tugmasi turadi.
     */
    return (
        <Modal
            title={"O'chirishni tasdiqlang"}
            size="max-w-md"
            modalKey={modalKey}
        >
            <DialogHeader>
                <div className="max-w-sm text-sm">
                    {name}
                    {"Siz haqiqatdan ham o'chirishni xohlaysizmi?"}
                </div>
                <DialogDescription>
                    {"Bu qaytarib bo'lmas jarayon!"}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant={"outline"} onClick={closeModal}>
                    {"Bekor qilish"}
                </Button>
                <Button
                    variant={"destructive"}
                    onClick={handleDelete}
                    loading={isPending}
                >
                    {"O'chirish"}
                </Button>
            </DialogFooter>
        </Modal>
    )
}
