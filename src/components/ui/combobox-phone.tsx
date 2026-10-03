"use client"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { PatternFormat } from "react-number-format"
import { Skeleton } from "./skeleton"

type ComboboxProps<T extends Record<string, any>> = {
    options: T[] | undefined
    label: string
    isLoading?: boolean
    disabled?: boolean
    returnVal?: string
    labelKey?: keyof T
    skeletonCount?: number
    valueKey?: keyof T
    searchKey?: string
    value?: string | number | null
    setValue: (val: any) => void
}

export function ComboboxPhone<T extends Record<string, any>>({
    options,
    label,
    returnVal = "label",
    labelKey = "label",
    valueKey = "value",
    isLoading,
    skeletonCount = 5,
    searchKey = "phone_search",
    disabled,
    setValue,
    value,
}: ComboboxProps<T>) {
    const navigate = useNavigate()
    const params: any = useSearch({ strict: false })
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [isSelecting, setIsSelecting] = useState<boolean>(false)

    const handleSelect = (option: T, event?: React.MouseEvent) => {
        event?.stopPropagation()
        setIsSelecting(true)

        const returnValue =
            returnVal === labelKey ? option[labelKey] : option[valueKey]
        navigate({
            search: {
                ...params,
                [searchKey]: undefined,
            },
        })
        setValue(returnValue)
        setTimeout(() => {
            setIsSelecting(false)
        }, 100)
    }

    const handleDebouncedSearch = (query: string) => {
        if (isSelecting) return

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }
        debounceTimeoutRef.current = setTimeout(() => {
            navigate({
                search: {
                    ...params,
                    [searchKey]: query || undefined,
                },
            })
        }, 300)
    }

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
        }
    }, [])

    const showDropdown = options && options.length > 0 && !!params[searchKey]

    return (
        <div className="w-full relative ">
            {label && <p className="font-normal text-sm mb-1">{label}</p>}
            <PatternFormat
                disabled={disabled}
                getInputRef={inputRef}
                placeholder="Telefon raqam"
                allowEmptyFormatting
                value={value}
                format="+998 ## ### ## ##"
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                )}
                onValueChange={(val) => {
                    handleDebouncedSearch(val.value)
                }}
            />

            {showDropdown && (
                <ul  onClick={(e) => e.stopPropagation()} className="bg-card absolute z-[60] top-full w-full right-0 rounded-md p-2 flex flex-col gap-1 max-h-[320px] overflow-y-auto">
                    {options?.map((item) => (
                        <li
                              onClick={(e) => handleSelect(item, e)}
                            className="text-sm cursor-pointer hover:bg-muted py-2 px-4 border rounded-md"
                        >
                            {item[labelKey]}
                        </li>
                    ))}

                    {isLoading &&
                        Array.from({ length: skeletonCount }).map(
                            (_, index) => (
                                <Skeleton key={index} className="w-full h-8" />
                            ),
                        )}
                </ul>
            )}
        </div>
    )
}
