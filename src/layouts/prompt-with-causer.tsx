import { createContext, useState, ReactNode, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useTranslation } from "react-i18next"

interface PromptResult {
    text: string
    cause: "company" | "driver"
}

interface PromptContextProps {
    prompt: (title?: string) => Promise<PromptResult | null>
}

export const PromptWithCauseContext = createContext<
    PromptContextProps | undefined
>(undefined)

export const PromptWithCauseProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [dialogTitle, setDialogTitle] = useState<string | undefined>("")
    const [inputValue, setInputValue] = useState("")
    const [cause, setCause] = useState<PromptResult["cause"]>("company")
    const resolvePromiseRef = useRef<(value: PromptResult | null) => void>()

    const prompt = (title?: string): Promise<PromptResult | null> => {
        setDialogTitle(title)
        setIsOpen(true)
        setInputValue("")
        setCause("company")
        return new Promise<PromptResult | null>((resolve) => {
            resolvePromiseRef.current = resolve
        })
    }

    const handleConfirm = () => {
        setIsOpen(false)
        if (resolvePromiseRef.current) {
            resolvePromiseRef.current({ text: inputValue, cause })
            resolvePromiseRef.current = undefined
        }
    }



    return (
        <PromptWithCauseContext.Provider value={{ prompt }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle || t("core.dialogs.reason_title")}</DialogTitle>
                        <VisuallyHidden>
                            <DialogDescription>{dialogTitle}</DialogDescription>
                        </VisuallyHidden>
                    </DialogHeader>
                    <Input
                        value={inputValue}
                        autoFocus
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleConfirm()}
                        placeholder={dialogTitle || t("core.dialogs.reason_title")}
                        fullWidth
                    />
                    <RadioGroup
                        className="flex gap-4"
                        value={cause}
                        onValueChange={(val: PromptResult["cause"]) =>
                            setCause(val)
                        }
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="company" id="company" />
                            <Label htmlFor="company">{t("core.dialogs.cause_company")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="driver" id="driver" />
                            <Label htmlFor="driver">{t("core.dialogs.cause_driver")}</Label>
                        </div>
                    </RadioGroup>
                </DialogContent>
            </Dialog>
        </PromptWithCauseContext.Provider>
    )
}
