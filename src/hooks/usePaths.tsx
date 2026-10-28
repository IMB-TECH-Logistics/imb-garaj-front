import { moduleOfCode, useUser, useWarehouseOwner } from "@/constants/useUser"
import { useDocumentAlerts } from "@/hooks/use-document-alerts"
import { useTechCheckAlerts } from "@/hooks/use-tech-check-alerts"
import { useNoPriceAlerts } from "@/hooks/use-no-price-alerts"
import { useLocation } from "@tanstack/react-router"
import {
    Activity,
    BarChart3,
    Boxes,
    Coins,
    CreditCard,
    Settings,
    Truck,
    Wrench,
    User,
    Users,
    Wallet,
    HandCoins,
    Contact,
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
    allowKeys?: string[]
    alwaysShow?: boolean
    extraPaths?: string[]
    badge?: number
    ownerOnly?: boolean
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
            (item.allowKeys && item.allowKeys.some((k) => allowedModules.includes(k))) ||
            (filteredItem.items && filteredItem.items.length > 0)

        if (isAllowed) {
            acc.push(filteredItem)
        }

        return acc
    }, [])
}

const removeDisabledItems = (
    items: MenuItem[],
    disabledModules: string[],
): MenuItem[] =>
    items.reduce<MenuItem[]>((acc, item) => {
        const keys = [
            ...(item.allowKey ? [item.allowKey] : []),
            ...(item.allowKeys ?? []),
        ]
        if (
            keys.length > 0 &&
            keys.every((key) => disabledModules.includes(moduleOfCode(key)))
        ) {
            return acc
        }
        if (item.items) {
            const children = removeDisabledItems(item.items, disabledModules)
            if (children.length === 0) return acc
            acc.push({ ...item, items: children })
            return acc
        }
        acc.push(item)
        return acc
    }, [])

const removeOwnerOnly = (items: MenuItem[], isOwner: boolean): MenuItem[] =>
    isOwner ?
        items
    :   items
            .filter((item) => !item.ownerOnly)
            .map((item) =>
                item.items ?
                    { ...item, items: removeOwnerOnly(item.items, isOwner) }
                :   item,
            )

const matchesPath =(pathname: string, item: MenuItem): boolean => {
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

const withBadges = (
    items: MenuItem[],
    badges: Record<string, number>,
): MenuItem[] =>
    items.map((item) => {
        if (item.items?.length) {
            const children = withBadges(item.items, badges)
            const total = children.reduce((sum, c) => sum + (c.badge ?? 0), 0)
            return { ...item, items: children, badge: total || undefined }
        }
        return { ...item, badge: badges[item.path] || undefined }
    })

const matches = (pathname: string, path: string) =>
    pathname === path || pathname.startsWith(path + "/")

// Menyuda yo'q yo'llar: kalitlardan biri bo'lsa ochiladi (backend permission_codes GET bilan bir xil).
const GUARDED_EXTRA: Record<string, string | string[]> = {
    "/trip": "manager_flights_view",
    "/orders": "manager_flights_view",
    "/dashboard": "financial_result_view",
    "/truck-detail": "financial_result_view",
    // RunOrderListView GET: manager_flights_view/control yoki accounting_view/control
    "/flights": ["manager_flights_view", "manager_flights_control", "accounting_view", "accounting_control"],
    // shared_warehouse UnitViewSet — APP_MODULES bo'yicha warehouse_view
    "/units": "warehouse_view",
}

export const usePaths = () => {
    const { pathname } = useLocation()
    const { actions, data, isLoading } = useUser()

    const safeActions: string[] = actions ?? []
    const isSuperuser = data?.is_superuser

    const items = useItems()
    const disabledModules = data?.disabled_modules

    const isWarehouseOwner = useWarehouseOwner()

    const enabledItems = useMemo(
        () =>
            removeOwnerOnly(
                disabledModules?.length
                    ? removeDisabledItems(items, disabledModules)
                    : items,
                isWarehouseOwner,
            ),
        [items, disabledModules, isWarehouseOwner],
    )

    const { count: documentAlerts } = useDocumentAlerts()
    const { count: techCheckAlerts } = useTechCheckAlerts()
    const { count: noPriceAlerts } = useNoPriceAlerts()

    const filteredItems = useMemo(
        () =>
            withBadges(
                isSuperuser
                    ? enabledItems
                    : filterMenuItems(enabledItems, safeActions),
                { "/documents": documentAlerts, "/technic-check": techCheckAlerts, "/route-configs": noPriceAlerts },
            ),
        [enabledItems, safeActions, isSuperuser, documentAlerts, techCheckAlerts, noPriceAlerts],
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

            const extra = Object.entries(GUARDED_EXTRA).find(([path]) =>
                matches(pathname, path),
            )
            if (extra) {
                const codes = Array.isArray(extra[1]) ? extra[1] : [extra[1]]
                if (codes.every((c) => disabledModules?.includes(moduleOfCode(c)))) return true
                if (!isSuperuser) return !codes.some((c) => safeActions.includes(c))
            }

            if (allowedPaths.some((path) => matches(pathname, path))) return false
            return deniedPaths.some((path) => matches(pathname, path))
        },
        [allowedPaths, deniedPaths, isSuperuser, isLoading, data, safeActions, disabledModules],
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
    const { data: me } = useUser()
    const kassaV2 = me?.kassa_mode === "driver_cash" && me?.kassa_version === 2
    const investorsV1 = me?.investor_version === 1 || import.meta.env.VITE_INVESTORS_V1 === "1"
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
                label: t("nav.kassa"),
                icon: <CreditCard width={18} />,
                path: "/kassa",
                ...(kassaV2
                    ? { allowKeys: ["kassa_cashier_view", "kassa_cashier_control"] }
                    : {
                          allowKey: "manager_cashflow_view",
                          allowKeys: ["kassa_payer_view", "kassa_payment_requests_view", "kassa_cashier_view"],
                      }),
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
                allowKey: "financial_result_view",
            },
            {
                label: t("nav.investor_dashboard"),
                icon: <BarChart3 width={18} />,
                path: "/investorlar",
                allowKey: "investor_view",
            },
            ...(investorsV1 ?
                [
                    {
                        label: t("nav.investors_list"),
                        icon: <HandCoins width={18} />,
                        path: "/investor-royxati",
                        allowKey: "investor_view",
                    },
                    {
                        label: t("nav.contragents"),
                        icon: <Contact width={18} />,
                        path: "/kontragentlar",
                        allowKey: "investor_view",
                    },
                ]
            :   []),
            {
                label: t("nav.drivers"),
                icon: <Users width={18} />,
                path: "/haydovchilar",
                allowKey: "hr_drivers_view",
            },
            {
                label: t("nav.tech_base"),
                icon: <Wrench width={18} />,
                path: "/texnik-baza",
                allowKey: "tech_base_view",
            },
            {
                label: t("nav.monitoring"),
                icon: <Activity width={18} />,
                path: "/monitoring",
                extraPaths: ["/route-norms"],
                items: [
                    {
                        label: t("nav.monitoring"),
                        path: "/monitoring",
                        allowKey: "monitoring_view",
                    },
                    {
                        label: t("nav.route_norms"),
                        path: "/route-norms",
                        allowKey: "monitoring_view",
                    },
                ],
            },
            {
                label: t("nav.warehouse"),
                icon: <Boxes width={18} />,
                path: "/ombor",
                allowKey: "warehouse_view",
            },
            ...(investorsV1 ?
                []
            :   [
                    {
                        label: t("nav.finance"),
                        icon: <Coins width={18} />,
                        path: "/moliya",
                        allowKey: "finance_view",
                    },
                ]),
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
                        label: t("nav.documents"),
                        path: "/documents",
                        allowKey: "settings_documents_view",
                    },
                    {
                        label: t("nav.alerts"),
                        path: "/alerts",
                        allowKey: "settings_alerts_view",
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
                        label: t("nav.distributors"),
                        path: "/distributors",
                        allowKey: "settings_distributors_view",
                    },
                    {
                        label: t("nav.truck_types"),
                        path: "/vehicle-types",
                        allowKey: "settings_vehicle_types_view",
                    },
                    {
                        label: t("nav.garage_areas"),
                        path: "/garage-areas",
                        allowKey: "settings_garage_areas_view",
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
        [t, kassaV2, investorsV1],
    )
}
