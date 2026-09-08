"use client"
import { displayFieldLabel } from "@/lib/field-labels"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import {
    Control,
    Controller,
    FieldValues,
    Path,
    useFormState,
} from "react-hook-form"

import { Button, ButtonProps } from "@/components/ui/button"
import { Calendar, CalendarProps } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import FieldError from "./form-error"
import FieldLabel from "./form-label"
import { getNestedValue } from "./input"

export function FormDateTimePicker<TForm extends FieldValues>({
    name,
    label,
    control,
    required = false,
    disabled,
    calendarProps,
    hideError = false,
    placeholder,
    minutesInterval = 1,
    addButtonProps,
}: thisProps<TForm>) {
    // `control._formState` obuna bo'linmagan ichki holat — `useFormState`
    // esa xato o'zgarganda qayta renderni ta'minlaydi.
    const { errors } = useFormState({ control, name })
    const error = getNestedValue(errors, name)

    return (
        <div className="flex flex-col justify-between">
            {label && (
                <FieldLabel
                    isError={!!error}
                    htmlFor={name}
                    required={required}
                >
                    {label}
                </FieldLabel>
            )}

            <Controller
                name={name}
                control={control}
                rules={
                    required ? { required: `${displayFieldLabel(name, label)}ni tanlang` } : {}
                }
                render={({ field }) => {
                    const value =
                        field.value ? new Date(field.value) : undefined
                    const setValue = (newValue: Date) => {
                        field.onChange(format(newValue, "yyyy-MM-dd HH:mm"))
                    }

                    const hours = Array.from({ length: 24 }, (_, i) => i)
                    const minutes = Array.from(
                        { length: 60 / minutesInterval },
                        (_, i) => i * minutesInterval,
                    )

                    const handleTimeChange = (
                        type: "hour" | "minute",
                        val: string,
                    ) => {
                        if (value) {
                            const newDate = new Date(value)
                            if (type === "hour") newDate.setHours(parseInt(val))
                            if (type === "minute")
                                newDate.setMinutes(parseInt(val))
                            setValue(newDate)
                        }
                    }

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={disabled}
                                    className={cn(
                                        "w-12 md:w-[280px] justify-start text-left font-normal",
                                        !value && "text-muted-foreground",
                                        error && "border-destructive",
                                    )}
                                    {...addButtonProps}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {value ?
                                        format(value, "yyyy-MM-dd, HH:mm")
                                    :   <span className="text-muted-foreground">
                                            {placeholder ||
                                                "Sana va vaqt tanlang"}
                                        </span>
                                    }
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-auto p-0">
                                <div className="sm:flex">
                                    <Calendar
                                        {...calendarProps}
                                        mode="single"
                                        selected={value}
                                        onSelect={(d) => d && setValue(d)}
                                        initialFocus
                                    />

                                    <div className="flex flex-col sm:flex-row sm:h-[300px] border-l divide-x ">
                                        <ScrollArea className="w-64 sm:w-auto no-scrollbar-x">
                                            <div className="flex sm:flex-col p-2">
                                                {hours.map((hour) => (
                                                    <Button
                                                        key={hour}
                                                        size="icon"
                                                        variant={
                                                            (
                                                                value &&
                                                                value.getHours() ===
                                                                    hour
                                                            ) ?
                                                                "default"
                                                            :   "ghost"
                                                        }
                                                        className="sm:w-full shrink-0 aspect-square"
                                                        onClick={() =>
                                                            handleTimeChange(
                                                                "hour",
                                                                hour.toString(),
                                                            )
                                                        }
                                                    >
                                                        {hour}
                                                    </Button>
                                                ))}
                                            </div>
                                            <ScrollBar
                                                orientation="horizontal"
                                                className="sm:hidden"
                                            />
                                        </ScrollArea>

                                        <ScrollArea className="w-64 sm:w-auto ">
                                            <div className="flex sm:flex-col p-2">
                                                {minutes.map((minute) => (
                                                    <Button
                                                        key={minute}
                                                        size="icon"
                                                        variant={
                                                            (
                                                                value &&
                                                                value.getMinutes() ===
                                                                    minute
                                                            ) ?
                                                                "default"
                                                            :   "ghost"
                                                        }
                                                        className="sm:w-full shrink-0 aspect-square"
                                                        onClick={() =>
                                                            handleTimeChange(
                                                                "minute",
                                                                minute.toString(),
                                                            )
                                                        }
                                                    >
                                                        {minute
                                                            .toString()
                                                            .padStart(2, "0")}
                                                    </Button>
                                                ))}
                                            </div>
                                            <ScrollBar
                                                orientation="horizontal"
                                                className="sm:hidden"
                                            />
                                        </ScrollArea>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )
                }}
            />

            {!hideError && error?.message && (
                <FieldError>{error.message as string}</FieldError>
            )}
        </div>
    )
}

interface thisProps<TForm extends FieldValues> {
    name: Path<TForm>
    label?: string | ReactNode
    disabled?: boolean
    control: Control<TForm>
    required?: boolean
    calendarProps?: CalendarProps | undefined
    hideError?: boolean
    placeholder?: string
    minutesInterval?: number
    addButtonProps?: ButtonProps
}
