import { TenantSelect } from "@/components/custom/tenant-scope-boundary"
import Forbidden from "@/components/custom/forbidden"
import Header from "@/components/header"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { SEARCH_KEY } from "@/constants/default"
import { cn } from "@/lib/utils"
import {
    installRowTenantTracker,
    isAllTenantsMode,
    TenantPendingContext,
    TenantScopeContext,
    useTenantScopeStore,
} from "@/lib/tenant-scope"
import { usePaths } from "@/hooks/usePaths"
import { useUser } from "@/constants/useUser"
import {
    createFileRoute,
    Outlet,
    redirect,
    useLocation,
    useNavigate,
    useParams,
    useSearch,
} from "@tanstack/react-router"
import { useEffect, useRef } from "react"

export const Route = createFileRoute("/_main")({
    component: MainLayout,
    beforeLoad: () => {
        const token = localStorage.getItem("token")
        if (!token) {
            throw redirect({
                to: "/auth",
            })
        }
    },
    validateSearch: (s: { [SEARCH_KEY]?: string; tenant?: string }) => s,
})

function TenantScopedOutlet() {
    const { pathname } = useLocation()
    const params = useParams({ strict: false })
    const search = useSearch({ from: "/_main" })
    const navigate = useNavigate()
    const rowTenant = useTenantScopeStore((s) => s.rowTenant)
    const lastTenant = useRef<string | null>(null)

    const isDetail = Object.keys(params).length > 0
    const tenant = search.tenant ?? null
    const fallback = isDetail && !tenant ? (rowTenant ?? lastTenant.current) : null

    const setTenant = (next: string) =>
        navigate({
            replace: true,
            search: (prev: Record<string, unknown>) => ({
                ...prev,
                tenant: next,
            }),
        } as any)

    useEffect(() => {
        if (!isDetail) {
            lastTenant.current = null
            return
        }
        if (tenant) {
            lastTenant.current = tenant
            return
        }
        if (fallback) setTenant(fallback)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDetail, tenant, pathname])

    return (
        <TenantScopeContext.Provider value={isDetail ? tenant : null}>
            <TenantPendingContext.Provider value={isDetail && !tenant}>
                {isDetail && !tenant && !fallback && (
                    <div className="mb-4 max-w-xs">
                        <TenantSelect value={null} onChange={setTenant} />
                    </div>
                )}
                <Outlet />
            </TenantPendingContext.Provider>
        </TenantScopeContext.Provider>
    )
}

function MainLayout() {
    const { pathname } = useLocation()
    const { isDeniedPath } = usePaths()
    const denied = isDeniedPath(pathname)
    const { isLoading: isProfileLoading } = useUser()
    const allTenants = isAllTenantsMode()

    useEffect(() => {
        if (!allTenants) return
        return installRowTenantTracker()
    }, [allTenants])

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
                <div className="w-full h-full overflow-y-auto">
                    <div
                        className={cn(
                            "fixed top-0 right-0 z-30 transition-[width,height,padding] w-full",
                        )}
                    >
                        <Header />
                    </div>

                    <main
                        className={cn(
                            "mx-auto p-4 h-full overflow-y-auto   pt-20 flex flex-col pb-10",
                        )}
                    >
                        {isProfileLoading ? null
                        : denied ?
                            <Forbidden />
                        : allTenants ?
                            <TenantScopedOutlet />
                        :   <Outlet />}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default MainLayout
