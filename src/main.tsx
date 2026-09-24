import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { I18nextProvider } from "react-i18next"
import "./main.css"
import i18n from "@/i18n/i18n"
import { handleFormError } from "@/lib/show-form-errors"
import { routeTree } from "./routeTree.gen"

const RELOAD_KEY = "vite:chunk-reload"

const reloadOnce = () => {
    if (sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.removeItem(RELOAD_KEY)
        return
    }
    sessionStorage.setItem(RELOAD_KEY, "1")
    window.location.reload()
}

window.addEventListener("vite:preloadError", () => reloadOnce())

window.addEventListener("unhandledrejection", (event) => {
    const msg = String(event.reason?.message ?? event.reason ?? "")
    if (
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /Loading chunk \S+ failed/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg)
    ) {
        reloadOnce()
    }
})

const queryClient = new QueryClient({
    mutationCache: new MutationCache({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any, _variables, _context, mutation) => {
            const status = error?.response?.status
            if (status === 401 || status === 403) return
            if (mutation.options.onError || mutation.meta?.skipGlobalError) return
            handleFormError(error)
        },
    }),
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    },
})

const router = createRouter({
    routeTree,
    defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </I18nextProvider>,
    )
}
