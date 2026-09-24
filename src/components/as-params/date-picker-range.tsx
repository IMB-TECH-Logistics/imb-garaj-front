import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DatePickerWithRange } from "../form/date-range-picker";
import { useEffect, useRef } from "react";
import { ButtonProps } from "../ui/button";
import { toast } from "sonner";

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

export function isValidDateParam(value?: string) {
    return !!value && !Number.isNaN(new Date(value).getTime());
}

export function isReversedRange(fromDate?: string, toDate?: string) {
    if (!fromDate || !toDate) return false;
    const start = new Date(fromDate).getTime();
    const end = new Date(toDate).getTime();
    return !Number.isNaN(start) && !Number.isNaN(end) && start > end;
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
    const isReversed = isReversedRange(fromDateString, toDateString);
    const isInvalid =
        (!!fromDateString && !isValidDateParam(fromDateString)) ||
        (!!toDateString && !isValidDateParam(toDateString));
    const initialApplied = useRef(false);

    useEffect(() => {
        if (isInvalid) {
            navigate({
                search: {
                    ...search,
                    [from]: defaultValue?.from
                        ? format(defaultValue.from, dateFormat)
                        : undefined,
                    [to]: defaultValue?.to
                        ? format(defaultValue.to, dateFormat)
                        : undefined,
                    page: undefined,
                },
                replace: true,
            });
            toast.warning("Sana noto'g'ri formatda edi, standart oraliq qo'yildi", {
                id: "invalid-date-range",
            });
            return;
        }
        if (isReversed && defaultValue) {
            navigate({
                search: {
                    ...search,
                    [from]: defaultValue?.from ? format(defaultValue.from, dateFormat) : undefined,
                    [to]: defaultValue?.to ? format(defaultValue.to, dateFormat) : undefined,
                    page: undefined,
                },
                replace: true,
            });
            toast.warning("Sana oralig'i noto'g'ri edi, joriy oy qo'yildi", {
                id: "reversed-date-range",
            });
            return;
        }
        if (defaultValue && !fromDateString && !toDateString && !initialApplied.current) {
            initialApplied.current = true;
            navigate({
                search: {
                    ...search,
                    [from]: defaultValue?.from ? format(defaultValue.from, dateFormat) : undefined,
                    [to]: defaultValue?.to ? format(defaultValue.to, dateFormat) : undefined,
                },
                replace: true,
            });
        }
    }, [fromDateString, toDateString]);

    const parsedDate: DateRange | undefined = {
        from: isValidDateParam(fromDateString) ? new Date(fromDateString) : undefined,
        to: isValidDateParam(toDateString) ? new Date(toDateString) : undefined,
    };

    const handleOnChange = (range: DateRange | undefined) => {
        if (!disabled) {
            navigate({
                search: {
                    ...search,
                    [from]: range?.from
                        ? format(range.from, dateFormat)
                        : undefined,
                    [to]: range?.to ? format(range.to, dateFormat) : undefined,
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
