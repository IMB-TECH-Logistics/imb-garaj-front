import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import EmptyIcon from "./empty-icon"

export default function EmptyBox({
    data,
    height = "h-[75vh]",
}: {
    data?: any[]
    height?: string
}) {
    const { t } = useTranslation()
    if (data?.length) {
        return null
    }
    return (
        <div
            className={cn(
                "w-full flex items-center justify-center flex-col  gap-2",
                height,
            )}
        >
            <EmptyIcon size={60} className="text-foreground/60" />
            <p className="text-foreground/60">{t("page.not_found")}</p>
        </div>
    )
}
