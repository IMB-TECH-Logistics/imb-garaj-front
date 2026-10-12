import { createContext, useState, ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useTranslation } from "react-i18next"

interface PromptContextProps {
    prompt: (title?: string) => Promise<string | null>
}

export const PromptContext = createContext<PromptContextProps | undefined>(
    undefined,
)

export const PromptProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [resolvePromise, setResolvePromise] = useState<
        (value: string | null) => void
    >(() => {})
    const [dialogTitle, setDialogTitle] = useState<string | undefined>("")
    const [inputValue, setInputValue] = useState("")

    const prompt = (title?: string) => {
        setDialogTitle(title)
        setIsOpen(true)
        return new Promise<string | null>((resolve) => {
            setResolvePromise(() => resolve)
        })
    }

    const handleConfirm = () => {
        setIsOpen(false)
        resolvePromise(inputValue)
        setInputValue("")
    }

    return (
        <PromptContext.Provider value={{ prompt }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle || t("core.dialogs.reason_title")}</DialogTitle>
                        <VisuallyHidden>
                            <DialogDescription>
                                {dialogTitle || t("core.dialogs.reason_title")}
                            </DialogDescription>
                        </VisuallyHidden>
                    </DialogHeader>
                    <Input
                        value={inputValue}
                        fullWidth
                        autoFocus
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleConfirm()}
                        placeholder={dialogTitle || t("core.dialogs.reason_title")}
                    />
                </DialogContent>
            </Dialog>
        </PromptContext.Provider>
    )
}
