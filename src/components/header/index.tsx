import { usePaths } from "@/hooks/usePaths"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import { NavUser } from "../sidebar/nav-user"
import { SidebarTrigger, useSidebar } from "../ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { ThemeColorToggle } from "./color-toggle"
import ParamDateRange from "@/components/as-params/date-picker-range"

const Header = () => {
    const { open } = useSidebar()
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { childPaths } = usePaths()
    const { isMobile } = useSidebar()

    const activeTab = useMemo(() => {
        // Find the matching tab for nested routes (e.g. /manager-trips/123 -> /managers)
        const exact = childPaths.find((c) => c.path === pathname)
        if (exact) return exact.path

        const match = childPaths.find(
            (c) =>
                pathname.startsWith(c.path + "/") ||
                c.extraPaths?.some(
                    (p) => pathname === p || pathname.startsWith(p + "/"),
                ),
        )
        return match?.path ?? pathname
    }, [childPaths, pathname])

    return (
        <header className="p-2 gap-4 flex items-center justify-between bg-card border-b border-border max-w-full box-border">
            <div className="flex items-center xl:gap-6 max-w-full overflow-x-auto custom-scrollbar">
                <div
                    className={cn(
                        "flex items-center gap-3 transition-all duration-300 min-w-0",
                        open && "min-w-[13rem]",
                    )}
                >
                    <SidebarTrigger className="text-gray-500 dark:text-white" />
                    <h1 className="font-bold text-primary text-2xl ">
                        GARAJ
                    </h1>
                </div>
                {!!childPaths.length && (
                    <Tabs
                        className="hidden xl:flex overflow-x-auto custom-scrollbar max-w-full"
                        value={activeTab}
                        onValueChange={(path) => navigate({ to: path })}
                    >
                        <TabsList className="gap-2 bg-transparent ">
                            {childPaths?.map((link) => (
                                <TabsTrigger key={link.label} value={link.path}>
                                    {link.icon} {link.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}
            </div>

            <hgroup className="flex items-center gap-2 sm:gap-4">
                {pathname.startsWith("/moliya") && (
                    <ParamDateRange
                        from="from_date"
                        to="to_date"
                        addButtonProps={{
                            className: "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                        }}
                    />
                )}
                <div className="flex sm:gap-2">
                    <ThemeColorToggle />
                </div>
                {isMobile && <NavUser />}
            </hgroup>
        </header>
    )
}

export default Header
