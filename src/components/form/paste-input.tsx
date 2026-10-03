import { ClipboardEvent } from "react"
import { toast } from "sonner"
import { Input } from "../ui/input"

type TProps = {
    onFile: (file: File) => void
    disabled?: boolean
}

const extFromType = (type: string) =>
    (type.split("/")[1] || "png").replace("jpeg", "jpg").replace(/\+.*$/, "")

const imageFromItems = (data: DataTransfer) => {
    for (const file of Array.from(data.files)) {
        if (file.type.startsWith("image/")) return file
    }
    for (const item of Array.from(data.items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
                return file.name
                    ? file
                    : new File([file], `image.${extFromType(file.type)}`, { type: file.type })
            }
        }
    }
    return null
}

const imageSrcFromText = (data: DataTransfer) => {
    const html = data.getData("text/html")
    const fromHtml = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    if (fromHtml) return fromHtml
    const text = (data.getData("text/uri-list") || data.getData("text/plain")).trim()
    if (/^(data:image\/|https?:\/\/|blob:)/i.test(text)) return text
    return null
}

const fetchImage = async (src: string) => {
    const response = await fetch(src)
    const blob = await response.blob()
    if (!blob.type.startsWith("image/")) return null
    return new File([blob], `image.${extFromType(blob.type)}`, { type: blob.type })
}

export default function PasteInput({ onFile, disabled }: TProps) {
    async function onPaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault()
        if (disabled) return

        const file = imageFromItems(e.clipboardData)
        if (file) {
            onFile(file)
            return
        }

        const src = imageSrcFromText(e.clipboardData)
        if (src) {
            try {
                const fetched = await fetchImage(src)
                if (fetched) {
                    onFile(fetched)
                    return
                }
            } catch {
                toast.error("Rasmni olib bo'lmadi, uni kompyuterga saqlab yuklang")
                return
            }
        }

        toast.error("Faqat rasm yuklashingiz mumkin")
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
