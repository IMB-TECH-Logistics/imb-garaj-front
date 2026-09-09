import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DatePickerWithRange } from "../form/date-range-picker";
import { useEffect } from "react";
import { ButtonProps } from "../ui/button";

interface IProps {
    name?: string;
    dateFormat?: string;
    className?: string;
    date?: DateRange | undefined;
    setDate?: SelectRangeEventHandler;
    disabled?: boolean;
    from?: string;
    to?: string;
    defaultValue?: DateRange | undefined;
    clearable?: boolean
     addButtonProps?: ButtonProps
}

export default function ParamDateRange({
    name = "date",
    dateFormat = "yyy-MM-dd",
    className,
    from = "from",
    to = "to",
    disabled,
    defaultValue,
    clearable = true,
    addButtonProps,
    ...props
}: IProps) {
    const navigate = useNavigate();
    const search: any = useSearch({ from: "/_main" }) as Record<
        string,
        string | undefined
    >;

    const fromDateString = search[from];
    const toDateString = search[to];

    /**
     * Diapazonni URL uchun ikki qiymatga aylantirish.
     *
     * NEGA `to` ALOHIDA HISOBLANADI: taqvimda BITTA kun tanlanganda
     * react-day-picker `{ from: kun, to: undefined }` qaytaradi. Ilgari shu
     * `undefined` URL ga yozilmasdan tashlab yuborilardi va manzilda yolg'iz
     * `from_date` qolardi. Backend uni "shu sanadan BOSHLAB" deb o'qiydi —
     * ya'ni foydalanuvchi bitta kunni so'raganda javobda butun oy kelardi.
     *
     * Shuning uchun oxiri berilmagan diapazon "o'sha bitta kun" deb yopiladi:
     * `to = from`. Diapazon tanlash buzilmaydi — taqvim to'liq diapazonni
     * (`from` va `to` ikkalasini) bergan zahoti o'sha qiymatlar yoziladi.
     */
    const rangeToSearch = (range: DateRange | undefined) => {
        const start = range?.from;
        const end = range?.to ?? range?.from;
        return {
            [from]: start ? format(start, dateFormat) : undefined,
            [to]: end ? format(end, dateFormat) : undefined,
        };
    };

    useEffect(() => {
        if (defaultValue && !fromDateString && !toDateString) {
            navigate({
                search: {
                    ...search,
                    ...rangeToSearch(defaultValue),
                },
                replace: true,
            });
        }
    }, [fromDateString, toDateString]);

    const parsedDate: DateRange | undefined = {
        from: fromDateString ? new Date(fromDateString) : undefined,
        to: toDateString ? new Date(toDateString) : undefined,
    };

    /**
     * B-79 tuzatildi: bitta kunni ikki marta bosish filtrni JIMGINA bekor qilardi.
     *
     * NIMA BUZUQ EDI: react-day-picker `range` rejimida allaqachon tanlangan
     * kun qayta bosilsa, tanlov `undefined` bo'lib qaytadi. Diapazon tanlash
     * odati bo'yicha foydalanuvchi bitta kunni ikki marta bosadi (avval
     * "boshlanish", keyin "tugash" deb) — natijada `date_from`/`date_to` URL
     * dan yo'qolib, tugma yana "Kunlarni tanlang" bo'lardi va ro'yxat hech
     * qanday ogohlantirishsiz butun bazaga qaytardi.
     *
     * NEGA SHUNDAY TUZATILDI: tanlov `undefined` bo'lib qaytganda oldingi
     * holat tekshiriladi. Agar u BITTA kun bo'lgan bo'lsa (`to` yo'q yoki
     * `from` bilan bir xil kun) — bu aynan "o'sha kunni ikkinchi marta bosish"
     * holati, shuning uchun tozalash o'rniga o'sha kun bir kunlik oraliq
     * (`from` = `to`) bo'lib saqlanadi.
     *
     * Ikki xil kun tanlangan HAQIQIY diapazonda avvalgi xatti-harakat
     * o'zgarmaydi, ya'ni oddiy diapazon tanlash buzilmaydi. Filtrdan butunlay
     * chiqish yo'li ham joyida qoladi — o'ngdagi X tugmasi (`reset`) hamon
     * `from`/`to` ni tozalaydi.
     */
    const keepSingleDay = (range: DateRange | undefined) => {
        if (range) return range

        const prevFrom = parsedDate.from
        const prevTo = parsedDate.to

        // Qo'lda buzilgan URL sanasi bo'lsa hech nima saqlanmaydi (tozalanadi).
        if (!prevFrom || Number.isNaN(prevFrom.getTime())) return undefined

        const wasSingleDay =
            !prevTo ||
            (!Number.isNaN(prevTo.getTime()) && isSameDay(prevFrom, prevTo))

        return wasSingleDay ? { from: prevFrom, to: prevFrom } : undefined
    }

    const handleOnChange = (range: DateRange | undefined) => {
        if (!disabled) {
            navigate({
                search: {
                    ...search,
                    ...rangeToSearch(keepSingleDay(range)),
                    page: undefined,
                },
            })
        }
    }

    function reset() {
        if (!disabled) {
            navigate({
                search: {
                    ...search,
                    [from]: undefined,
                    [to]: undefined,
                    page: undefined,
                },
            });
        }
    }

    return (
        <div
            className={cn(
                "relative flex items-center justify-between min-w-64 w-max",
                className
            )}
        >
            <DatePickerWithRange
                date={parsedDate}
                setDate={handleOnChange}
                disabled={disabled}
                addButtonProps={addButtonProps}
                {...props}
            />
            {(parsedDate.from || parsedDate.to) && !disabled && clearable && (
                <X
                    onClick={reset}
                    size={16}
                    className="text-destructive absolute right-2 cursor-pointer"
                />
            )}
        </div>
    );
}
