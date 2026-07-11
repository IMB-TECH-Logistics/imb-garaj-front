"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { PROFILE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { EllipsisVertical, LogOut } from "lucide-react"

export function NavUser() {
    const navigate = useNavigate()
    const { data: user } = useGet<User>(PROFILE)
    const { isMobile } = useSidebar()

    const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
        user?.username ||
        "Super Admin"

    const logOut = () => {
        localStorage.clear()
        navigate({ to: "/auth" })
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar
                                className={cn(
                                    "h-8 w-8 rounded-lg bg-primary/10",
                                    isMobile && "h-10 w-10",
                                )}
                            >
                                <AvatarImage
                                    src={undefined}
                                    alt={fullName}
                                />
                                <AvatarFallback className="rounded-lg uppercase">
                                    {fullName.slice(0, 2) || "SA"}
                                </AvatarFallback>
                            </Avatar>
                            {!isMobile && (
                                <>
                                    <div className="lg:grid hidden flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {fullName}
                                        </span>
                                        <span className="text-muted-foreground truncate text-xs">
                                            {user?.role_name}
                                        </span>
                                    </div>
                                    <EllipsisVertical className="ml-auto size-4" />
                                </>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={undefined}
                                        alt={fullName}
                                    />
                                    <AvatarFallback className="rounded-lg uppercase">
                                        {fullName.slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {fullName}
                                    </span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {user?.role_name}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={logOut}
                            className="text-destructive"
                        >
                            <LogOut size={16} />
                            <span className="ml-2">Chiqish</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
