import { Link, useLocation } from "@tanstack/react-router"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../ui/breadcrumb"
import { Fragment, ReactNode, useMemo } from "react"
import { useItems } from "@/hooks/usePaths"
import { useGlobalStore } from "@/store/global-store"

type BreadcrumbEntry = {
    label: string
    path?: string
    /** Key to resolve dynamic path from global store */
    storeKey?: string
    /** Build path from stored value */
    buildPath?: (storedValue: any) => string | undefined
}

// Explicit breadcrumb trails for nested routes.
// More specific paths must come first.
const nestedBreadcrumbs: { prefix: string; trail: BreadcrumbEntry[] }[] = [
    {
        prefix: "/manager-trips/manager-reys",
        trail: [
            { label: "Meneger", path: "/managers" },
            {
                label: "Aylanmalar",
                storeKey: "manager-trips-vehicle-id",
                buildPath: (vehicleId) =>
                    vehicleId ? `/manager-trips/${vehicleId}` : undefined,
            },
            { label: "Reyslar" },
        ],
    },
    {
        prefix: "/manager-trips",
        trail: [
            { label: "Meneger", path: "/managers" },
            { label: "Aylanmalar" },
        ],
    },
    {
        prefix: "/truck-detail",
        trail: [{ label: "Investor", path: "/truck" }],
    },
    {
        prefix: "/orders",
        trail: [
            { label: "Investor", path: "/truck" },
            { label: "Buyurtmalar" },
        ],
    },
]

export function useBreadcrumbs() {
    const { pathname } = useLocation()
    const items = useItems()
    const { getData } = useGlobalStore()

    return useMemo(() => {
        // Check explicit nested configs first (most specific prefix wins)
        for (const config of nestedBreadcrumbs) {
            if (
                pathname === config.prefix ||
                pathname.startsWith(config.prefix + "/")
            ) {
                return config.trail.map((entry) => {
                    if (entry.buildPath && entry.storeKey) {
                        const storedValue = getData(entry.storeKey)
                        const resolved = entry.buildPath(storedValue)
                        return { ...entry, path: resolved }
                    }
                    return entry
                })
            }
        }

        // Auto-derive from menu items for any other nested paths
        for (const group of items) {
            if (group.items) {
                for (const item of group.items) {
                    const isNestedViaExtra = item.extraPaths?.some(
                        (p) =>
                            pathname.startsWith(p + "/") &&
                            pathname !== item.path,
                    )
                    if (isNestedViaExtra) {
                        return [
                            {
                                label: group.label,
                                path:
                                    group.items?.[0]?.path || group.path,
                            },
                        ]
                    }
                }
            }
        }

        return []
    }, [pathname, items, getData])
}

/**
 * Inline breadcrumb for page headers.
 * Renders the breadcrumb trail with optional trailing content (badge, name, etc.)
 */
export function InlineBreadcrumb({ trailing }: { trailing?: ReactNode }) {
    const trail = useBreadcrumbs()

    if (trail.length === 0) return null

    return (
        <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
                {trail.map((item, index) => {
                    const isLast = index === trail.length - 1
                    return (
                        <Fragment key={index}>
                            <BreadcrumbItem>
                                {item.path ? (
                                    <BreadcrumbLink
                                        asChild
                                        className={
                                            isLast
                                                ? "text-foreground font-medium text-base"
                                                : undefined
                                        }
                                    >
                                        <Link to={item.path}>
                                            {item.label}
                                        </Link>
                                    </BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage
                                        className={
                                            isLast
                                                ? "font-medium text-base"
                                                : "font-normal text-muted-foreground"
                                        }
                                    >
                                        {item.label}
                                    </BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                            {(!isLast || trailing) && (
                                <BreadcrumbSeparator />
                            )}
                        </Fragment>
                    )
                })}
                {trailing && (
                    <BreadcrumbItem className="text-sm text-primary font-medium">
                        {trailing}
                    </BreadcrumbItem>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

/**
 * Standalone breadcrumb shown above page content (used in _main layout).
 */
export function PageBreadcrumb() {
    const trail = useBreadcrumbs()

    if (trail.length === 0) return null

    return (
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                {trail.map((item, index) => {
                    const isLast = index === trail.length - 1
                    return (
                        <Fragment key={index}>
                            <BreadcrumbItem>
                                {item.path ? (
                                    <BreadcrumbLink
                                        asChild
                                        className={
                                            isLast
                                                ? "text-foreground font-medium"
                                                : undefined
                                        }
                                    >
                                        <Link to={item.path}>
                                            {item.label}
                                        </Link>
                                    </BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage
                                        className={
                                            isLast
                                                ? "font-medium"
                                                : "font-normal text-muted-foreground"
                                        }
                                    >
                                        {item.label}
                                    </BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
