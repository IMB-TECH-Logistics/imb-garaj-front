import { useUser } from "@/constants/useUser"
import { useLocation } from "@tanstack/react-router"
import { Settings, Truck, User, Wallet, Coins, Activity } from "lucide-react"
import { ReactNode, useMemo } from "react"

export interface MenuItem {
    label: string
    icon?: ReactNode
    path: string
    items?: MenuItem[]
    pending?: boolean
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

        acc.push(filteredItem)
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
    const { actions } = useUser()

    const safeActions: string[] = actions ?? []

    const items = useItems()

    const filteredItems = useMemo(
        () => filterMenuItems(items, safeActions),
        [items, safeActions],
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
                    { label: "Transportlar", path: "/managers", extraPaths: ["/manager-trips"] },
                    { label: "Kassa", path: "/kassa" },
                    {
                        label: "Texnik ko'rik",
                        path: "/technic-check",
                    },
                ],
            },
            {
                label: "Investor",
                icon: <Truck width={18} />,
                path: "/truck",
            },
            {
                label: "Buxgalteriya",
                icon: <Wallet width={18} />,
                path: "/buxgalteriya",
                pending: true,
            },
            {
                label: "Moliya",
                icon: <Coins width={18} />,
                path: "/moliya",
            },
            {
                label: "Monitoring",
                icon: <Activity width={18} />,
                path: "/monitoring",
                pending: true,
            },
            {
                label: "Sozlamalar",
                icon: <Settings width={18} />,
                path: "/locations",
                items: [
                    {
                        label: "Manzillar",
                        path: "/locations",
                    },
                    {
                        label: "Foydalanuvchilar",
                        path: "/users",
                    },
                    {
                        label: "Haydovchilar",
                        path: "/drivers",
                    },
                    {
                        label: "Rollar",
                        path: "/roles",
                    },
                    {
                        label: "Xaridorlar",
                        path: "/customers",
                    },
                    {
                        label: "Avtomobillar",
                        path: "/vehicles",
                    },
                    {
                        label: "Mashina turlari",
                        path: "/vehicle-types",
                    },

                    {
                        label: "Yuk turi",
                        path: "/cargo-types",
                    },
                    {
                        label: "To'lov turlari",
                        path: "/payment-types",
                    },
                    {
                        label: "Xarajat turlari",
                        path: "/expense-types",
                    },
                ],
            },
        ],
        [],
    )
