import { Toaster } from "@/components/ui/sonner"
import {
    Link,
    Outlet,
    ScrollRestoration,
    createRootRoute,
} from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ThemeDataProvider from "@/layouts/color"
import { ConfirmProvider } from "@/layouts/confirm"
import { PromptProvider } from "@/layouts/prompt"
import { PromptWithCauseProvider } from "@/layouts/prompt-with-causer"
import { ThemeProvider } from "@/layouts/theme"
import { ViewProvider } from "@/layouts/view"
import { ModalProvider } from "@/providers/modal-provider"

export const Route = createRootRoute({
    component: RootComponent,
    validateSearch: (search: SearchParams): SearchParams => {
        return {
            page: search?.page ?? undefined,
            page_size: search?.page_size ?? undefined,
        }
    },
    notFoundComponent: () => {
        return (
            <main className="grid place-items-center h-screen w-full bg-primary-foreground">
                <div className="shadow rounded-md p-4 flex flex-col gap-2">
                    <Link to="/">
                        <Button>Back to home page</Button>
                    </Link>
                    <Badge
                        variant={"destructive"}
                        className="text-center justify-center"
                    >
                        Not found
                    </Badge>
                    <Link to="/auth">
                        <Button>Back to login page</Button>
                    </Link>
                </div>
            </main>
        )
    },
})

function RootComponent() {
    return (
        <ModalProvider>
            <ThemeProvider defaultTheme="dark" storageKey="theme">
                <ThemeDataProvider>
                    <ConfirmProvider>
                        <PromptProvider>
                            <PromptWithCauseProvider>
                                <ViewProvider>
                                    <Outlet />
                                </ViewProvider>
                            </PromptWithCauseProvider>
                        </PromptProvider>
                    </ConfirmProvider>
                    <Toaster position="top-center" />
                </ThemeDataProvider>
            </ThemeProvider>
            <ScrollRestoration getKey={(location) => location.pathname} />
        </ModalProvider>
    )
}
