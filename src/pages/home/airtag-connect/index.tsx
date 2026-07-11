import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { useTranslation } from "react-i18next"
import { formatMoney } from "@/lib/format-money"
import Modal from "@/components/custom/modal"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useAirtagConnectCols } from "./cols"
import ConnectModal from "./modal"
import { useGet } from "@/hooks/useGet"
import { AIRTAG_ORDERS } from "@/constants/api-endpoints"

const AirtagConnect = () => {
    const { openModal } = useModal("airtag-connect")
    const { t } = useTranslation()
    const { setData } = useGlobalStore()
    const { data: ordersData } = useGet(AIRTAG_ORDERS)
    const handleConnect = (order: AirtagOrder) => {
        setData("connect-order", order)
        openModal()
    }

    const columns = useAirtagConnectCols(handleConnect)

    return (
        <div>
            <DataTable
                columns={columns}
                data={ordersData?.results}
                className="min-w-[900px]"
                paginationProps={{
                    totalPages: ordersData?.pages,
                }}
                head={
                    <div className="mb-3">
                        <div className="flex justify-between items-center gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-medium">
                                    {t("Ulanmagan qurilmalar")}
                                </h1>
                                <Badge className="text-sm">
                                    {formatMoney(ordersData?.count)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                }
            />

            <Modal modalKey="airtag-connect" title={t("AirTag ulash")}>
                <ConnectModal />
            </Modal>
        </div>
    )
}

export default AirtagConnect
