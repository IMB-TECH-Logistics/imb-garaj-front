import { create } from "zustand"
import { persist } from "zustand/middleware"

export const ROUTE_CONFIG_KEY = "route-config-item"

export type RouteConfig = {
    id: string
    client: number | null
    loading: number | null
    unloading: number | null
    cargo_type: number | null
    payment_type: number | null
    currency: number | null
    amount: string | null
}

type RouteConfigsStore = {
    items: RouteConfig[]
    add: (item: Omit<RouteConfig, "id">) => void
    update: (id: string, patch: Omit<RouteConfig, "id">) => void
    remove: (id: string) => void
}

const generateId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ?
        crypto.randomUUID()
    :   `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const useRouteConfigsStore = create<RouteConfigsStore>()(
    persist(
        (set) => ({
            items: [],
            add: (item) =>
                set((state) => ({
                    items: [...state.items, { ...item, id: generateId() }],
                })),
            update: (id, patch) =>
                set((state) => ({
                    items: state.items.map((it) =>
                        it.id === id ? { ...it, ...patch, id } : it,
                    ),
                })),
            remove: (id) =>
                set((state) => ({
                    items: state.items.filter((it) => it.id !== id),
                })),
        }),
        { name: "route-configs-store" },
    ),
)
