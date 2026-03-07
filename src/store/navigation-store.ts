import { create } from "zustand";
import { persist } from "zustand/middleware";

type NavigationStore = {
    
    paths: Record<string, string | undefined>;
    search: Record<string, string | undefined>;
    add: (pathKey: string) => void;
    remove: (pathKey: string) => void;
};

export const useNavigationStore = create<NavigationStore>()(
    persist(
        (set) => ({
            paths: {},
            search: {},
            add: (pathKey) => {
                set((state) => ({
                    search: {
                        ...state.search,
                        [pathKey]: window.location.search
                    },
                    paths: { ...state.paths, [pathKey]: window.location.pathname },
                }));
            },
            remove: (pathKey) =>
                set((state) => {
                    const newPaths = { ...state.paths };
                    const newSearch = { ...state.search };
                    delete newPaths[pathKey];
                    delete newSearch[pathKey];
                    return { paths: newPaths, search: newSearch };
                }),
        }),
        {
            name: "navigation-storage", // localStorage key
        }
    )
);
