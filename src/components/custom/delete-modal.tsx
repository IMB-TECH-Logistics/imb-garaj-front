import { handleFormError } from "@/lib/show-form-errors"
import { useDelete } from "@/hooks/useDelete"
import { useModal } from "@/hooks/useModal"
import { useQueryClient } from "@tanstack/react-query"
import { ReactNode, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "../ui/button"
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
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

    return (
        <Modal size="max-w-md" modalKey={modalKey}>
            <DialogHeader>
                <DialogTitle className="font-normal max-w-sm">
                    {name}
                    {`Siz haqiqatdan ham o'chirishni xohlaysizmi?`}
                </DialogTitle>
                <DialogDescription>
                    {"Bu qaytarib bo'lmas jarayon!!!"}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
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
