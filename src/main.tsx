import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ErrorComponent, RouterProvider, createRouter } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { I18nextProvider } from "react-i18next"
import "./main.css"
import i18n from "@/i18n/i18n"
import { handleFormError, handleQueryError } from "@/lib/show-form-errors"
import { routeTree } from "./routeTree.gen"

const RELOAD_KEY = "vite:chunk-reload"

const RELOAD_GAP_MS = 30000

const reloadOnce = () => {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last < RELOAD_GAP_MS) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    window.location.reload()
}

const isChunkError = (error: unknown) => {
    const msg = String((error as { message?: string })?.message ?? error ?? "")
    return (
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /Loading chunk \S+ failed/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg)
    )
}

window.addEventListener("vite:preloadError", () => reloadOnce())

window.addEventListener("unhandledrejection", (event) => {
    if (isChunkError(event.reason)) reloadOnce()
})

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            if (query.meta?.skipGlobalError) return
            handleQueryError(error)
        },
    }),
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
            // 400/401/403/404 — qayta so'rash natijani o'zgartirmaydi (masalan ruxsat yo'q),
            // faqat xabarni 5–7 s kechiktiradi va so'rovlarni ko'paytiradi. 5xx/tarmoq — avvalgidek.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            retry: (count, error: any) =>
                count < 3 &&
                error?.code !== "ECONNABORTED" &&
                ![400, 401, 403, 404].includes(error?.response?.status),
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    },
})

const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: ({ error }) => {
        if (isChunkError(error)) reloadOnce()
        return <ErrorComponent error={error} />
    },
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
