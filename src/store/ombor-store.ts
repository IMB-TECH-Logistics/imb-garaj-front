import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface OmborCategory {
    id: string
    name: string
    unit_label: string
    unit_price: number
    quantity: number
}

interface OmborStore {
    categories: OmborCategory[]
    addCategory: (data: Omit<OmborCategory, "id">) => void
    updateCategory: (id: string, patch: Partial<Omit<OmborCategory, "id">>) => void
    removeCategory: (id: string) => void
}

const initialCategories: OmborCategory[] = [
    {
        id: "solyarka-balon",
        name: "Solyarka (balon)",
        unit_label: "balon",
        unit_price: 850_000,
        quantity: 12,
    },
    {
        id: "avtol",
        name: "Avtol",
        unit_label: "litr",
        unit_price: 35_000,
        quantity: 80,
    },
    {
        id: "boshqalar",
        name: "Boshqalar",
        unit_label: "dona",
        unit_price: 10_000,
        quantity: 100,
    },
]

const uid = () =>
    `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const useOmborStore = create<OmborStore>()(
    persist(
        (set) => ({
            categories: initialCategories,
            addCategory: (data) =>
                set((state) => ({
                    categories: [...state.categories, { ...data, id: uid() }],
                })),
            updateCategory: (id, patch) =>
                set((state) => ({
                    categories: state.categories.map((c) =>
                        c.id === id ? { ...c, ...patch } : c,
                    ),
                })),
            removeCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((c) => c.id !== id),
                })),
        }),
        { name: "ombor-store" },
    ),
)
