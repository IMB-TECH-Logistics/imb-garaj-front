import { createLazyFileRoute, Navigate } from "@tanstack/react-router"

/**
 * YANGI-B: bu yerda TanStack Router generatori qoldirgan bo'sh shablon turardi
 * va URL ni bilgan foydalanuvchi ekranda "Hello /_main/_managers/transports/!"
 * yozuvini ko'rardi. Menyuda "Transportlar" tabi allaqachon `/managers` ga
 * olib boradi, ya'ni bu manzilning o'z mazmuni yo'q — shuning uchun sahifa
 * o'sha ro'yxatga yo'naltiriladi (`replace` bilan, orqaga qaytish halqaga
 * tushmasligi uchun).
 */
export const Route = createLazyFileRoute("/_main/_managers/transports/")({
    component: () => <Navigate to="/managers" replace />,
})
