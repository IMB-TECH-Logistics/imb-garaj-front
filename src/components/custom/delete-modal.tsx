import { useTranslation } from "react-i18next"
import { useDelete } from "@/hooks/useDelete"
import { useModal } from "@/hooks/useModal"
import { useQueryClient } from "@tanstack/react-query"
import { ReactNode, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { handleFormError } from "@/lib/show-form-errors"
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
    restorable?: boolean
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
    restorable = false,
}: IProps) {
    const { closeModal } = useModal(modalKey)
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { mutate, isPending } = useDelete({
        onSuccess: () => {
            toast.success(t("messages.success_delete"), { icon: "✅" })
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
        onError: (error) => {
            handleFormError(error)
            closeModal()
        },
    })

    const handleDelete = () => {
        mutate(path + `/${id}`)
    }

    return (
        <Modal size="max-w-md" modalKey={modalKey} titleInChildren>
            <DialogHeader>
                <DialogTitle className="font-normal max-w-sm">
                    {name ?
                        <span className="block font-medium mb-1 break-all">
                            {name}
                        </span>
                    :   null}
                    {t("ui.delete_modal.question")}
                </DialogTitle>
                <DialogDescription>
                    {restorable
                        ? t("ui.delete_modal.restorable_hint")
                        : t("ui.delete_modal.irreversible")}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Button
                    variant={"outline"}
                    onClick={closeModal}
                    disabled={isPending}
                >
                    {t("actions.cancel")}
                </Button>
                <Button
                    variant={"destructive"}
                    onClick={handleDelete}
                    loading={isPending}
                >
                    {t("actions.delete")}
                </Button>
            </DialogFooter>
        </Modal>
    )
}
