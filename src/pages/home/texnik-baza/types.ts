export type TechKind = "truck" | "trailer"

export type TechStatus = "ok" | "warn" | "over" | "none"

export type Partner = { id: number; plate: string; since: string }

export type TechRow = {
    id: number
    kind: TechKind
    plate: string
    type_name: string | null
    photo: string | null
    coupled: Partner | null
    driver_name: string | null
    tires: { total: number; positions: number; warn: number; over: number }
    oil: { pct: number | null; status: TechStatus }
    inspection: { lifespan: string | null; status: TechStatus }
}

export type Axle = { dual: boolean }

export type Tire = {
    lot_id: number
    position: string
    factory_number: string | null
    product_name: string
    installed_at: string | null
    km: number
    km_limit: number | null
    pct: number | null
    status: TechStatus
}

export type Oil = {
    last_date: string | null
    km_since: number | null
    months_since: number | null
    km_limit: number | null
    months_limit: number | null
    limit_source: "vehicle" | "global"
    pct: number | null
    status: TechStatus
}

export type PassportDocument = {
    type: string
    label: string
    number: string | null
    issued_date: string | null
    expires_date: string | null
    status: TechStatus
}

export type Coupling = {
    id: number
    truck: { id: number; plate: string }
    trailer: { id: number; plate: string }
    start: string
    end: string | null
}

export type Passport = {
    id: number
    kind: TechKind
    plate: string
    type_name: string | null
    model_name: string | null
    year: number | null
    owner_name: string | null
    driver: { id: number; name: string } | null
    photos: { label: string; url: string }[]
    axles: Axle[]
    coupled: Partner | null
    couplings: Coupling[]
    tires: Tire[]
    oil: Oil | null
    documents: PassportDocument[]
    can_control: boolean
}

export type TimelineKind =
    | "tire"
    | "oil"
    | "repair"
    | "document"
    | "coupling"
    | "driver"

export type TimelineItem = {
    date: string
    kind: TimelineKind
    title: string
    detail: string
    amount: number | string | null
    executor_name: string | null
    ref: { type: string; id: number } | null
}

export type FuelTrip = {
    trip_id: number
    start: string
    end: string | null
    km: number | null
    liters: number | null
    per_100km: number | null
    diff_pct: number | null
}

export type FuelMonth = Record<string, unknown> & {
    month?: string
    km?: number | null
    liters?: number | null
    per_100km?: number | null
}

export type FuelConsumption = {
    norm: number | null
    trips: FuelTrip[]
    months: FuelMonth[]
}
