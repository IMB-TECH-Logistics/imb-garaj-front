import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { CirclePlus } from "lucide-react"
import { useTranslation } from "react-i18next"

interface TableHeaderProps {
    storeKey?: string
    modalKey: string

    heading: string
}

const TableHeaderTripsOrders = ({
    storeKey,
    modalKey,
    heading,
}: TableHeaderProps) => {
    const { t } = useTranslation()
    const { openModal: openCreateModal } = useModal(modalKey)
    const { clearKey } = useGlobalStore()

    const handleAdd = () => {
        if (storeKey) {
            clearKey(storeKey)
        }
        openCreateModal()
    }

    return (
        <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-lg font-medium">{heading}</h3>
            <div className="flex items-center gap-3">
                <Button
                    className="flex items-center gap-2"
                    onClick={handleAdd}
                    icon={<CirclePlus size={18} />}
                >
                    {t("actions.add")}
                </Button>
            </div>
        </div>
    )
}

export default TableHeaderTripsOrders
