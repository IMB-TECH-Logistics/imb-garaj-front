import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { MenuItem, useItems, usePaths } from "@/hooks/usePaths"
import { Link, useLocation } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"

export function NavMain() {
    const { toggleSidebar, open: sidebarOpen } = useSidebar()
    const mobile = useIsMobile()
    const location = useLocation()

    const pathname = location.pathname

    const { filteredItems } = usePaths()
    const allPaths = useItems()

    const hasActivePathDeep = (item: MenuItem, pathname: string): boolean => {
        if (pathname.includes(item.path)) {
            return true
        }

        if (item.items && item.items.length > 0) {
            return item.items.some((child) =>
                hasActivePathDeep(child, pathname),
            )
        }

        return false
    }

    return (
        <SidebarGroup className={"h-full"}>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    <SidebarMenuItem className="mb-3 lg:hidden">
                        <div className="flex  items-center min-w-[180px]">
                            <SidebarTrigger className="text-gray-500 dark:text-white" />
                            <Link
                                className="flex justify-start  items-center gap-1"
                                color="foreground"
                                to="/"
                            >
                                <img
                                    alt="logo"
                                    src="/images/logo.png"
                                    width={40}
                                />
                                <p className="font-bold text-inherit whitespace-nowrap">
                                    IMB HR
                                </p>
                            </Link>
                        </div>
                    </SidebarMenuItem>
                    {allPaths.map(({ label, icon, path, pending, ...item }) => {
                        const isParentActive = hasActivePathDeep(
                            { label, icon, path, ...item },
                            pathname,
                        )

                        const content = (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    className={`flex items-center gap-4 ${pending ? "opacity-60 cursor-not-allowed hover:bg-transparent" : ""}`}
                                    tooltip={label}
                                    onClick={(e) => {
                                        if (pending) {
                                            e.preventDefault()
                                            return
                                        }
                                        if (mobile) toggleSidebar()
                                    }}
                                >
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                    
                                    {pending && (
                                        <Badge variant="secondary" className="ml-auto text-[10px] bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 leading-none py-0 px-2 border-none font-bold">
                                            Pending
                                        </Badge>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )

                        if (pending) {
                            return <div key={label}>{content}</div>
                        }

                        return (
                            <Link
                                to={path}
                                key={label}
                                activeProps={{
                                    className:
                                        "[&_button]:bg-primary/10   hover:[&_button]:bg-primary/10  hover:[&_button]:text-primary  text-primary ",
                                }}
                                className={`rounded-lg ${
                                    isParentActive ?
                                        "[&_button]:bg-primary/10  text-primary "
                                    :   ""
                                }`}
                            >
                                {content}
                            </Link>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
