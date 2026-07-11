import ParamTabs from "@/components/as-params/tabs"
import Modal from "@/components/custom/modal"
import GridList from "@/components/shared/grid-list"
import OrderCard from "@/components/shared/order-card"
import { useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { MOCK_ORDERS } from "./mock-data"
import ViewModal from "./view-modal"

const ORDERS_TAB_PARAM = "orders_tab"
const TAB_UNASSIGNED = "unassigned"
const TAB_ASSIGNED = "assigned"

const Buyurtmalar = () => {
    const search = useSearch({ strict: false }) as Record<string, unknown>
    const activeTab =
        (search[ORDERS_TAB_PARAM] as string | undefined) ?? TAB_UNASSIGNED

    const unassignedOrders = useMemo(
        () => MOCK_ORDERS.filter((o) => !o.truck_id),
        [],
    )
    const assignedOrders = useMemo(
        () => MOCK_ORDERS.filter((o) => !!o.truck_id),
        [],
    )

    const visibleOrders =
        activeTab === TAB_ASSIGNED ? assignedOrders : unassignedOrders

    return (
        <div className="p-4">
            <header className="mb-4">
                <h1 className="text-xl font-medium mb-3">Buyurtmalar</h1>
                <ParamTabs
                    paramName={ORDERS_TAB_PARAM}
                    options={[
                        {
                            value: TAB_UNASSIGNED,
                            label: `Biriktirilmagan - ${unassignedOrders.length}`,
                        },
                        {
                            value: TAB_ASSIGNED,
                            label: `Haydovchi biriktirilgan - ${assignedOrders.length}`,
                        },
                    ]}
                />
            </header>

            <GridList
                isLoading={false}
                data={visibleOrders}
                renderItem={(d) => <OrderCard key={d.id} item={d} />}
            />

            <Modal
                modalKey="view-modal"
                size="max-w-6xl"
                title="Nomzod mashinalar"
            >
                <ViewModal />
            </Modal>
        </div>
    )
}

export default Buyurtmalar
