import { useTranslation } from "react-i18next"
import Loading from "@/layouts/loading"
import { ReactNode } from "react"
import EmptyIcon from "../custom/empty-icon"
import { ClassNameValue } from "tailwind-merge"
import { cn } from "@/lib/utils"

export default function GridList<T extends object>({
    isLoading = false,
    data,
    renderItem,
    className
}: {
    data?: T[],
    isLoading?: boolean,
    renderItem: (item: T) => ReactNode,
    className?: ClassNameValue
}) {
    return (
        <Loading loading={isLoading}>
            {!!data?.length ? (
                <div className={cn("grid grid-cols-1 lg:grid-cols-4 1.5xl:grid-cols-5 gap-4", className)}>
                    {data?.map(d => renderItem(d))}
                </div>
            ) : <EmptyBox />}
        </Loading>
    )
}

function EmptyBox() {
    const { t } = useTranslation()
    return <div className="w-full flex items-center flex-col py-20 gap-2">
        <EmptyIcon size={60} className="text-foreground/60" />
        <p className="text-foreground/60">{t("page.not_found")}</p>
    </div>
}