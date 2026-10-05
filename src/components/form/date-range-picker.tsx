import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { uz } from "date-fns/locale";

export function DatePickerWithRange({
    className,
    disabled,
    date,
    setDate,
    addButtonProps,
}: {
    date: DateRange | undefined;
    setDate: SelectRangeEventHandler;
    disabled?: boolean;
} & {
    className?: React.HTMLAttributes<HTMLDivElement>;
     addButtonProps?: ButtonProps
}) {
    return (
        <div className={cn("grid gap-2 w-full", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal hover:text-foreground",
                            !date && "text-muted-foreground"
                        )}
                        disabled={disabled}
                        {...addButtonProps}
                    >
                        <CalendarIcon className={cn("h-4 w-4")} />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy")} -{" "}
                                    {format(date.to, "dd/MM/yyyy")}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy")
                            )
                        ) : (
                            <span>Kunlarni tanlang</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={uz}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
