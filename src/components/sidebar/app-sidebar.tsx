import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"
import * as React from "react"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <div
                className={
                    "flex lg:hidden items-center gap-3 transition-all duration-300 min-w-0 pt-4"
                }
            >
                <SidebarTrigger className="text-gray-500 dark:text-white" />
                <Link to="/">
                    <h1 className="font-bold text-primary text-2xl">GARAJ</h1>
                </Link>
            </div>
            <SidebarContent className="lg:pt-16">
                <NavMain />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
