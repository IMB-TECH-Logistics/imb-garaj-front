import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import "./main.css"
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
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            /**
             * `networkMode: "always"` — so'rov muvaffaqiyatsiz bo'lganda
             * react-query uni `fetchStatus: "paused"` holatiga qo'ymasin.
             *
             * Sukut bo'yicha (`networkMode: "online"`) so'rov yiqilganda va
             * brauzer "oflayn" deb hisoblanganda so'rov PAUZAGA tushardi:
             * `status` "pending" bo'lib qolar, `error` esa `null` bo'lardi —
             * ya'ni `isError` HECH QACHON `true` bo'lmasdi. Natijada butun
             * ilova bo'ylab "xato holati" bloklari o'lik edi va foydalanuvchi
             * cheksiz yuklanish yoki sababsiz bo'sh ekran ko'rardi
             * (masalan /trip da 404 shunday "jimgina yutilgan" edi).
             *
             * "always" bilan xato darhol `isError` ga aylanadi va sahifalar
             * haqiqiy sababni ko'rsata oladi.
             */
            networkMode: "always",
        },
        mutations: {
            networkMode: "always",
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
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>,
    )
}
