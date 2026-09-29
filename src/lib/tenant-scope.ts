import { TENANT_STORAGE_KEY } from "@/services/axios-instance"
import type { AxiosRequestConfig } from "axios"
import { createContext, useContext } from "react"
import { toast } from "sonner"
import { create } from "zustand"

export const ALL_TENANTS = "*"

export const isAllTenantsMode = () =>
    localStorage.getItem(TENANT_STORAGE_KEY) === ALL_TENANTS

export const TenantScopeContext = createContext<string | null>(null)
export const TenantPendingContext = createContext<boolean>(false)

type DialogScope = { id: number; scope: string | null }

type TenantScopeState = {
    rowTenant: string | null
    dialogs: DialogScope[]
    setRowTenant: (tenant: string | null) => void
    upsertDialog: (id: number, scope: string | null) => void
    removeDialog: (id: number) => void
}

export const useTenantScopeStore = create<TenantScopeState>((set) => ({
    rowTenant: null,
    dialogs: [],
    setRowTenant: (rowTenant) => set({ rowTenant }),
    upsertDialog: (id, scope) =>
        set((state) =>
            state.dialogs.some((d) => d.id === id) ?
                {
                    dialogs: state.dialogs.map((d) =>
                        d.id === id ? { id, scope } : d,
                    ),
                }
            :   { dialogs: [...state.dialogs, { id, scope }] },
        ),
    removeDialog: (id) =>
        set((state) => ({
            dialogs: state.dialogs.filter((d) => d.id !== id),
        })),
}))

const TENANT_AGNOSTIC_URL = /^\/?(auth|profile)(\/|$)/

export const isTenantAgnostic = (url: string) => TENANT_AGNOSTIC_URL.test(url)

export const useTenantRequest = (url: string) => {
    const scope = useContext(TenantScopeContext)
    const pending = useContext(TenantPendingContext)
    const top = useTenantScopeStore((s) =>
        s.dialogs.length ? s.dialogs[s.dialogs.length - 1] : null,
    )
    const active = isAllTenantsMode() && !isTenantAgnostic(url)
    if (!active) return { scope: null, pending: false }
    if (scope || pending) return { scope, pending }
    return { scope: top?.scope ?? null, pending: !!top && !top.scope }
}

export const withReadTenant = (
    scope: string | null,
    config?: AxiosRequestConfig,
): AxiosRequestConfig | undefined =>
    scope ?
        { ...config, headers: { ...config?.headers, "X-Tenant": scope } }
    :   config

export const resolveWriteTenant = (scope: string | null) => {
    const { dialogs, rowTenant } = useTenantScopeStore.getState()
    const top = dialogs.length ? dialogs[dialogs.length - 1].scope : null
    return scope ?? top ?? rowTenant
}

export const withWriteTenant = (
    url: string,
    scope: string | null,
    config?: AxiosRequestConfig,
): AxiosRequestConfig | undefined => {
    if (!isAllTenantsMode() || isTenantAgnostic(url)) return config
    const tenant = resolveWriteTenant(scope)
    if (!tenant) {
        toast.error("Avval tenantni tanlang")
        throw new Error("Tenant is not selected")
    }
    return withReadTenant(tenant, config)
}

const PORTAL_SELECTOR = [
    "[role=dialog]",
    "[role=alertdialog]",
    "[role=menu]",
    "[role=listbox]",
    "[data-radix-popper-content-wrapper]",
    "[id^=react-select-]",
].join(",")

export const installRowTenantTracker = () => {
    const handler = (event: PointerEvent) => {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest(PORTAL_SELECTOR)) return
        const tenant =
            target.closest<HTMLElement>("[data-tenant]")?.dataset.tenant ?? null
        useTenantScopeStore.getState().setRowTenant(tenant)
    }
    document.addEventListener("pointerdown", handler, true)
    return () => document.removeEventListener("pointerdown", handler, true)
}
