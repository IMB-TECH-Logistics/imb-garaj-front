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
    /**
     * B-84: `title` berilmaganda ekran o'quvchi uchun ishlatiladigan
     * ko'rinmas sarlavha. Ekranda chizilmaydi, faqat eshittiriladi.
     */
    a11yTitle?: string
    description?: ReactNode
    children?: ReactNode
    className?: ClassNameValue
    classNameTitle?: ClassNameValue
    classNameIcon?: ClassNameValue
    closable?: boolean
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
    a11yTitle = "Muloqot oynasi",
    description,
    children,
    modalKey = "default",
    classNameTitle,
    classNameIcon,
    className = "",
    size = "max-w-lg",
    onClose,
    closable = true,
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
                    {/*
                     * B-84: ilgari bu yerda o'rinbosar so'z ("title") kodda qolib
                     * ketgan edi — Radix uni haqiqiy sarlavha deb e'lon qilardi va
                     * ekran o'quvchi oynani "title" deb o'qirdi. Endi chaqiruvchi
                     * `a11yTitle` orqali mazmunli nom beradi, bermasa umumiy
                     * o'zbekcha zaxira matn ishlatiladi. Radix baribir sarlavhani
                     * talab qilgani uchun blok o'chirilmadi, faqat matni tuzatildi.
                     */}
                    {!title && (
                        <VisuallyHidden>
                            <DialogTitle>{a11yTitle}</DialogTitle>
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
