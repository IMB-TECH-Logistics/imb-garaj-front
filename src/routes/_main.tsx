import Forbidden from "@/components/custom/forbidden"
import Header from "@/components/header"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { SEARCH_KEY } from "@/constants/default"
import { cn } from "@/lib/utils"
import { usePaths } from "@/hooks/usePaths"
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router"

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
    validateSearch: (s: { [SEARCH_KEY]?: string }) => s,
})

function MainLayout() {
    const { pathname } = useLocation()
    const { isDeniedPath } = usePaths()
    const denied = isDeniedPath(pathname)

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
                        {denied ? <Forbidden /> : <Outlet />}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default MainLayout
