import { Button, ButtonProps } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { DEBOUNCETIME } from "@/constants/default"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDown, Plus, X } from "lucide-react"
import { useState } from "react"
import { ClassNameValue } from "tailwind-merge"
import { Skeleton } from "./skeleton"

export type ComboboxProps<T extends Record<string, any>> = {
    options: T[] | undefined
    value: string | number | null
    setValue: (val: any) => void
    onAdd?: () => void
    label: string
    isLoading?: boolean
    isError?: boolean
    returnVal?: string
    className?: ClassNameValue
    labelKey?: keyof T
    valueKey?: keyof T
    skeletonCount?: number
    onSearchChange?: (val: string) => void
    addButtonProps?: ButtonProps
    isSearch?: boolean
    isClearIcon?: boolean
}

export function Combobox<T extends Record<string, any>>({
    options,
    value,
    setValue,
    label,
    onAdd,
    isError,
    labelKey = "label",
    valueKey = "value",
    className,
    isLoading,
    skeletonCount = 5,
    onSearchChange,
    addButtonProps,
    isClearIcon = true,
    isSearch = true,
}: ComboboxProps<T>) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")

    const handleSelect = (option: T) => {
        const returnValue = option[valueKey]
        setValue(returnValue)
        setOpen(false)
        setInputValue("")
        if (onSearchChange) {
            onSearchChange("")
        }
    }

    const handleClickAdd = () => {
        onAdd ? onAdd?.() : undefined
    }

    const sortedOptions = options?.sort((a, b) => {
        const isASelected = a[valueKey] == value
        const isBSelected = b[valueKey] == value
        return (
            isASelected === isBSelected ? 0
            : isASelected ? -1
            : 1
        )
    })

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    role="combobox"
                    className={cn(
                        "w-full justify-between relative   px-2 hover:bg-card font-normal ",
                        value && "font-medium text-foreground",
                        isError && "border border-destructive",
                        className,
                    )}
                    {...addButtonProps}
                >
                    <div
                        className={cn(
                            "flex items-center gap-2 pl-2 ",
                            onAdd && "pr-4",
                        )}
                    >
                        <span className="line-clamp-1 break-all whitespace-pre-wrap ">
                            {value ?
                                options
                                    ?.find((d) => d[valueKey] == value)
                                    ?.[labelKey]?.toString() || label
                            :   label}
                        </span>
                        <ChevronDown className=" h-4 w-4  text-primary opacity-50 " />

                    </div>
                    {!!value && isClearIcon && (
                        <span
                            className={cn(
                                "absolute cursor-pointer text-destructive top-[50%] translate-y-[-50%] right-1 p-1",
                                onAdd && "right-8",
                            )}
                        >
                            <X
                                className="text-red-500"
                                width={16}
                                onClick={() => setValue(null)}
                            />
                        </span>
                    )}
                    {onAdd && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClickAdd()
                            }}
                            className="dark:bg-primary/10 bg-slate-200 hover:bg-slate-300 hover:scale-105 p-1 rounded-full"
                        >
                            <Plus className=" h-4 w-4 shrink-0  text-primary" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <Command shouldFilter={onSearchChange ? false : true}>
                    {isSearch && (
                        <CommandInput
                            value={inputValue}
                            onValueChange={(text) => {
                                setInputValue(text)
                                if (onSearchChange) {
                                    setTimeout(() => {
                                        onSearchChange(text)
                                    }, DEBOUNCETIME)
                                }
                            }}
                            placeholder={label}
                        />
                    )}
                    <CommandList>
                        <CommandEmpty>{"Mavjud emas"}</CommandEmpty>
                        <CommandGroup>
                            {sortedOptions?.map((d, i) => (
                                <CommandItem
                                    key={i}
                                    onSelect={() => handleSelect(d)}
                                >
                                    {d[labelKey]}
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value == d[valueKey] ?
                                                "opacity-100"
                                            :   "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            ))}

                            {isLoading ?
                                <div className="space-y-1">
                                    {Array.from({ length: skeletonCount }).map(
                                        (_, index) => (
                                            <CommandItem
                                                key={index}
                                                className="p-0"
                                            >
                                                <Skeleton className="w-full h-7" />
                                            </CommandItem>
                                        ),
                                    )}
                                </div>
                            :   null}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
