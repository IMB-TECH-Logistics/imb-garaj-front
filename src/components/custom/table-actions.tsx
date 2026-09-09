import { cn } from "@/lib/utils"
import {
    Check,
    Edit,
    EllipsisVertical,
    Eye,
    RotateCcw,
    SquarePen,
    Trash2,
    Undo,
} from "lucide-react"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"

type Props = {
    menuMode?: boolean
    onEdit?: () => void
    onDelete?: () => void
    onUndo?: () => void
    onView?: () => void
    onRedo?: () => void
    onFinished?: () => void
    className?: string
}

/**
 * B-86: amal tugmalarida ekran o'quvchi uchun nom yo'q edi.
 *
 * Ikonka-tugmalar ichida matn bo'lmagani uchun ekran o'quvchi ularni
 * shunchaki "button" deb o'qirdi — foydalanuvchi qaysi tugma tahrirlash,
 * qaysi biri o'chirish ekanini bilolmasdi. Endi har bir ikonka-tugmaga
 * o'zbekcha `aria-label` (ekran o'quvchi uchun) va `title` (sichqoncha
 * ostidagi izoh uchun) qo'shildi.
 *
 * Menyu (`menuMode`) shoxobchasidagi bandlarda ko'rinadigan matn allaqachon
 * bor — ekran o'quvchi o'sha matnni o'qiydi, shuning uchun ularga qo'shimcha
 * `aria-label` berilmadi (berilsa ovozli boshqaruvda ko'ringan matn bilan
 * eshitilgan nom bir-biriga mos kelmay qolardi). Nomsiz yagona element —
 * menyuni ochuvchi uchlik — nom oldi.
 */
export default function TableActions({
    menuMode = false,
    onEdit,
    onDelete,
    onUndo,
    onView,
    onRedo,
    onFinished,
    className,
}: Props) {
    return menuMode ?
            <DropdownMenu>
                <DropdownMenuTrigger asChild className={className}>
                    <Button
                        variant="ghost"
                        className="!text-primary size-6 "
                        size={"icon"}
                        aria-label="Amallar menyusi"
                        title="Amallar menyusi"
                        icon={<EllipsisVertical width={16} />}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={1}>
                    {onView && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onView()
                            }}
                            className="!text-green-500"
                        >
                            <Eye width={16} className="mr-1.5" />
                            {"Ko'rish"}
                        </DropdownMenuItem>
                    )}
                    {onEdit && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                            className="!text-primary"
                        >
                            <Edit width={16} className="mr-1.5" />
                            {"Tahrirlash"}
                        </DropdownMenuItem>
                    )}
                    {onDelete && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            className="!text-red-500"
                        >
                            <Trash2 width={16} className="mr-1.5" />{" "}
                            {"O'chirish"}
                        </DropdownMenuItem>
                    )}
                    {onUndo && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onUndo()
                            }}
                            className="!text-red-500"
                        >
                            <Undo width={16} className="mr-1.5" /> {"Qaytarish"}
                        </DropdownMenuItem>
                    )}
                    {onRedo && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onRedo()
                            }}
                            className="!text-muted-foreground"
                        >
                            <RotateCcw width={16} className="mr-1.5" />{" "}
                            {"Hisoblash"}
                        </DropdownMenuItem>
                    )}
                    {onFinished && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onFinished()
                            }}
                            className="!text-muted-foreground"
                        >
                            <Check width={16} className="mr-1.5" /> {"Tugatmoq"}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        :   <div
                className={cn(
                    "flex items-center justify-center gap-3 py-2",
                    className,
                )}
            >
                {onFinished && (
                    <Button
                        icon={<Check className="text-green-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        aria-label="Yakunlash"
                        title="Yakunlash"
                        onClick={(e) => {
                            e.stopPropagation()
                            onFinished()
                        }}
                    ></Button>
                )}
                {onView && (
                    <Button
                        icon={<Eye className="text-green-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        aria-label="Ko'rish"
                        title="Ko'rish"
                        onClick={(e) => {
                            e.stopPropagation()
                            onView()
                        }}
                    ></Button>
                )}
                {onEdit && (
                    <Button
                        icon={<SquarePen className="text-primary" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        aria-label="Tahrirlash"
                        title="Tahrirlash"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                    ></Button>
                )}
                {onDelete && (
                    <Button
                        icon={<Trash2 className="text-red-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        aria-label="O'chirish"
                        title="O'chirish"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                    ></Button>
                )}
                {onUndo && (
                    <Button
                        icon={<Undo className="text-red-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        aria-label="Qaytarish"
                        title="Qaytarish"
                        onClick={(e) => {
                            e.stopPropagation()
                            onUndo()
                        }}
                    ></Button>
                )}
                {onRedo && (
                    <Button
                        icon={<RotateCcw size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        aria-label="Qayta tiklash"
                        title="Qayta tiklash"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRedo()
                        }}
                    ></Button>
                )}
            </div>
}
