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
import {
    groupOptionsByName,
    selectedGroupKeys,
    toggleGroup,
} from "@/lib/tenant-options"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { CheckIcon, ChevronDown, X } from "lucide-react"
import { useState } from "react"
import { Skeleton } from "../ui/skeleton"

type ParamComboboxProps<T extends Record<string, any>> = {
    options: T[]
    paramName: string
    label?: string
    labelKey: keyof T
    valueKey: keyof T
    isError?: boolean
    className?: string
    onSearchChange?: (val: string) => void
    isLoading?: boolean
    skeletonCount?: number
    addButtonProps?: ButtonProps
    hideSearch?: boolean
    dontTop?: boolean
}

export function ParamMultiCombobox<T extends Record<string, any>>({
    options: rawOptions,
    paramName,
    label,
    isError,
    className,
    labelKey="name",
    valueKey="id",
    isLoading,
    skeletonCount = 5,
    onSearchChange,
    addButtonProps,
    hideSearch = false,
    dontTop = false,
}: ParamComboboxProps<T>) {
    const [inputValue, setInputValue] = useState("")

    const navigate = useNavigate()
    const search: any = useSearch({ from: "/_main" }) as Record<
        string,
        string | undefined
    >
    const nameGroups = groupOptionsByName(rawOptions, labelKey, valueKey)
    const options: T[] =
        nameGroups ?
            nameGroups.map(
                (g) =>
                    ({
                        ...g.first,
                        [valueKey]: g.key,
                        [labelKey]: g.label,
                    }) as T,
            )
        :   rawOptions
    const currentValues: string[] =
        nameGroups ?
            selectedGroupKeys(nameGroups, search[paramName])
        :   search[paramName]?.split(",") || []
    const [open, setOpen] = useState(false)

    const handleSelect = (option: T) => {
        if (nameGroups) {
            const group = nameGroups.find(
                (g) => g.key === String(option[valueKey]),
            )
            if (group) {
                navigate({
                    search: {
                        ...search,
                        [paramName]: toggleGroup(search[paramName], group),
                    },
                })
            }
            setInputValue("")
            if (onSearchChange) {
                onSearchChange("")
            }
            return
        }
        const val = option[valueKey]
        const stringVal = String(val)

        const existing = (
            search[paramName]?.toString().split(",") ?? []
        ).filter(Boolean)

        const updated =
            existing.includes(stringVal) ?
                existing.filter((v: string) => v !== stringVal)
            :   [...existing, stringVal]

        navigate({
            search: {
                ...search,
                [paramName]: updated.length ? updated.join(",") : undefined,
            },
        })
        setInputValue("")
        if (onSearchChange) {
            onSearchChange("")
        }
    }
    const handleCancel = () => {
        navigate({ search: { ...search, [paramName]: undefined } })
        setOpen(false)
    }

    const selectedLabels =
        currentValues.length > 0 ?
            currentValues
                ?.map((val: string) => {
                    const found = options?.find(
                        (d) => String(d[valueKey]) === val,
                    )
                    return found?.[labelKey] || val
                })
                .join(", ")
        :   undefined

    const selectedSet = new Set(currentValues)
    const sortedOptions =
        dontTop ? options : (
            options.slice().sort((a, b) => {
                const aSelected = selectedSet.has(String(a[valueKey]))
                const bSelected = selectedSet.has(String(b[valueKey]))
                return (
                    aSelected === bSelected ? 0
                    : aSelected ? -1
                    : 1
                )
            })
        )

    return (
        <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    role="combobox"
                    variant={"outline"}
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between text-muted-foreground font-normal",
                        currentValues.length && "text-foreground font-medium",
                        isError && "!text-destructive",
                        className,
                    )}
                    {...addButtonProps}
                >
                    <span className="line-clamp-1 break-all whitespace-pre-line">
                        {currentValues.length > 2 ?
                            `${currentValues.length} ${"ta tanlandi"}`
                        :   selectedLabels || label}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <Command shouldFilter={onSearchChange ? false : true}>
                    {!hideSearch && (
                        <div className="relative">
                            <CommandInput
                                placeholder={label}
                                value={inputValue}
                                onValueChange={(text) => {
                                    setInputValue(text)
                                    if (onSearchChange) {
                                        setTimeout(() => {
                                            onSearchChange(text)
                                        }, DEBOUNCETIME)
                                    }
                                }}
                            />
                            {currentValues.length > 0 && (
                                <span className="absolute cursor-pointer text-destructive top-1.5 right-1 p-1 z-20">
                                    <X
                                        className="text-destructive"
                                        width={16}
                                        onClick={handleCancel}
                                    />
                                </span>
                            )}
                        </div>
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
                                            (
                                                currentValues.includes(
                                                    String(d[valueKey]),
                                                )
                                            ) ?
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
