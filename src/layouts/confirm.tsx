import Modal from "@/components/custom/modal"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createContext, KeyboardEvent, ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import CodeConfirmForm from "./code-confirm-form"

interface ConfirmContextProps {
    confirm: (options: UseConfirmProps) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextProps | undefined>(
    undefined,
)

interface UseConfirmProps {
    title?: ReactNode
    description?: ReactNode
}

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [resolvePromise, setResolvePromise] = useState<
        (value: boolean) => void
    >(() => {})
    const [dialogProps, setDialogProps] = useState<UseConfirmProps>({})

    const confirm = (options: UseConfirmProps) => {
        setDialogProps(options)
        setIsOpen(true)
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve)
        })
    }

    const handleConfirm = () => {
        setIsOpen(false)
        resolvePromise(true)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter") {
            event.preventDefault()
            handleConfirm()
        }
    }

    const handleCancel = () => {
        setIsOpen(false)
        resolvePromise(false)
    }

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent onKeyDown={handleKeyDown}>
                    <AlertDialogTitle>
                        {dialogProps.title || t("messages.confirm_dialog_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogProps.description}
                    </AlertDialogDescription>
                    <AlertDialogFooter className="!flex !flex-row items-center gap-4">
                        <AlertDialogCancel
                            onClick={handleCancel}
                            className="m-0 w-full"
                        >
                            {t("actions.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className="w-full"
                        >
                            {t("actions.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Modal
                modalKey="confim-download"
                title={t("messages.download_password")}
            >
                <CodeConfirmForm />
            </Modal>
        </ConfirmContext.Provider>
    )
}
