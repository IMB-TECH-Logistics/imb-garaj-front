import { useUser } from "@/constants/useUser"
import { useLocation } from "@tanstack/react-router"
import {
    Activity,
    Boxes,
    Coins,
    Settings,
    Truck,
    User,
    Users,
    Wallet,
} from "lucide-react"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

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
            const hasMatchingChild = item.items.some((subItem) =>
                matchesPath(pathname, subItem),
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

const collectPaths = (items: MenuItem[]): string[] =>
    items.flatMap((item) => [
        item.path,
        ...(item.extraPaths ?? []),
        ...(item.items ? collectPaths(item.items) : []),
    ])

const collectLeafPaths = (items: MenuItem[]): string[] =>
    items.flatMap((item) =>
        item.items && item.items.length > 0
            ? collectLeafPaths(item.items)
            : [item.path],
    )

const matches = (pathname: string, path: string) =>
    pathname === path || pathname.startsWith(path + "/")

const GUARDED_EXTRA: Record<string, string> = {
    "/trip": "manager_flights_view",
    "/dashboard": "investor_view",
}

export const usePaths = () => {
    const { pathname } = useLocation()
    const { actions, data, isLoading } = useUser()

    const safeActions: string[] = actions ?? []
    const isSuperuser = data?.is_superuser

    const items = useItems()

    const filteredItems = useMemo(
        () => (isSuperuser ? items : filterMenuItems(items, safeActions)),
        [items, safeActions, isSuperuser],
    )

    const childPaths = useMemo(
        () => findChildPaths(filteredItems, pathname),
        [filteredItems, pathname],
    )

    const allowedPaths = useMemo(
        () => collectPaths(filteredItems),
        [filteredItems],
    )

    const deniedPaths = useMemo(
        () =>
            collectPaths(items).filter(
                (path) => !allowedPaths.some((allowed) => allowed === path),
            ),
        [items, allowedPaths],
    )

    const firstAllowedPath = useMemo(
        () => collectLeafPaths(filteredItems)[0],
        [filteredItems],
    )

    // Faqat menyuda bor, lekin ruxsat berilmagan sahifalar to'siladi. Tafsilot
    // sahifalari (masalan /truck-detail/9) menyuda yo'q — ularni API o'zi
    // qo'riqlaydi, bu yerda ularni noto'g'ri to'sib qo'ymaymiz.
    const isDeniedPath = useMemo(
        () => (pathname: string) => {
            if (isLoading || !data) return false
            if (isSuperuser) return false

            const extra = Object.entries(GUARDED_EXTRA).find(([path]) =>
                matches(pathname, path),
            )
            if (extra) return !safeActions.includes(extra[1])

            if (allowedPaths.some((path) => matches(pathname, path))) return false
            return deniedPaths.some((path) => matches(pathname, path))
        },
        [allowedPaths, deniedPaths, isSuperuser, isLoading, data, safeActions],
    )

    return {
        childPaths,
        filteredItems,
        allowedPaths,
        firstAllowedPath,
        isDeniedPath,
        isLoadingPermissions: isLoading || !data,
    }
}

export const useItems = () => {
    const { t } = useTranslation()
    return useMemo<MenuItem[]>(
        () => [
            {
                label: t("nav.manager"),
                icon: <User size={18} />,
                path: "/managers",
                extraPaths: ["/manager-trips"],
                items: [
                    {
                        label: t("nav.vehicles"),
                        path: "/managers",
                        extraPaths: ["/manager-trips"],
                        allowKey: "manager_vehicles_view",
                    },
                    {
                        label: t("nav.flights"),
                        path: "/flights",
                        allowKey: "manager_flights_view",
                    },
                    {
                        label: t("nav.kassa"),
                        path: "/kassa",
                        allowKey: "manager_cashflow_view",
                    },
                    {
                        label: t("nav.tech_check"),
                        path: "/technic-check",
                        allowKey: "manager_tech_check_view",
                    },
                    {
                        label: t("nav.petrol"),
                        path: "/petrol-stations",
                        allowKey: "settings_petrol_stations_view",
                    },
                ],
            },
            {
                label: t("nav.accounting"),
                icon: <Wallet width={18} />,
                path: "/buxgalteriya",
                allowKey: "accounting_view",
            },
            {
                label: t("nav.investor"),
                icon: <Truck width={18} />,
                path: "/truck",
                allowKey: "investor_view",
            },
            {
                label: t("nav.drivers"),
                icon: <Users width={18} />,
                path: "/haydovchilar",
                allowKey: "hr_drivers_view",
            },
            {
                label: t("nav.monitoring"),
                icon: <Activity width={18} />,
                path: "/monitoring",
                allowKey: "monitoring_view",
            },
            {
                label: t("nav.warehouse"),
                icon: <Boxes width={18} />,
                path: "/ombor",
                allowKey: "warehouse_view",
            },
            {
                label: t("nav.finance"),
                icon: <Coins width={18} />,
                path: "/moliya",
                allowKey: "finance_view",
            },
            {
                label: t("nav.settings"),
                icon: <Settings width={18} />,
                path: "/locations",
                items: [
                    {
                        label: t("nav.locations"),
                        path: "/locations",
                        allowKey: "settings_locations_view",
                    },
                    {
                        label: t("nav.directions"),
                        path: "/route-configs",
                        allowKey: "settings_directions_view",
                    },
                    {
                        label: t("nav.drivers"),
                        path: "/drivers",
                        allowKey: "settings_drivers_view",
                    },
                    {
                        label: t("nav.trucks"),
                        path: "/vehicles",
                        allowKey: "settings_vehicles_view",
                    },
                    {
                        label: t("nav.users"),
                        path: "/users",
                        allowKey: "settings_users_view",
                    },
                    {
                        label: t("nav.roles"),
                        path: "/roles",
                        allowKey: "settings_roles_view",
                    },
                    {
                        label: t("nav.customers"),
                        path: "/customers",
                        allowKey: "settings_customers_view",
                    },
                    {
                        label: t("nav.truck_types"),
                        path: "/vehicle-types",
                        allowKey: "settings_vehicle_types_view",
                    },
                    {
                        label: t("nav.cargo_types"),
                        path: "/cargo-types",
                        allowKey: "settings_cargo_types_view",
                    },
                    {
                        label: t("nav.payment_types"),
                        path: "/payment-types",
                        allowKey: "settings_payment_types_view",
                    },
                    {
                        label: t("nav.expense_types"),
                        path: "/expense-types",
                        allowKey: "settings_expense_types_view",
                    },
                    {
                        label: t("nav.monthly_rates"),
                        path: "/driver-salaries",
                        allowKey: "settings_driver_salaries_view",
                    },
                    {
                        label: t("nav.activity_log"),
                        path: "/logs",
                        allowKey: "logs_view",
                    },
                ],
            },
        ],
        [t],
    )
}
