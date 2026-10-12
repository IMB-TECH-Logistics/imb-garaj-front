import { Check, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import i18n from "@/i18n/i18n"

export const CopyButton = (text: string | number) => {
    const [copied, setCopied] = useState(false)

    return (
        <span
            className={`!text-primary flex items-center gap-1 cursor-pointer`}
            onClick={(v) => {
                v.preventDefault()
                navigator.clipboard.writeText(text?.toString())
                toast.success(i18n.t("core.copy.copied", { text }))
                setCopied(true)
                setTimeout(() => {
                    setCopied(false)
                }, 1000);
            }}
        >
            {copied ? <Check width={16} /> : <Copy width={16} />}
            {text}
        </span>
    )
}
