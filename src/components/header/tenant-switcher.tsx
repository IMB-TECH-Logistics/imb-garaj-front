import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AUTH_TENANTS } from "@/constants/api-endpoints"
import { useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { TENANT_STORAGE_KEY } from "@/services/axios-instance"
import { Building2, Check, ChevronDown } from "lucide-react"

type Tenant = {
    id: number
    name: string
    schema_name: string
    is_active: boolean
    paid_until: string | null
    domain: string | null
}

export function TenantSwitcher() {
    const { data: user } = useUser()
    const isGlobalAdmin = !!user?.is_global_admin
    const { data: tenants, isLoading } = useGet<Tenant[]>(AUTH_TENANTS, {
        enabled: isGlobalAdmin,
    })

    if (!isGlobalAdmin) return null

    const current = user?.tenant?.schema_name

    const selectTenant = (schemaName: string) => {
        if (schemaName === current) return
        localStorage.setItem(TENANT_STORAGE_KEY, schemaName)
        window.location.reload()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 shrink-0 max-w-56">
                    <Building2 size={16} />
                    <span className="hidden sm:inline text-xs text-muted-foreground">Tenantlar:</span>
                    <span className="truncate font-medium">{user?.tenant?.name ?? "—"}</span>
                    <ChevronDown size={14} className="opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Tenantlar</span>
                    <span className="text-xs font-normal text-muted-foreground">{tenants?.length ?? 0}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading && (
                    <div className="px-2 py-3 text-sm text-muted-foreground">Yuklanmoqda...</div>
                )}
                {tenants?.map((tenant) => {
                    const selected = tenant.schema_name === current
                    return (
                        <DropdownMenuItem
                            key={tenant.id}
                            onClick={() => selectTenant(tenant.schema_name)}
                            className={cn("flex items-center gap-2", selected && "bg-accent")}
                        >
                            <Check size={14} className={cn("shrink-0", !selected && "invisible")} />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate font-medium">{tenant.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {tenant.domain ?? tenant.schema_name}
                                </span>
                            </div>
                            {!tenant.is_active && (
                                <span className="text-[10px] rounded px-1.5 py-0.5 bg-destructive/15 text-destructive">
                                    Nofaol
                                </span>
                            )}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
