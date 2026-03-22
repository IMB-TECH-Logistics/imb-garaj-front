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

const findChildPaths = (items: MenuItem[], pathname: string): MenuItem[] => {
    for (const item of items) {
        if (pathname === item.path || pathname.startsWith(item.path + "/")) {
            return item.items ?? []
        }

        if (item.items) {
            const hasMatchingChild = item.items.some(
                (subItem) =>
                    pathname === subItem.path ||
                    pathname.startsWith(subItem.path + "/"),
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
                items: [
                    { label: "Transportlar", path: "/managers" },
                    {
                        label: "Texnik ko'rik",
                        path: "/technic-check",
                    },
                ],
            },
            {
                label: "Biznes egasi",
                icon: <Truck width={18} />,
                path: "/truck",
            },
            {
                label: "Moliya",
                icon: <Coins width={18} />,
                path: "/moliya",
                pending: true,
            },
            {
                label: "Monitoring",
                icon: <Activity width={18} />,
                path: "/monitoring",
                pending: true,
            },
            {
                label: "Buxgalteriya",
                icon: <Wallet width={18} />,
                path: "/kassa",
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
