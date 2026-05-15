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
import { useNavigate, useSearch } from "@tanstack/react-router"
import { CheckIcon, ChevronDown, X } from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import { Skeleton } from "../ui/skeleton"

type ParamComboboxProps<T extends Record<string, any>> = {
    options: T[]
    paramName: string
    label?: string
    labelKey?: keyof T
    valueKey?: keyof T
    isError?: boolean
    className?: string
    asloClear?: string[]
    defaultOpt?: T
    isSearch?: boolean
    isLoading?: boolean
    skeletonCount?: number
    onSearchChange?: (val: string) => void
    handleSelectItem?: (option: SearchParams) => void
    addButtonProps?: ButtonProps
    renderOption?: (item: T) => ReactNode
}

export function ParamCombobox<T extends Record<string, any>>({
    options=[],
    paramName,
    label,
    isError = false,
    className,
    asloClear = [],
    defaultOpt,
    labelKey = "name",
    valueKey = "id",
    isSearch = true,
    onSearchChange,
    skeletonCount = 5,
    isLoading,
    addButtonProps,
    handleSelectItem,
    renderOption,
}: ParamComboboxProps<T>) {
    const [inputValue, setInputValue] = useState("")
    const navigate = useNavigate()
    const search: any = useSearch({ from: "/_main" }) as Record<
        string,
        string | undefined
    >
    const currentValue = search[paramName]
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (defaultOpt) {
            navigate({
                search: {
                    ...search,
                    [paramName]: String(defaultOpt[valueKey]),
                },
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultOpt])

    const handleSelect = (option: T) => {
        const returnValue = option[valueKey]
        const updatedSearch = { ...search } as Record<
            string,
            string | undefined
        >
        updatedSearch[paramName] = String(returnValue)
        updatedSearch["page"] = undefined

        asloClear.forEach((key) => {
            delete updatedSearch[key]
        })

        navigate({
            to: location.pathname,
            search: updatedSearch,
        })
        setOpen(false)
        setInputValue("")
        if (onSearchChange) {
            onSearchChange("")
        }
        if (handleSelectItem) {
            handleSelectItem(updatedSearch as any)
        }
    }

    const handleCancel = () => {
        const updatedSearch = {
            ...search,
            [paramName]: undefined,
            page: undefined,
        }
        asloClear.forEach((param) => {
            updatedSearch[param] = undefined
        })
        navigate({ search: updatedSearch })
        setOpen(false)
    }

    const safeOptions: T[] = Array.isArray(options)
        ? options
        : Array.isArray((options as any)?.results)
          ? (options as any).results
          : Array.isArray((options as any)?.data)
            ? (options as any).data
            : []

    const selectedOption = safeOptions.find(
        (d) => d[valueKey] == currentValue,
    )

    const sortedOptions = [...safeOptions].sort((a, b) => {
        const isASelected = a[valueKey] == currentValue
        const isBSelected = b[valueKey] == currentValue
        return (
            isASelected === isBSelected ? 0
            : isASelected ? -1
            : 1
        )
    })

    return (
        <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full  justify-between font-normal ",
                        currentValue && "font-medium !text-white",
                        isError && "!text-destructive",
                    )}
                    {...addButtonProps}
                >
                    {selectedOption?.[labelKey] ?? label}
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-0 !min-w-full ", className)}>
                <Command shouldFilter={onSearchChange ? false : true}>
                    <div className="relative">
                        {isSearch && (
                            <>
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
                                {currentValue && (
                                    <span className="absolute cursor-pointer text-red-600 top-1.5 right-1 p-1">
                                        <X width={16} onClick={handleCancel} />
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <CommandList>
                        <CommandEmpty>{"Mavjud emas"}</CommandEmpty>
                        <CommandGroup>
                            {sortedOptions.map((d, i) => {
                                const optionValue = d[valueKey]

                                return (
                                    <CommandItem
                                        key={i}
                                        onSelect={() => handleSelect(d)}
                                        className="text-nowrap"
                                    >
                                        {!!renderOption ?
                                            renderOption(d)
                                        :   d[labelKey as keyof T]}
                                        <CheckIcon
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                (
                                                    String(currentValue) ===
                                                        String(optionValue)
                                                ) ?
                                                    "opacity-100"
                                                :   "opacity-0",
                                            )}
                                        />
                                    </CommandItem>
                                )
                            })}

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
