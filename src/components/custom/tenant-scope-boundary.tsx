import Select from "@/components/ui/select"
import { AUTH_TENANTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import {
    isAllTenantsMode,
    TenantPendingContext,
    TenantScopeContext,
    useTenantScopeStore,
} from "@/lib/tenant-scope"
import { ReactNode, useContext, useEffect, useLayoutEffect, useState } from "react"

type Tenant = {
    id: number
    name: string
    schema_name: string
    is_active: boolean
}

let dialogCounter = 0

export function TenantSelect({
    value,
    onChange,
}: {
    value: string | null
    onChange: (schema: string) => void
}) {
    const { data: tenants } = useGet<Tenant[]>(AUTH_TENANTS)

    return (
        <div className="flex flex-col gap-1 pr-10">
            <span className="text-xs text-muted-foreground">
                Tenant <span className="text-destructive">*</span>
            </span>
            <Select
                value={value}
                setValue={onChange}
                options={(tenants ?? []).filter((t) => t.is_active)}
                label="Tenantni tanlang"
                labelKey="name"
                valueKey="schema_name"
                className="h-9"
            />
        </div>
    )
}

function Scoped({ children }: { children: ReactNode }) {
    const parent = useContext(TenantScopeContext)
    const [initial] = useState(
        () => parent ?? useTenantScopeStore.getState().rowTenant,
    )
    const [scope, setScope] = useState<string | null>(initial)
    const [id] = useState(() => ++dialogCounter)
    const upsertDialog = useTenantScopeStore((s) => s.upsertDialog)
    const removeDialog = useTenantScopeStore((s) => s.removeDialog)

    useLayoutEffect(() => {
        upsertDialog(id, scope)
    }, [id, scope, upsertDialog])

    useEffect(() => () => removeDialog(id), [id, removeDialog])

    return (
        <TenantScopeContext.Provider value={scope}>
            <TenantPendingContext.Provider value={!scope}>
                {!initial && <TenantSelect value={scope} onChange={setScope} />}
                {children}
            </TenantPendingContext.Provider>
        </TenantScopeContext.Provider>
    )
}

export function TenantScopeBoundary({ children }: { children: ReactNode }) {
    if (!isAllTenantsMode()) return <>{children}</>
    return <Scoped>{children}</Scoped>
}
