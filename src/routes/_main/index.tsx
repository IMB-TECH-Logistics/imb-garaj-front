import { useUser } from "@/constants/useUser"
import { usePaths } from "@/hooks/usePaths"
import PermissionNotice from "@/pages/home/permission-notice"
import { createFileRoute, Navigate } from "@tanstack/react-router"

/**
 * Kirish sahifasi (2-raund, RBAC yangi Low-5).
 *
 * Ilgari bu yerda shartsiz `redirect({ to: "/managers" })` bor edi. Natijada
 * 0 ruxsatli rol (Driver) kirgach darhol `/manager/vehicles/` 403 xatosi va
 * bo'sh ro'yxatga tushardi — yon menyu ham bo'sh bo'lgani uchun u yerdan
 * hech qayerga o'tolmasdi (boshi berk ko'cha).
 *
 * Endi manzil roldan kelib chiqadi: menyuda ruxsat berilgan BIRINCHI bo'lim
 * ochiladi (ota-band bo'lsa `usePaths` uni ruxsat berilgan birinchi bolaga
 * yo'naltirib qo'ygan). Birorta ochiq bo'lim bo'lmasa — 403 xatosi o'rniga
 * tushunarli xabar ko'rsatiladi.
 *
 * Redirect `beforeLoad` dan komponentga ko'chdi, chunki ruxsatlar profil
 * so'rovidan (`useUser`) keladi va uni loader ichida o'qib bo'lmaydi.
 */
export const Route = createFileRoute("/_main/")({
    component: MainIndex,
})

function MainIndex() {
    const { data: profile, isLoading } = useUser()
    const { filteredItems } = usePaths()

    // Profil kelmaguncha hech qayerga yo'naltirilmaydi — aks holda ruxsati BOR
    // foydalanuvchi ham bir lahza "ruxsat yo'q" ekranini ko'rardi.
    if (isLoading || !profile) return null

    const firstAllowed = filteredItems[0]?.path

    if (!firstAllowed) {
        return (
            <PermissionNotice
                title="Veb-panelda sizga ochiq bo'lim yo'q"
                hint="Rolingizga birorta bo'lim uchun ruxsat berilmagan. Haydovchilar odatda mobil ilovada ishlaydi. Veb-panel kerak bo'lsa administratorga murojaat qiling."
            />
        )
    }

    return <Navigate to={firstAllowed as never} replace />
}
