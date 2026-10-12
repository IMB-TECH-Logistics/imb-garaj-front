import { useTranslation } from "react-i18next"
import ParamPagination from "../as-params/pagination";
import { ReactNode } from "react";

type Props = {
    count?: number
    isFetching?: boolean
    paginationProps?: PaginationProps
    filterComponent?: ReactNode
}

export default function PageHeader({
    count = 0,
    isFetching = false,
    filterComponent,
    paginationProps,
}: Props) {
    const { t } = useTranslation()
    return (
        <div className="flex items-center gap-6 mb-3">
            <p className="text-xl">{t("ui.list.count_value", { count })}</p>
            <div className="flex-1">{filterComponent}</div>
            <ParamPagination
                disabled={isFetching}
                {...paginationProps}
            />
        </div>
    )
}
