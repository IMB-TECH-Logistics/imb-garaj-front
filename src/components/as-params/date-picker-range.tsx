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

    useEffect(() => {
        if (defaultValue && !fromDateString && !toDateString) {
            navigate({
                search: {
                    ...search,
                    [from]: defaultValue?.from
                        ? format(defaultValue.from, dateFormat)
                        : undefined,
                    [to]: defaultValue?.to
                        ? format(defaultValue.to, dateFormat)
                        : undefined,
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
