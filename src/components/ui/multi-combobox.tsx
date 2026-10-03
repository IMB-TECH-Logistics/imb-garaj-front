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
import { useMemo, useRef, useState } from "react"
import { ClassNameValue } from "tailwind-merge"

type ComboboxProps<T extends Record<string, any>> = {
    options: T[] | undefined
    values: (string | number | null)[]
    setValues: (val: any) => void
    onAdd?: () => void
    label: string
    isLoading?: boolean
    isError?: boolean
    className?: ClassNameValue
    labelKey?: keyof T
    skeletonCount?: number
    valueKey?: keyof T
    onSearchChange?: (val: string) => void
    addButtonProps?: ButtonProps
    allSelected?: boolean
    isSearch?: boolean
    hideSort?: boolean
}

export function MultiCombobox<T extends Record<string, any>>({
    options,
    values,
    setValues,
    label,
    onAdd,
    isError,
    labelKey = "label",
    valueKey = "value",
    className,
    isLoading,
    skeletonCount = 3,
    onSearchChange,
    addButtonProps,
    allSelected = false,
    isSearch = true,
    hideSort = false,
}: ComboboxProps<T>) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")

    const handleSelect = (option: T) => {
        const newValue = option[valueKey]
        const updatedValues =
            values?.find((v) => v === newValue) ?
                values?.filter((v) => v !== newValue)
            :   (values || []).concat(newValue)
        setValues(updatedValues)
        setInputValue("")
        if (onSearchChange) {
            onSearchChange("")
        }
    }
    const rf = useRef<NodeJS.Timeout>()

    const handleClickAdd = () => {
        onAdd ? onAdd?.() : undefined
    }

    const selectedSet = new Set(values)
    const sortedOptions = useMemo(() => {
        if (hideSort) {
            return options
        } else
            return options?.slice().sort((a, b) => {
                const aSelected = selectedSet.has(a[valueKey])
                const bSelected = selectedSet.has(b[valueKey])
                return (
                    aSelected === bSelected ? 0
                    : aSelected ? -1
                    : 1
                )
            })
    }, [selectedSet])

    const handleSelectAll = () => {
        const updatedValues = options?.map((item) => item[valueKey])
        setValues(updatedValues)
    }

    function onValueChange(v: string) {
        setInputValue(v)
        if (onSearchChange) {
            if (rf.current) {
                clearTimeout(rf.current)
            }
            rf.current = setTimeout(() => {
                onSearchChange(v)
            }, DEBOUNCETIME)
        }
    }

    return (
        <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full  relative justify-between  overflow-hidden px-2 hover:bg-card font-normal text-gray-400 hover:text-gray-400",
                        values && "font-medium text-foreground",
                        isError && "!border-destructive border",
                        className,
                    )}
                    {...addButtonProps}
                >
                    <div className={cn("flex min-w-0 flex-1 items-center justify-between gap-2 pl-2", !!values?.length && "pr-6")}>
                        <span className="min-w-0 truncate text-left">
                            {values?.length && values?.length < skeletonCount ?
                                options
                                    ?.filter((d) =>
                                        values?.includes(d[valueKey]),
                                    )
                                    .map((d) => d[labelKey])
                                    .join(", ")
                            : values?.length ?
                                values?.length + " ta tanlandi"
                            :   label}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-primary opacity-50" />

                    </div>
                    {!!values?.length && (
                        <span
                            className={cn(
                                "absolute cursor-pointer text-destructive top-[50%] translate-y-[-50%] right-1 p-1",
                                onAdd && "right-8",
                            )}
                        >
                            <X
                                className="text-red-500"
                                width={16}
                                onClick={() => setValues([])}
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
                            onValueChange={onValueChange}
                            placeholder={"Qidirish"}
                            className="h-10"
                        />
                    )}
                    <CommandList>
                        <CommandEmpty>{"Mavjud emas"}</CommandEmpty>
                        <CommandGroup className="!overflow-y-scroll">
                            {allSelected && (
                                <CommandItem
                                    onSelect={() => {
                                        if (
                                            values?.length ==
                                            sortedOptions?.length
                                        ) {
                                            setValues([])
                                        } else
                                            setValues(
                                                sortedOptions?.map(
                                                    (f) => f[valueKey],
                                                ),
                                            )
                                    }}
                                >
                                    {"Barchasini tanlash"}
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            (
                                                values?.length ==
                                                    sortedOptions?.length
                                            ) ?
                                                "opacity-100"
                                            :   "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            )}
                            {sortedOptions?.map((d, i: number) => (
                                <CommandItem
                                    key={i}
                                    onSelect={() => handleSelect(d)}
                                >
                                    {d[labelKey]}
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            values?.includes(d[valueKey]) ?
                                                "opacity-100"
                                            :   "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
