import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

/**
 * MT-14: URL da diapazondan tashqari sahifa raqami berilganda (masalan ?page=9999)
 * backend 404 qaytaradi va foydalanuvchi "Ro'yxat 0" + bo'sh jadval ko'radi —
 * go'yo ma'lumot umuman yo'qdek. Bu banner sababni aytadi va 1-sahifaga qaytaradi.
 */
export default function OutOfRangePageNotice({
    onReset,
}: {
    onReset: () => void
}) {
    return (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
                <div className="text-sm">
                    <div className="font-medium">Bunday sahifa yo'q</div>
                    <div className="text-[12px] text-muted-foreground">
                        So'ralgan sahifa raqami mavjud sahifalar sonidan katta.
                        Ro'yxat bo'sh emas — 1-sahifaga qayting.
                    </div>
                </div>
            </div>
            <Button size="sm" variant="outline" onClick={onReset}>
                1-sahifaga qaytish
            </Button>
        </div>
    )
}
