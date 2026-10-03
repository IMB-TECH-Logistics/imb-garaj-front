import { ClipboardEvent } from "react"
import { toast } from "sonner"
import { Input } from "../ui/input"

type TProps = {
    onFile: (file: File) => void
    disabled?: boolean
}

export default function PasteInput({ onFile, disabled }: TProps) {
    function onPaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault()
        if (disabled || !e.clipboardData.files.length) return

        const fileObject = e.clipboardData.files[0]
        if (!fileObject.type.startsWith("image/")) {
            toast.error("Faqat rasm yuklashingiz mumkin")
            return
        }

        onFile(fileObject)
    }

    return (
        <Input
            onPaste={onPaste}
            readOnly
            tabIndex={0}
            placeholder="(CTRL+V)"
            fullWidth
            className="!mb-1"
        />
    )
}
