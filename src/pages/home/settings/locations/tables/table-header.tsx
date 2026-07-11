import ParamInput from "@/components/as-params/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { CirclePlus } from "lucide-react"

interface TableHeaderProps {
    storeKey?: string
    name: string
    searchKey: string
    pageKey: string
    modalKey: string
    disabled: boolean
    title?: string
    count?: number
}

const TableHeaderLocation = ({
    storeKey,
    modalKey,
    disabled,
    name,
    searchKey,
    pageKey,
    title,
    count,
}: TableHeaderProps) => {
    const { openModal: openCreateModal } = useModal(modalKey)
    const { clearKey } = useGlobalStore()

    const handleAdd = () => {
        if (storeKey) {
            clearKey(storeKey)
        }
        openCreateModal()
    }

    const showTitle = !!title

    return (
        <div className="flex items-center justify-between gap-3 mb-3">
            {showTitle && (
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {count !== undefined && (
                        <Badge className="text-sm">{count}</Badge>
                    )}
                </div>
            )}
            <div
                className={
                    showTitle
                        ? "flex items-center gap-3 ml-auto"
                        : "flex items-center justify-between gap-3 w-full"
                }
            >
                <div className={showTitle ? "w-72" : "flex-1"}>
                    <ParamInput
                        name={name}
                        fullWidth
                        searchKey={searchKey}
                        pageKey={pageKey}
                    />
                </div>
                <Button
                    className="flex items-center gap-2"
                    onClick={handleAdd}
                    disabled={disabled}
                    icon={<CirclePlus size={18} />}
                >
                    Qo'shish
                </Button>
            </div>
        </div>
    )
}

export default TableHeaderLocation
