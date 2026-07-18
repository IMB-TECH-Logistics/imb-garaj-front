import ParamInput from "@/components/as-params/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { PlusCircle } from "lucide-react"
import { ReactNode, useRef } from "react"

interface TableHeaderProps {
    fileName: string
    storeKey?: string
    url: string
    searchKey?: string
    pageKey: string
    onAdd?: () => void
    count?: number
    extraTitle?: ReactNode
    extraRight?: ReactNode
}

const TableHeader = ({
    fileName,
    storeKey,
    searchKey,
    pageKey,
    onAdd,
    count,
    extraTitle,
    extraRight,
}: TableHeaderProps) => {
    const { openModal: openCreateModal } = useModal("create")
    const { clearKey } = useGlobalStore()

    const handleAdd = () => {
        if (onAdd) {
            onAdd()
            return
        }

        if (storeKey) {
            clearKey(storeKey)
        }

        openCreateModal()
    }

    const lastCount = useRef<number>()
    if (count !== undefined) {
        lastCount.current = count
    }

    const showTitle = lastCount.current !== undefined

    return (
        <div className="flex items-center justify-between gap-3 mb-3">
            {showTitle && (
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold">{fileName}</h1>

                    <Badge className="text-sm">
                        {formatMoney(lastCount.current)}
                    </Badge>

                    {extraTitle}
                </div>
            )}

            <div
                className={
                    showTitle ?
                        "flex items-center gap-3 ml-auto"
                    :   "flex items-center justify-between gap-3 w-full"
                }
            >
                {searchKey && (
                    <div className={showTitle ? "w-72" : "flex-1"}>
                        <ParamInput
                            fullWidth
                            searchKey={searchKey}
                            pageKey={pageKey}
                        />
                    </div>
                )}

                {/* <DownloadAsExcel url={"settings_url"} name={`${fileName}`} /> */}

                {(onAdd || storeKey) && (
                    <Button
                        className="flex items-center gap-2"
                        onClick={handleAdd}
                        icon={<PlusCircle size={18} />}
                    >
                        Qo'shish
                    </Button>
                )}

                {extraRight}
            </div>
        </div>
    )
}

export default TableHeader
