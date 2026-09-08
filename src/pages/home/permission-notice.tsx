import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

/**
 * "Bu bo'limga ruxsatingiz yo'q" holati (2-raund, RBAC blokidan).
 *
 * Nega kerak: ruxsati yo'q rol sahifani URL orqali ochganda backend 403 qaytaradi,
 * lekin sahifa buni ko'rsatmasdan bo'sh jadval va `0 so'm` kabi NOL raqamlarni
 * chizardi. Nol — ma'lumot, ya'ni yolg'on javob: foydalanuvchi "kassada pul yo'q"
 * deb o'qiydi. Bu komponent farqni ochiq aytadi.
 */
export default function PermissionNotice({
    title = "Bu bo'limga ruxsatingiz yo'q",
    hint = "Kerak bo'lsa administratordan shu bo'lim uchun ruxsat so'rang.",
    className,
}: {
    title?: string
    hint?: string
    className?: string
}) {
    return (
        <div
            role="alert"
            data-testid="permission-notice"
            className={cn(
                "w-full min-h-[40vh] flex flex-col items-center justify-center gap-2 text-center px-4",
                className,
            )}
        >
            <Lock size={40} className="text-muted-foreground" />
            <p className="font-medium">{title}</p>
            <p className="text-sm text-foreground/60 max-w-md">{hint}</p>
        </div>
    )
}
