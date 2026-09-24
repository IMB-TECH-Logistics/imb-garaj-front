import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { MenuItem, usePaths } from "@/hooks/usePaths"
import { Link, useLocation } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { Fragment, useState } from "react"

export function NavMain() {
    const { toggleSidebar, open: sidebarOpen } = useSidebar()
    const mobile = useIsMobile()
    const location = useLocation()

    const pathname = location.pathname

    const { filteredItems } = usePaths()
    const [openGroup, setOpenGroup] = useState<string | null>(null)

    const hasActivePathDeep = (item: MenuItem, pathname: string): boolean => {
        if (pathname.includes(item.path)) {
            return true
        }

        if (item.extraPaths?.some((p) => pathname.startsWith(p + "/") || pathname === p)) {
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
                    {filteredItems.map(({ label, icon, path, pending, ...item }) => {
                        const isParentActive = hasActivePathDeep(
                            { label, icon, path, ...item },
                            pathname,
                        )
                        const isGroup = mobile && !!item.items?.length
                        const isGroupOpen =
                            isGroup && (openGroup ?? (isParentActive ? label : null)) === label

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
                                        if (isGroup) {
                                            setOpenGroup(isGroupOpen ? "" : label)
                                            return
                                        }
                                        if (mobile) toggleSidebar()
                                    }}
                                >
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                    {isGroup && (
                                        <ChevronDown
                                            size={16}
                                            className={`ml-auto transition-transform ${isGroupOpen ? "rotate-180" : ""}`}
                                        />
                                    )}
                                    
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

                        const children = isGroupOpen ? item.items ?? [] : []

                        return (
                            <Fragment key={label}>
                            {isGroup ? (
                                <div
                                    className={`rounded-lg ${
                                        isParentActive ?
                                            "[&_button]:bg-primary/10  text-primary "
                                        :   ""
                                    }`}
                                >
                                    {content}
                                </div>
                            ) : (
                            <Link
                                to={path}
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
                            )}
                            {children.length > 0 && (
                                <SidebarMenuItem>
                                    <SidebarMenuSub>
                                        {children.map((child) => (
                                            <SidebarMenuSubItem key={child.path}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={hasActivePathDeep(child, pathname)}
                                                >
                                                    <Link
                                                        to={child.path}
                                                        onClick={() => {
                                                            if (mobile) toggleSidebar()
                                                        }}
                                                    >
                                                        <span>{child.label}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </SidebarMenuItem>
                            )}
                            </Fragment>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
