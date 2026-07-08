import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ReactNode } from "react"
import { ClassNameValue } from "tailwind-merge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "../ui/dialog"

type Props = {
    modalKey?: string
    title?: ReactNode
    description?: ReactNode
    children?: ReactNode
    className?: ClassNameValue
    classNameTitle?: ClassNameValue
    classNameIcon?: ClassNameValue
    closable?:boolean
    size?:
        | "max-w-lg"
        | "max-w-xl"
        | "max-w-2xl"
        | "max-w-3xl"
        | "max-w-4xl"
        | "max-w-5xl"
        | "max-w-6xl"
        | "max-w-[90%]"
        | "max-w-full"
        | "max-w-sm"
        | "max-w-md"
    onClose?: () => void
}

const Modal = ({
    title,
    description,
    children,
    modalKey = "default",
    classNameTitle,
    classNameIcon,
    className = "",
    size = "max-w-lg",
    onClose,
    closable=true,
}: Props) => {
    const { isOpen, closeModal } = useModal(modalKey)

    const handleClose = () => {
        if (onClose) {
            onClose()
        }
        closeModal()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            {isOpen && (
                <DialogContent
                   onInteractOutside={(e) => {
                    closable && e.preventDefault()
                }}
                    classNameIcon={classNameIcon}
                    className={cn(size, "min-w-0 overflow-hidden", className)}
                >
                    {title && (
                        <DialogTitle className={cn(classNameTitle)}>
                            {title}
                        </DialogTitle>
                    )}
                    {!title && (
                        <VisuallyHidden>
                            <DialogTitle>title</DialogTitle>
                        </VisuallyHidden>
                    )}
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                    <div className="min-w-0 overflow-x-auto">{children}</div>
                </DialogContent>
            )}
        </Dialog>
    )
}

export default Modal
