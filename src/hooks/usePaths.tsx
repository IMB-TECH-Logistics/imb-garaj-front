import { useUser } from "@/constants/useUser"
import { useLocation } from "@tanstack/react-router"
import { Settings, Truck, User, Users, Wallet, Coins, Activity } from "lucide-react"
import { ReactNode, useMemo } from "react"

export interface MenuItem {
    label: string
    icon?: ReactNode
    path: string
    items?: MenuItem[]
    pending?: boolean
    allowKey?: string
    alwaysShow?: boolean
    extraPaths?: string[]
}

const filterMenuItems = (
    items: MenuItem[],
    allowedModules: string[],
): MenuItem[] => {
    return items.reduce<MenuItem[]>((acc, item) => {
        const filteredItem: MenuItem = { ...item }

        if (item.items) {
            filteredItem.items = filterMenuItems(item.items, allowedModules)
            if (filteredItem.items.length > 0) {
                filteredItem.path = filteredItem.items[0].path
            }
        }

        const isAllowed =
            item.alwaysShow ||
            (item.allowKey && allowedModules.includes(item.allowKey)) ||
            (filteredItem.items && filteredItem.items.length > 0)

        if (isAllowed) {
            acc.push(filteredItem)
        }

        return acc
    }, [])
}

const matchesPath = (pathname: string, item: MenuItem): boolean => {
    if (pathname === item.path || pathname.startsWith(item.path + "/")) {
        return true
    }
    if (item.extraPaths) {
        return item.extraPaths.some(
            (p) => pathname === p || pathname.startsWith(p + "/"),
        )
    }
    return false
}

const findChildPaths = (items: MenuItem[], pathname: string): MenuItem[] => {
    for (const item of items) {
        if (matchesPath(pathname, item)) {
            return item.items ?? []
        }

        if (item.items) {
            const hasMatchingChild = item.items.some(
                (subItem) => matchesPath(pathname, subItem),
            )
            if (hasMatchingChild) {
                return item.items
            }

            const found = findChildPaths(item.items, pathname)
            if (found.length > 0) {
                return found
            }
        }
    }

    return []
}

export const usePaths = () => {
    const { pathname } = useLocation()
    const { actions, data } = useUser()

    const safeActions: string[] = actions ?? []
    const isSuperuser = data?.is_superuser

    const items = useItems()

    const filteredItems = useMemo(
        () => isSuperuser ? items : filterMenuItems(items, safeActions),
        [items, safeActions, isSuperuser],
    )

    const childPaths = useMemo(
        () => findChildPaths(filteredItems, pathname),
        [filteredItems, pathname],
    )

    return {
        childPaths,
        filteredItems,
    }
}

export const useItems = () =>
    useMemo<MenuItem[]>(
        () => [
            {
                label: "Meneger",
                icon: <User size={18} />,
                path: "/managers",
                extraPaths: ["/manager-trips"],
                items: [
                    { label: "Transportlar", path: "/managers", extraPaths: ["/manager-trips"], allowKey: "manager_vehicles_view" },
                    { label: "Kassa", path: "/kassa", allowKey: "manager_cashflow_view" },
                    { label: "Texnik ko'rik", path: "/technic-check", allowKey: "manager_tech_check_view" },
                ],
            },
            {
                label: "Buxgalteriya",
                icon: <Wallet width={18} />,
                path: "/buxgalteriya",
                allowKey: "accounting_view",
            },
            {
                label: "Investor",
                icon: <Truck width={18} />,
                path: "/truck",
                allowKey: "investor_view",
            },
            {
                label: "Haydovchilar",
                icon: <Users width={18} />,
                path: "/haydovchilar",
                alwaysShow: true,
            },
            {
                label: "Moliya",
                icon: <Coins width={18} />,
                path: "/moliya",
                allowKey: "finance_view",
            },
            {
                label: "Monitoring",
                icon: <Activity width={18} />,
                path: "/monitoring",
                allowKey: "monitoring_view",
                pending: true,
            },
            {
                label: "Sozlamalar",
                icon: <Settings width={18} />,
                path: "/locations",
                items: [
                    { label: "Manzillar", path: "/locations", allowKey: "settings_locations_view" },
                    { label: "Yo'nalishlar", path: "/route-configs", allowKey: "settings_directions_view" },
                    { label: "Foydalanuvchilar", path: "/users", allowKey: "settings_users_view" },
                    { label: "Haydovchilar", path: "/drivers", allowKey: "settings_drivers_view" },
                    { label: "Rollar", path: "/roles", allowKey: "settings_roles_view" },
                    { label: "Xaridorlar", path: "/customers", allowKey: "settings_customers_view" },
                    { label: "Avtomobillar", path: "/vehicles", allowKey: "settings_vehicles_view" },
                    { label: "Mashina turlari", path: "/vehicle-types", allowKey: "settings_vehicle_types_view" },
                    { label: "Yuk turi", path: "/cargo-types", allowKey: "settings_cargo_types_view" },
                    { label: "To'lov turlari", path: "/payment-types", allowKey: "settings_payment_types_view" },
                    { label: "Xarajat turlari", path: "/expense-types", allowKey: "settings_expense_types_view" },
                    { label: "Zapravkalar", path: "/petrol-stations", allowKey: "settings_petrol_stations_view" },
                ],
            },
        ],
        [],
    )
