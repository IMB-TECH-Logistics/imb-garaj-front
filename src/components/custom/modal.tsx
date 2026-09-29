import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ReactNode, useEffect, useRef } from "react"
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
    titleInChildren?: boolean
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
    titleInChildren = false,
}: Props) => {
    const { isOpen, closeModal } = useModal(modalKey)
    const openerRef = useRef<HTMLElement | null>(null)
    const wasOpen = useRef(false)
    if (isOpen && !wasOpen.current && document.activeElement instanceof HTMLElement) {
        openerRef.current = document.activeElement
    }

    useEffect(() => {
        wasOpen.current = !!isOpen
        if (isOpen) return
        const opener = openerRef.current
        openerRef.current = null
        if (opener?.isConnected) setTimeout(() => opener.focus())
    }, [isOpen])

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
                    className={cn(size, "min-w-0 max-h-[calc(100dvh-1rem)] overflow-x-hidden overflow-y-auto", className)}
                >
                    {title && (
                        <DialogTitle className={cn(classNameTitle)}>
                            {title}
                        </DialogTitle>
                    )}
                    {!title && !titleInChildren && (
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
