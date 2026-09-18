import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button, ButtonProps } from "@/components/ui/button"
import { Calendar, CalendarProps } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ClassNameValue } from "tailwind-merge"

export function DatePicker({
    date,
    setDate,
    placeholder,
    fullWidth,
    disabled,
    calendarProps,
    defaultValue,
    addButtonProps,
    className,
    isError,
}: {
    date: Date | any
    setDate: any
    placeholder?: string
    fullWidth?: boolean
    disabled?: boolean
    calendarProps?: CalendarProps | undefined
    defaultValue?: Date
    addButtonProps?: ButtonProps
    className?: ClassNameValue
    isError?: boolean
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        fullWidth && "w-full",
                        isError && "border border-destructive text-destructive",
                        className,
                    )}
                    disabled={disabled}
                    {...addButtonProps}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ?
                        format(date, "dd.MM.yyyy")
                    :   <span className="text-muted-foreground">
                            {placeholder || "Kunni tanlang"}
                        </span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    {...calendarProps}
                    mode="single"
                    selected={new Date(date || (defaultValue as Date))}
                    onSelect={(newDate) => {
                        if (newDate) {
                            setDate(
                                format(new Date(newDate as Date), "yyyy-MM-dd"),
                            )
                        }
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
