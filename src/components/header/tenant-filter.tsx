import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AUTH_TENANTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { isAllTenantsMode } from "@/lib/tenant-scope"
import { cn } from "@/lib/utils"
import {
    getTenantFilter,
    TENANT_FILTER_STORAGE_KEY,
} from "@/services/axios-instance"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Filter } from "lucide-react"
import { useState } from "react"

type Tenant = {
    id: number
    name: string
    schema_name: string
}

export function TenantFilter() {
    const allTenants = isAllTenantsMode()
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    const [selected, setSelected] = useState<string[]>(getTenantFilter)
    const { data: tenants } = useGet<Tenant[]>(AUTH_TENANTS, {
        enabled: allTenants,
    })

    if (!allTenants) return null

    const apply = (next: string[]) => {
        setSelected(next)
        if (next.length) {
            localStorage.setItem(TENANT_FILTER_STORAGE_KEY, next.join(","))
        } else {
            localStorage.removeItem(TENANT_FILTER_STORAGE_KEY)
        }
        queryClient.resetQueries()
    }

    const toggle = (schema: string) =>
        apply(
            selected.includes(schema) ?
                selected.filter((s) => s !== schema)
            :   [...selected, schema],
        )

    const names = (tenants ?? [])
        .filter((tn) => selected.includes(tn.schema_name))
        .map((tn) => tn.name)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-9 gap-2 shrink-0 max-w-56",
                        selected.length && "border-primary text-primary",
                    )}
                >
                    <Filter size={16} />
                    <span className="truncate font-medium">
                        {names.length ? names.join(", ") : t("ui.tenant.all_tenant")}
                    </span>
                    <ChevronDown size={14} className="opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 max-h-[70vh] overflow-y-auto">
                <DropdownMenuLabel>{t("ui.tenant.filter_title")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tenants?.map((tenant) => (
                    <DropdownMenuCheckboxItem
                        key={tenant.id}
                        checked={selected.includes(tenant.schema_name)}
                        onCheckedChange={() => toggle(tenant.schema_name)}
                        onSelect={(e) => e.preventDefault()}
                    >
                        {tenant.name}
                    </DropdownMenuCheckboxItem>
                ))}
                {!!selected.length && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => apply([])}>
                            {t("ui.tenant.clear_filter")}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
