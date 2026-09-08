import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { X } from "lucide-react";
import { format } from "date-fns";
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

    const handleOnChange = (range: DateRange | undefined) => {
        if (!disabled) {
            navigate({
                search: {
                    ...search,
                    ...rangeToSearch(range),
                    page: undefined,
                },
            });
        }
    };

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
