import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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
    Package,
    Route as RouteIcon,
    Search,
    Truck,
    User2,
    X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type {
    DriverOption,
    MonitoringFilters,
    TripOption,
} from "./types"
import { todayIso } from "./types"

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
        value.order != null ||
        value.trip != null ||
        value.vehicle != null ||
        !!value.fromDate ||
        !!value.toDate

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <IdChip
                icon={<RouteIcon className="h-3.5 w-3.5" />}
                label="Reys"
                value={value.trip}
                tripOptions={tripOptions}
                onChange={(id) =>
                    onChange({
                        ...value,
                        trip: id,
                        order: null,
                        vehicle: null,
                    })
                }
            />

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
                        <CommandInput
                            placeholder="Haydovchi qidirish"
                            className="h-9"
                        />
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
                                                    order: null,
                                                    trip: null,
                                                    vehicle: null,
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

            <DirectIdChip
                icon={<Package className="h-3.5 w-3.5" />}
                label="Order"
                value={value.order}
                onChange={(id) =>
                    onChange({
                        ...value,
                        order: id,
                        trip: null,
                        vehicle: null,
                    })
                }
            />

            <DirectIdChip
                icon={<Truck className="h-3.5 w-3.5" />}
                label="Moshina"
                value={value.vehicle}
                onChange={(id) =>
                    onChange({
                        ...value,
                        vehicle: id,
                        trip: null,
                        order: null,
                    })
                }
            />

            <DateRangeChip value={value} onChange={onChange} />

            {hasAny && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        onChange({
                            driver: null,
                            order: null,
                            trip: null,
                            vehicle: null,
                            fromDate: "",
                            toDate: "",
                        })
                    }
                    className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                    Tozalash
                </Button>
            )}
        </div>
    )
}

function DateRangeChip({
    value,
    onChange,
}: {
    value: MonitoringFilters
    onChange: (next: MonitoringFilters) => void
}) {
    const presets = useMemo(() => buildPresets(), [])

    const label =
        value.fromDate || value.toDate
            ? `${value.fromDate || "…"} → ${value.toDate || "…"}`
            : null

    return (
        <Popover>
            <PopoverTrigger asChild>
                <FilterChip
                    active={!!value.fromDate || !!value.toDate}
                    icon={<CalendarRange className="h-3.5 w-3.5" />}
                    label="Sana"
                    value={label}
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
                className="w-[300px] p-2"
                align="start"
                sideOffset={6}
            >
                <div className="flex flex-wrap gap-1 pb-2">
                    {presets.map((p) => {
                        const active =
                            value.fromDate === p.from && value.toDate === p.to
                        return (
                            <Button
                                key={p.label}
                                size="sm"
                                variant={active ? "default" : "outline"}
                                onClick={() =>
                                    onChange({
                                        ...value,
                                        fromDate: p.from,
                                        toDate: p.to,
                                    })
                                }
                                className="h-7 text-[11px]"
                            >
                                {p.label}
                            </Button>
                        )
                    })}
                </div>
                <div className="border-t pt-2">
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                        Dan
                    </label>
                    <Input
                        type="date"
                        value={value.fromDate}
                        onChange={(e) =>
                            onChange({ ...value, fromDate: e.target.value })
                        }
                    />
                    <label className="mt-2 mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
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
    )
}

type Preset = { label: string; from: string; to: string }

function buildPresets(): Preset[] {
    const t = todayIso()
    const y = isoDelta(-1)
    const seven = isoDelta(-6)
    const thirty = isoDelta(-29)
    return [
        { label: "Bugun", from: t, to: t },
        { label: "Kecha", from: y, to: y },
        { label: "Oxirgi 7 kun", from: seven, to: t },
        { label: "Oxirgi 30 kun", from: thirty, to: t },
    ]
}

function isoDelta(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

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
            <span
                className={cn(
                    "shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                )}
            >
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

function IdChip({
    icon,
    label,
    value,
    tripOptions,
    onChange,
}: {
    icon: React.ReactNode
    label: string
    value: number | null
    tripOptions: TripOption[]
    onChange: (id: number | null) => void
}) {
    const [open, setOpen] = useState(false)
    const [direct, setDirect] = useState<string>(
        value != null ? String(value) : "",
    )
    useEffect(() => {
        setDirect(value != null ? String(value) : "")
    }, [value])

    const selectedTrip = useMemo(
        () => tripOptions.find((t) => t.id === value) ?? null,
        [tripOptions, value],
    )

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
                    icon={icon}
                    label={label}
                    value={valueLabel}
                    onClear={value != null ? () => onChange(null) : undefined}
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0"
                align="start"
                sideOffset={6}
            >
                <div className="border-b p-2">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {label} ID
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

                <Command>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <CommandInput
                            placeholder="Ro'yxatdan tanlash"
                            className="h-9 pl-7"
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty>Topilmadi</CommandEmpty>
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


function DirectIdChip({
    icon,
    label,
    value,
    onChange,
}: {
    icon: React.ReactNode
    label: string
    value: number | null
    onChange: (id: number | null) => void
}) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<string>(
        value != null ? String(value) : "",
    )
    useEffect(() => {
        setDraft(value != null ? String(value) : "")
    }, [value])

    const apply = () => {
        const trimmed = draft.trim()
        if (!trimmed) {
            if (value != null) onChange(null)
            setOpen(false)
            return
        }
        const id = Number(trimmed)
        if (!Number.isFinite(id) || id <= 0) return
        if (id !== value) onChange(id)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FilterChip
                    active={value != null}
                    icon={icon}
                    label={label}
                    value={value != null ? `#${value}` : null}
                    onClear={value != null ? () => onChange(null) : undefined}
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-[240px] p-2"
                align="start"
                sideOffset={6}
            >
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {label} ID
                </label>
                <div className="flex gap-1">
                    <div className="relative flex-1">
                        <Hash className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    apply()
                                }
                            }}
                            placeholder="masalan, 42"
                            className="h-9 pl-7 font-mono"
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={apply}
                        className="h-9"
                    >
                        Qo'llash
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
