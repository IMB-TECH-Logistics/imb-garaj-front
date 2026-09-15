import React, { ReactNode } from "react"
import {
    Select as Select2,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select2"
import { ClassNameValue } from "tailwind-merge"
import { cn } from "@/lib/utils"

export default function Select<T extends Record<string, any>>({
    value,
    setValue,
    options,
    label,
    className,
    disabled,
    renderOption,
    labelKey = "label",
    valueKey = "value",
    placeholder,
    classNameItem,
}: thisProps<T>) {
    return (
        <Select2
            disabled={disabled}
            value={value?.toString()}
            onValueChange={setValue}
        >
            <SelectTrigger
                className={cn(
                    `w-full bg-background ${className}`,
                    renderOption && "pl-1",
                )}
            >
                <SelectValue
                    className={`${className}`}
                    placeholder={
                        <span
                            className={`${renderOption && "pl-2"} `}
                        >
                            {placeholder ?? label}
                        </span>
                    }
                />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {options?.map((s, i) => (
                        <SelectItem
                            key={i}
                            value={s[valueKey as keyof T]?.toString()}
                            className={cn(
                                renderOption && "p-0 bg-transparent",
                                classNameItem,
                            )}
                        >
                            {!!renderOption ?
                                renderOption(s)
                            :   s[labelKey as keyof T]}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select2>
    )
}

interface thisProps<T extends Record<string, any>> {
    value: string | number | null
    setValue: (value: string) => void
    options: T[]
    label: string
    className?: ClassNameValue
    classNameItem?: ClassNameValue
    disabled?: boolean
    labelKey?: keyof T
    valueKey?: keyof T
    renderOption?: (item: T) => ReactNode
    placeholder?: string
}
