import { useHasAction, useUser, useWarehouseOwner } from "@/constants/useUser"
import type { ItemAction, WhItem } from "./types"

export const useItemActions = (item?: WhItem) => {
    const isOwner = useWarehouseOwner()
    const { data: user } = useUser()
    const canControl = useHasAction([
        "warehouse_control",
        "manager_tech_check_control",
    ])

    if (!item || !canControl) return [] as ItemAction[]

    const tenantName = user?.tenant?.name
    const isHolder = !!tenantName && item.current_tenant_name === tenantName
    const holderOrOwner = isOwner || isHolder

    const actions: ItemAction[] = []
    if (item.state === "installed" && holderOrOwner) actions.push("remove")
    if (item.state === "in_stock" && isOwner) actions.push("repair")
    if (item.state === "installed" && holderOrOwner) actions.push("repair")
    if (item.state === "repair" && isOwner) actions.push("repair_return")
    if ((item.state === "in_stock" || item.state === "repair") && isOwner) {
        actions.push("write_off")
    }
    if (item.state === "installed" && holderOrOwner) actions.push("write_off")
    return actions
}
