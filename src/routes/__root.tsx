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
    /**
     * 404 sahifasi faqat inglizcha edi ("Not found", "Back to home page"),
     * holbuki butun tizim o'zbek tilida. Matnlar o'zbekchaga o'girildi va
     * nima bo'lganini tushuntiruvchi bir qator qo'shildi.
     */
    notFoundComponent: () => {
        return (
            <main className="grid place-items-center h-screen w-full bg-primary-foreground">
                <div className="shadow rounded-md p-6 flex flex-col gap-3 max-w-md text-center">
                    <Badge
                        variant={"destructive"}
                        className="text-center justify-center"
                    >
                        Sahifa topilmadi
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                        Siz so'ragan sahifa mavjud emas yoki manzil noto'g'ri
                        yozilgan bo'lishi mumkin.
                    </p>
                    <Link to="/">
                        <Button className="w-full">Bosh sahifaga qaytish</Button>
                    </Link>
                    <Link to="/auth">
                        <Button variant="outline" className="w-full">
                            Kirish sahifasiga o'tish
                        </Button>
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
                    <Toaster />
                </ThemeDataProvider>
            </ThemeProvider>
            <ScrollRestoration getKey={(location) => location.pathname} />
        </ModalProvider>
    )
}
