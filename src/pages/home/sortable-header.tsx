import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

/**
 * Server tomonda saralaydigan ustun sarlavhasi (2-raund, KT-13 / MT-10 / MR-12).
 *
 * Muammo: `datatable.tsx` ustun sarlavhalarini har doim `cursor-pointer` bilan
 * chizadi va `enableSorting: true` bo'lganda tanstack'ning MIJOZ TOMON saralashini
 * ishlatadi. Server sahifalab berayotganda bu yolg'on javob beradi — faqat joriy
 * 25 qator qayta tartiblanadi, foydalanuvchi esa buni "eng katta summa" deb
 * o'qiydi. Ba'zi ustunlarda esa (masalan Kassadagi "Summa") umuman hech nima
 * bo'lmasdi.
 *
 * Yechim: saralash URL'dagi `?ordering=` parametriga yoziladi va so'rov bilan
 * birga serverga yuboriladi (backend `OrderingFilter` bilan qo'llab-quvvatlaydi).
 * Shunda:
 *   - saralash BUTUN to'plam bo'yicha bo'ladi, joriy sahifa bo'yicha emas;
 *   - holat URL'da qoladi — sahifa yangilansa yo'qolmaydi va havola ulashiladi.
 *
 * Ishlatilishi: ustunda `enableSorting` BERILMASIN (aks holda datatable yana
 * mijoz tomon saralashni ham qo'shib yuboradi), o'rniga:
 *   { accessorKey: "amount", header: () => <SortableHeader field="amount" label="Summa" /> }
 * va sahifa so'roviga `ordering: search.ordering` qo'shilsin.
 */

const cycle = (field: string, current?: string): string | undefined => {
    if (current === field) return `-${field}`
    if (current === `-${field}`) return undefined
    return field
}

export function SortableHeader({
    field,
    label,
    paramName = "ordering",
    className,
}: {
    /** Backend `ordering_fields` ichidagi maydon nomi. */
    field: string
    label: string
    /** URL parametri nomi (bir sahifada ikkita jadval bo'lsa boshqacha bo'ladi). */
    paramName?: string
    className?: string
}) {
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const current = search?.[paramName] as string | undefined
    const dir =
        current === field ? "asc"
        : current === `-${field}` ? "desc"
        : null

    return (
        <button
            type="button"
            onClick={(e) => {
                // Sarlavha katagining o'z onClick'i (datatable) ishlamasin.
                e.stopPropagation()
                const next = cycle(field, current)
                navigate({
                    search: ((prev: Record<string, unknown>) => ({
                        ...prev,
                        [paramName]: next,
                        // Boshqa tartibda 3-sahifada qolib ketish mantiqsiz.
                        page: undefined,
                    })) as any,
                })
            }}
            aria-label={`${label} bo'yicha saralash`}
            aria-sort={
                dir === "asc" ? "ascending"
                : dir === "desc" ? "descending"
                : "none"
            }
            className={cn(
                "inline-flex items-center gap-1 select-none cursor-pointer hover:text-foreground",
                dir ? "text-foreground font-medium" : "text-muted-foreground",
                className,
            )}
        >
            {label}
            {dir === "asc" ?
                <ArrowUp size={14} />
            : dir === "desc" ?
                <ArrowDown size={14} />
            :   <ChevronsUpDown size={14} className="opacity-40" />}
        </button>
    )
}

export default SortableHeader
