import { loadStore, matchSearch, nextId, paginate, saveStore } from "./store"
import { MockHandler, MockResponse } from "./types"

type PetrolStation = {
    id: number
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    balance: number
}

type CashFlow = {
    id: number
    action: 1 | -1
    amount: number
    currency: 1 | 2
    currency_course: number | null
    comment: string | null
    petrol_station: number
    petrol_station_name: string | null
    executor: number
    executor_name: string | null
    driver: number | null
    driver_name: string | null
    vehicle_plate: string | null
    liters: number | null
    price_per_liter: number | null
    created: string
}

const STATIONS_KEY = "petrol-stations"
const FLOWS_KEY = "petrol-cashflows"

const SEED_STATIONS: PetrolStation[] = [
    {
        id: 1,
        name: "UNG Petrol — Yunusobod",
        address: "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 12",
        latitude: 41.3528,
        longitude: 69.2891,
        balance: 18_500_000,
    },
    {
        id: 2,
        name: "Lukoil — Sergeli",
        address: "Toshkent sh., Sergeli tumani, Yangi Sergeli 4-mavze",
        latitude: 41.2261,
        longitude: 69.2229,
        balance: 7_240_000,
    },
    {
        id: 3,
        name: "Uzgazoil — Chilonzor",
        address: "Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 56",
        latitude: 41.2867,
        longitude: 69.2032,
        balance: 32_900_000,
    },
    {
        id: 4,
        name: "Hum Petrol — Samarqand yo'li",
        address: "Samarqand viloyati, M-39 yo'li 14-km",
        latitude: 39.7341,
        longitude: 66.9532,
        balance: 12_100_000,
    },
    {
        id: 5,
        name: "Neftgaz — Buxoro",
        address: "Buxoro sh., Mustaqillik ko'chasi 88",
        latitude: 39.7682,
        longitude: 64.4386,
        balance: 4_650_000,
    },
]

const topUp = (
    id: number,
    station: number,
    name: string,
    amount: number,
    created: string,
    extra: Partial<CashFlow> = {},
): CashFlow => ({
    id,
    action: 1,
    amount,
    currency: 1,
    currency_course: null,
    comment: extra.comment ?? "Kirim",
    petrol_station: station,
    petrol_station_name: name,
    executor: 1,
    executor_name: "Demo Foydalanuvchi",
    driver: null,
    driver_name: null,
    vehicle_plate: null,
    liters: null,
    price_per_liter: null,
    created,
    ...extra,
})

const expense = (
    id: number,
    station: number,
    name: string,
    liters: number,
    pricePerLiter: number,
    created: string,
    driver: number,
    driverName: string,
    plate: string,
    comment?: string,
): CashFlow => ({
    id,
    action: -1,
    amount: liters * pricePerLiter,
    currency: 1,
    currency_course: null,
    comment: comment ?? null,
    petrol_station: station,
    petrol_station_name: name,
    executor: driver,
    executor_name: driverName,
    driver,
    driver_name: driverName,
    vehicle_plate: plate,
    liters,
    price_per_liter: pricePerLiter,
    created,
})

const SEED_FLOWS: CashFlow[] = [
    topUp(1, 1, "UNG Petrol — Yunusobod", 10_000_000, "2026-04-12T09:30:00Z", {
        comment: "Boshlang'ich to'ldirish",
    }),
    topUp(2, 1, "UNG Petrol — Yunusobod", 8_500_000, "2026-04-28T14:10:00Z", {
        comment: "Aprel oyi to'ldirish",
    }),
    expense(
        3,
        1,
        "UNG Petrol — Yunusobod",
        125,
        10_500,
        "2026-05-02T07:45:00Z",
        2,
        "Aliyev Sardor",
        "01 A 234 BC",
        "Reys #A-204",
    ),
    expense(
        4,
        1,
        "UNG Petrol — Yunusobod",
        80,
        10_500,
        "2026-05-04T06:15:00Z",
        3,
        "Karimov Otabek",
        "10 B 998 AA",
        "Reys #A-211",
    ),
    expense(
        5,
        1,
        "UNG Petrol — Yunusobod",
        210,
        10_500,
        "2026-05-06T05:50:00Z",
        4,
        "Yusupov Jasur",
        "01 K 119 LM",
        "Reys #A-219 (uzun yo'l)",
    ),
    topUp(6, 2, "Lukoil — Sergeli", 5_000_000, "2026-04-21T11:00:00Z", {
        comment: "Qo'shimcha to'ldirish",
    }),
    expense(
        7,
        2,
        "Lukoil — Sergeli",
        95,
        10_700,
        "2026-04-29T08:20:00Z",
        2,
        "Aliyev Sardor",
        "01 A 234 BC",
        "Reys #B-118",
    ),
    expense(
        8,
        2,
        "Lukoil — Sergeli",
        140,
        10_700,
        "2026-05-03T12:40:00Z",
        5,
        "Toshmatov Eldor",
        "70 D 552 ZX",
        "Reys #B-120",
    ),
    topUp(9, 3, "Uzgazoil — Chilonzor", 1_000, "2026-05-05T16:20:00Z", {
        currency: 2,
        currency_course: 12_650,
        comment: "USD to'ldirish",
    }),
    expense(
        10,
        3,
        "Uzgazoil — Chilonzor",
        60,
        10_900,
        "2026-05-07T07:00:00Z",
        3,
        "Karimov Otabek",
        "10 B 998 AA",
        "Reys #C-031",
    ),
    expense(
        11,
        4,
        "Hum Petrol — Samarqand yo'li",
        300,
        10_400,
        "2026-05-01T04:30:00Z",
        4,
        "Yusupov Jasur",
        "01 K 119 LM",
        "Toshkent → Samarqand",
    ),
    expense(
        12,
        4,
        "Hum Petrol — Samarqand yo'li",
        180,
        10_400,
        "2026-05-08T15:10:00Z",
        5,
        "Toshmatov Eldor",
        "70 D 552 ZX",
        "Samarqand → Toshkent",
    ),
    expense(
        13,
        5,
        "Neftgaz — Buxoro",
        120,
        10_300,
        "2026-04-30T17:55:00Z",
        2,
        "Aliyev Sardor",
        "01 A 234 BC",
        "Buxoro yetkazib berish",
    ),
]

const getStations = () => loadStore<PetrolStation[]>(STATIONS_KEY, SEED_STATIONS)
const setStations = (rows: PetrolStation[]) => saveStore(STATIONS_KEY, rows)
const getFlows = () => loadStore<CashFlow[]>(FLOWS_KEY, SEED_FLOWS)
const setFlows = (rows: CashFlow[]) => saveStore(FLOWS_KEY, rows)

const ok = (data: any, status = 200): MockResponse => ({ status, data })

const flowToUzs = (f: CashFlow) =>
    f.currency === 2 ? f.amount * (f.currency_course ?? 0) : f.amount

const inDateRange = (
    iso: string,
    fromDate?: string | null,
    toDate?: string | null,
) => {
    const t = new Date(iso).getTime()
    if (fromDate) {
        const fromT = new Date(fromDate + "T00:00:00").getTime()
        if (t < fromT) return false
    }
    if (toDate) {
        const toT = new Date(toDate + "T23:59:59.999").getTime()
        if (t > toT) return false
    }
    return true
}

const recalcBalance = (stationId: number) => {
    const flows = getFlows().filter((f) => f.petrol_station === stationId)
    const total = flows.reduce((sum, f) => sum + f.action * flowToUzs(f), 0)
    const stations = getStations().map((s) =>
        s.id === stationId ? { ...s, balance: total } : s,
    )
    setStations(stations)
}

const STATIONS_LIST = /^\/petrol-stations\/?$/
const STATIONS_STATS = /^\/petrol-stations\/stats\/?$/
const STATION_STATS = /^\/petrol-stations\/(\d+)\/stats\/?$/
const STATION_DETAIL = /^\/petrol-stations\/(\d+)\/?$/
const STATION_CASHFLOWS = /^\/petrol-stations\/(\d+)\/cash-flows\/?$/
const STATION_TOPUP = /^\/petrol-stations\/(\d+)\/top-up\/?$/
const FLOW_PATCH = /^\/petrol-stations\/cash-flows\/(\d+)\/?$/
const FLOW_DELETE = /^\/petrol-stations\/cash-flows\/(\d+)\/delete\/?$/

export const petrolStationHandlers: MockHandler[] = [
    {
        match: (m, u) => m === "GET" && STATIONS_STATS.test(u),
        respond: () => {
            const stations = getStations()
            const flows = getFlows()
            const total_balance = stations.reduce((s, r) => s + r.balance, 0)
            const total_top_ups = flows
                .filter((f) => f.action === 1)
                .reduce((s, f) => s + flowToUzs(f), 0)
            const expenses = flows.filter((f) => f.action === -1)
            const total_outcomes = expenses.reduce(
                (s, f) => s + flowToUzs(f),
                0,
            )
            const total_liters = expenses.reduce(
                (s, f) => s + (f.liters ?? 0),
                0,
            )
            return ok({
                total_balance,
                total_top_ups,
                total_outcomes,
                total_liters,
                station_count: stations.length,
            })
        },
    },
    {
        match: (m, u) => m === "GET" && STATION_STATS.test(u),
        respond: ({ url, params }) => {
            const id = Number(url.match(STATION_STATS)![1])
            const station = getStations().find((s) => s.id === id)
            const fromDate = params?.from_date as string | undefined
            const toDate = params?.to_date as string | undefined
            const flows = getFlows()
                .filter((f) => f.petrol_station === id)
                .filter((f) => inDateRange(f.created, fromDate, toDate))
            const incomes = flows.filter((f) => f.action === 1)
            const expenses = flows.filter((f) => f.action === -1)
            const top_up_count = incomes.length
            const expense_count = expenses.length
            const total_top_ups = incomes.reduce(
                (s, f) => s + flowToUzs(f),
                0,
            )
            const total_outcomes = expenses.reduce(
                (s, f) => s + flowToUzs(f),
                0,
            )
            const total_liters = expenses.reduce(
                (s, f) => s + (f.liters ?? 0),
                0,
            )
            const avg_price_per_liter =
                total_liters > 0 ? total_outcomes / total_liters : 0
            return ok({
                balance: station?.balance ?? 0,
                total_top_ups,
                total_outcomes,
                total_liters,
                avg_price_per_liter,
                top_up_count,
                expense_count,
            })
        },
    },
    {
        match: (m, u) => m === "GET" && STATIONS_LIST.test(u),
        respond: ({ params }) => {
            const search = params?.search as string | undefined
            const page = Number(params?.page ?? 1)
            const pageSize = Number(params?.page_size ?? 10)
            const filtered = getStations().filter(
                (s) =>
                    matchSearch(s.name, search) ||
                    matchSearch(s.address, search),
            )
            return ok(paginate(filtered, page, pageSize))
        },
    },
    {
        match: (m, u) => m === "POST" && STATIONS_LIST.test(u),
        respond: ({ body }) => {
            const stations = getStations()
            const created: PetrolStation = {
                id: nextId(stations),
                name: body?.name ?? "",
                address: body?.address ?? "",
                latitude: body?.latitude ?? null,
                longitude: body?.longitude ?? null,
                balance: 0,
            }
            setStations([created, ...stations])
            return ok(created, 201)
        },
    },
    {
        match: (m, u) => m === "GET" && STATION_DETAIL.test(u),
        respond: ({ url }) => {
            const id = Number(url.match(STATION_DETAIL)![1])
            const row = getStations().find((s) => s.id === id)
            if (!row) return { status: 404, data: { detail: "Not found" } }
            return ok(row)
        },
    },
    {
        match: (m, u) => m === "PATCH" && STATION_DETAIL.test(u),
        respond: ({ url, body }) => {
            const id = Number(url.match(STATION_DETAIL)![1])
            const stations = getStations()
            const idx = stations.findIndex((s) => s.id === id)
            if (idx < 0) return { status: 404, data: { detail: "Not found" } }
            const updated = { ...stations[idx], ...body }
            stations[idx] = updated
            setStations(stations)
            return ok(updated)
        },
    },
    {
        match: (m, u) => m === "DELETE" && STATION_DETAIL.test(u),
        respond: ({ url }) => {
            const id = Number(url.match(STATION_DETAIL)![1])
            setStations(getStations().filter((s) => s.id !== id))
            setFlows(getFlows().filter((f) => f.petrol_station !== id))
            return ok(null, 204)
        },
    },
    {
        match: (m, u) => m === "GET" && STATION_CASHFLOWS.test(u),
        respond: ({ url, params }) => {
            const id = Number(url.match(STATION_CASHFLOWS)![1])
            const search = params?.search as string | undefined
            const action = params?.action != null ? Number(params.action) : null
            const page = Number(params?.page ?? 1)
            const pageSize = Number(params?.page_size ?? 10)
            const fromDate = params?.from_date as string | undefined
            const toDate = params?.to_date as string | undefined

            const stationFlows = getFlows().filter(
                (f) => f.petrol_station === id,
            )
            const chronological = [...stationFlows].sort(
                (a, b) =>
                    new Date(a.created).getTime() -
                    new Date(b.created).getTime(),
            )
            let running = 0
            const balanceById = new Map<number, number>()
            for (const f of chronological) {
                running += f.action * flowToUzs(f)
                balanceById.set(f.id, running)
            }

            const rows = stationFlows
                .filter((f) => (action == null ? true : f.action === action))
                .filter((f) => inDateRange(f.created, fromDate, toDate))
                .filter(
                    (f) =>
                        matchSearch(f.comment, search) ||
                        matchSearch(f.executor_name, search),
                )
                .sort(
                    (a, b) =>
                        new Date(b.created).getTime() -
                        new Date(a.created).getTime(),
                )
                .map((f) => ({
                    ...f,
                    running_balance: balanceById.get(f.id) ?? 0,
                }))
            return ok(paginate(rows, page, pageSize))
        },
    },
    {
        match: (m, u) => m === "POST" && STATION_TOPUP.test(u),
        respond: ({ url, body }) => {
            const stationId = Number(url.match(STATION_TOPUP)![1])
            const station = getStations().find((s) => s.id === stationId)
            const flows = getFlows()
            const created: CashFlow = {
                id: nextId(flows),
                action: 1,
                amount: Number(body?.amount ?? 0),
                currency: (body?.currency ?? 1) as 1 | 2,
                currency_course:
                    body?.currency_course != null
                        ? Number(body.currency_course)
                        : null,
                comment: body?.comment ?? null,
                petrol_station: stationId,
                petrol_station_name: station?.name ?? null,
                executor: 1,
                executor_name: "Demo Foydalanuvchi",
                driver: null,
                driver_name: null,
                vehicle_plate: null,
                liters: null,
                price_per_liter: null,
                created: new Date().toISOString(),
            }
            setFlows([created, ...flows])
            recalcBalance(stationId)
            return ok(created, 201)
        },
    },
    {
        match: (m, u) => m === "PATCH" && FLOW_PATCH.test(u),
        respond: ({ url, body }) => {
            const id = Number(url.match(FLOW_PATCH)![1])
            const flows = getFlows()
            const idx = flows.findIndex((f) => f.id === id)
            if (idx < 0) return { status: 404, data: { detail: "Not found" } }
            const next = {
                ...flows[idx],
                amount: Number(body?.amount ?? flows[idx].amount),
                currency: (body?.currency ?? flows[idx].currency) as 1 | 2,
                currency_course:
                    body?.currency_course != null
                        ? Number(body.currency_course)
                        : null,
                comment: body?.comment ?? null,
            }
            flows[idx] = next
            setFlows(flows)
            recalcBalance(next.petrol_station)
            return ok(next)
        },
    },
    {
        match: (m, u) => m === "DELETE" && FLOW_DELETE.test(u),
        respond: ({ url }) => {
            const id = Number(url.match(FLOW_DELETE)![1])
            const flows = getFlows()
            const target = flows.find((f) => f.id === id)
            if (!target) return { status: 404, data: { detail: "Not found" } }
            setFlows(flows.filter((f) => f.id !== id))
            recalcBalance(target.petrol_station)
            return ok(null, 204)
        },
    },
]
