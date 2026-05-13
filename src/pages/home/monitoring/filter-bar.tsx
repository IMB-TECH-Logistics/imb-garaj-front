import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    MANAGERS_TRIPS,
    SETTINGS_SELECTABLE_USERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import {
    CalendarRange,
    CheckIcon,
    Hash,
    Route,
    Search,
    User2,
    X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { DriverOption, TripOption } from "./types"

export type MonitoringFilters = {
    driver: number | null
    trip: number | null
    fromDate: string
    toDate: string
}

type Props = {
    value: MonitoringFilters
    onChange: (next: MonitoringFilters) => void
}

export default function MonitoringFilterBar({ value, onChange }: Props) {
    const { data: drivers } = useGet<DriverOption[]>(
        SETTINGS_SELECTABLE_USERS,
        { params: { role: "driver", page_size: 1000 } },
    )

    const { data: trips } = useGet<ListResponse<TripOption>>(MANAGERS_TRIPS, {
        params: {
            page_size: 500,
            ...(value.driver ? { driver_id: value.driver } : {}),
        },
    })

    const driverOptions = useMemo(() => drivers ?? [], [drivers])
    const tripOptions = useMemo(() => trips?.results ?? [], [trips])

    const selectedDriver = useMemo(
        () => driverOptions.find((d) => d.id === value.driver) ?? null,
        [driverOptions, value.driver],
    )
    const selectedTrip = useMemo(
        () => tripOptions.find((t) => t.id === value.trip) ?? null,
        [tripOptions, value.trip],
    )

    const driverLabel = selectedDriver
        ? selectedDriver.full_name ||
          [selectedDriver.first_name, selectedDriver.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() ||
          `#${selectedDriver.id}`
        : null

    const hasAny =
        value.driver != null ||
        value.trip != null ||
        !!value.fromDate ||
        !!value.toDate

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {/* Trip — primary filter */}
            <TripChip
                value={value.trip}
                tripOptions={tripOptions}
                onChange={(id) => onChange({ ...value, trip: id })}
                selectedTrip={selectedTrip}
            />

            {/* Driver */}
            <Popover>
                <PopoverTrigger asChild>
                    <FilterChip
                        active={value.driver != null}
                        icon={<User2 className="h-3.5 w-3.5" />}
                        label="Haydovchi"
                        value={driverLabel}
                        onClear={
                            value.driver != null
                                ? () =>
                                      onChange({
                                          ...value,
                                          driver: null,
                                          trip: null,
                                      })
                                : undefined
                        }
                    />
                </PopoverTrigger>
                <PopoverContent
                    className="w-[280px] p-0"
                    align="start"
                    sideOffset={6}
                >
                    <Command>
                        <CommandInput placeholder="Haydovchi qidirish" className="h-9" />
                        <CommandList>
                            <CommandEmpty>Topilmadi</CommandEmpty>
                            <CommandGroup>
                                {driverOptions.map((d) => {
                                    const name =
                                        d.full_name ||
                                        [d.first_name, d.last_name]
                                            .filter(Boolean)
                                            .join(" ")
                                            .trim() ||
                                        `#${d.id}`
                                    return (
                                        <CommandItem
                                            key={d.id}
                                            value={`${name} ${d.id}`}
                                            onSelect={() =>
                                                onChange({
                                                    ...value,
                                                    driver:
                                                        value.driver === d.id
                                                            ? null
                                                            : d.id,
                                                    trip: null,
                                                })
                                            }
                                        >
                                            <span className="flex-1 truncate">
                                                {name}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                #{d.id}
                                            </span>
                                            {value.driver === d.id && (
                                                <CheckIcon className="ml-1 h-4 w-4 text-primary" />
                                            )}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Date range */}
            <Popover>
                <PopoverTrigger asChild>
                    <FilterChip
                        active={!!value.fromDate || !!value.toDate}
                        icon={<CalendarRange className="h-3.5 w-3.5" />}
                        label="Sana"
                        value={
                            value.fromDate || value.toDate
                                ? `${value.fromDate || "…"} → ${value.toDate || "…"}`
                                : null
                        }
                        onClear={
                            value.fromDate || value.toDate
                                ? () =>
                                      onChange({
                                          ...value,
                                          fromDate: "",
                                          toDate: "",
                                      })
                                : undefined
                        }
                    />
                </PopoverTrigger>
                <PopoverContent
                    className="w-[260px] p-3"
                    align="start"
                    sideOffset={6}
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Dan
                        </label>
                        <Input
                            type="date"
                            value={value.fromDate}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    fromDate: e.target.value,
                                })
                            }
                        />
                        <label className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                            Gacha
                        </label>
                        <Input
                            type="date"
                            value={value.toDate}
                            onChange={(e) =>
                                onChange({ ...value, toDate: e.target.value })
                            }
                        />
                    </div>
                </PopoverContent>
            </Popover>

            {hasAny && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        onChange({
                            driver: null,
                            trip: null,
                            fromDate: "",
                            toDate: "",
                        })
                    }
                    className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                    Hammasini tozalash
                </Button>
            )}
        </div>
    )
}

// ─── Filter chip primitive ───────────────────────────────────────────

function FilterChip({
    active,
    icon,
    label,
    value,
    onClear,
    ...props
}: {
    active: boolean
    icon: React.ReactNode
    label: string
    value: string | null
    onClear?: () => void
} & React.HTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            {...props}
            className={cn(
                "group inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition",
                active
                    ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/15"
                    : "border-border bg-card/80 text-foreground hover:bg-card",
                props.className,
            )}
        >
            <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>
                {icon}
            </span>
            <span>{label}</span>
            {value && (
                <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="max-w-[200px] truncate font-mono">
                        {value}
                    </span>
                </>
            )}
            {onClear && (
                <span
                    role="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClear()
                    }}
                    className="-mr-1 ml-0.5 grid h-4 w-4 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="h-3 w-3" />
                </span>
            )}
        </button>
    )
}

// ─── Trip chip with both search and direct-ID input ─────────────────

function TripChip({
    value,
    tripOptions,
    onChange,
    selectedTrip,
}: {
    value: number | null
    tripOptions: TripOption[]
    onChange: (id: number | null) => void
    selectedTrip: TripOption | null
}) {
    const [open, setOpen] = useState(false)
    const [direct, setDirect] = useState<string>(
        value != null ? String(value) : "",
    )
    useEffect(() => {
        setDirect(value != null ? String(value) : "")
    }, [value])

    const applyDirect = () => {
        const trimmed = direct.trim()
        if (!trimmed) {
            if (value != null) onChange(null)
            return
        }
        const id = Number(trimmed)
        if (!Number.isFinite(id) || id <= 0) return
        if (id !== value) onChange(id)
        setOpen(false)
    }

    const valueLabel = selectedTrip
        ? `#${selectedTrip.id} · ${selectedTrip.driver_name ?? "—"}`
        : value != null
        ? `#${value}`
        : null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FilterChip
                    active={value != null}
                    icon={<Route className="h-3.5 w-3.5" />}
                    label="Reys"
                    value={valueLabel}
                    onClear={
                        value != null ? () => onChange(null) : undefined
                    }
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0"
                align="start"
                sideOffset={6}
            >
                {/* Direct ID input */}
                <div className="border-b p-2">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Reys ID
                    </label>
                    <div className="flex gap-1">
                        <div className="relative flex-1">
                            <Hash className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                autoFocus
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={direct}
                                onChange={(e) => setDirect(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        applyDirect()
                                    }
                                }}
                                placeholder="masalan, 123"
                                className="h-9 pl-7 font-mono"
                            />
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={applyDirect}
                            className="h-9"
                        >
                            Qo'llash
                        </Button>
                    </div>
                </div>

                {/* Search/select from list */}
                <Command>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <CommandInput
                            placeholder="Ro'yxatdan tanlash"
                            className="h-9 pl-7"
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty>Reys topilmadi</CommandEmpty>
                        <CommandGroup>
                            {tripOptions.map((t) => (
                                <CommandItem
                                    key={t.id}
                                    value={`${t.id} ${t.driver_name ?? ""} ${t.start ?? ""}`}
                                    onSelect={() => {
                                        onChange(value === t.id ? null : t.id)
                                        setOpen(false)
                                    }}
                                    className="gap-2"
                                >
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                        #{t.id}
                                    </span>
                                    <span className="flex-1 truncate text-sm">
                                        {t.driver_name ?? "—"}
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        {t.start ?? ""}
                                    </span>
                                    {value === t.id && (
                                        <CheckIcon className="h-4 w-4 text-primary" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
