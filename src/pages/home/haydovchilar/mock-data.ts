type MockDriver = {
    id: number
    first_name: string
    last_name: string
    username: string
    password: string
    last_login: string
    is_superuser: boolean
    date_joined: string
    is_staff: boolean
    is_active: boolean
    role: number
    driver: {
        passport_serial: string
        pinfl: string
        phone: string
        driver_license: string
        driver_license_date: string
        experience: string
    }
}

type MockBalance = { id: number; full_name: string; balance: string }

export type DriverMetrics = {
    id: number
    completed_trips: number
    revenue: number
    fuel_per_100km: number
    coverage: number
    on_time_rate: number
}

const FIRST_NAMES = [
    "Aziz", "Bobur", "Dilshod", "Eldor", "Farrux", "Jasur", "Kamol", "Laziz",
    "Maqsud", "Nodir", "Otabek", "Rustam", "Sherzod", "Timur", "Ulug'bek",
    "Vali", "Zafar", "Asadbek", "Doniyor", "Sardor", "Hasan", "Husan",
    "Ibrohim", "Jamoliddin", "Komron", "Mansur", "Nuriddin", "Olimjon",
    "Polat", "Qahramon", "Ravshan", "Sanjar", "Saidakbar", "Sulaymon",
    "Shoxruz", "Tohirjon", "Umrbek", "Vahobjon", "Xushnud", "Yusufbek",
]

const LAST_NAMES = [
    "Karimov", "Yusupov", "Olimov", "Ergashev", "Salimov", "Hakimov",
    "Ismoilov", "Tursunov", "Mirzayev", "Rasulov", "Sodiqov", "Toshmatov",
    "Umarov", "Xolmatov", "Yodgorov", "Abdullayev", "Boqiyev", "Choriyev",
    "Davlatov", "Fayziyev",
]

function hash(s: string): number {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
    return Math.abs(h)
}

function buildOne(i: number): {
    driver: MockDriver
    balance: MockBalance
    metrics: DriverMetrics
} {
    const h = hash(`driver-${i}`)
    const first = FIRST_NAMES[h % FIRST_NAMES.length]
    const last = LAST_NAMES[(h >> 5) % LAST_NAMES.length]
    const experience = ((h >> 3) % 18) + 1
    const phoneTail = String((h >> 7) % 9_000_000 + 1_000_000)
    const phone = `+998 ${phoneTail.slice(0, 2)} ${phoneTail.slice(2, 5)}-${phoneTail.slice(5, 7)}-${phoneTail.slice(5, 7)}`
    const passport = `AA${String((h >> 11) % 9_000_000 + 1_000_000)}`
    const pinfl = String((h >> 13) % 9 + 1) +
        String((h >> 17) % 10000000000000).padStart(13, "0").slice(0, 13)
    const license = `UZ${String((h >> 19) % 9_000_000 + 1_000_000)}`

    const rawBalance = ((h >> 23) % 200_000_000) - 50_000_000
    const balanceNoise = ((h >> 11) % 5_000_000) - 2_500_000
    const balance = rawBalance + balanceNoise

    const completedTrips = ((h >> 9) % 120) + 5
    const revenue = completedTrips * (3_000_000 + ((h >> 15) % 4_000_000))
    const fuelPer100km = 22 + ((h >> 21) % 16) // 22 - 37 l / 100 km
    const coverage = ((h >> 25) % 11) + 1 // 1 - 11 districts
    const onTimeRate = 60 + ((h >> 27) % 41) // 60% - 100%

    return {
        driver: {
            id: i + 1,
            first_name: first,
            last_name: last,
            username: `${first.toLowerCase()}_${i + 1}`,
            password: "",
            last_login: "",
            is_superuser: false,
            date_joined: "2024-01-01",
            is_staff: false,
            is_active: true,
            role: 3,
            driver: {
                passport_serial: passport,
                pinfl,
                phone,
                driver_license: license,
                driver_license_date: "2030-01-01",
                experience: String(experience),
            },
        },
        balance: {
            id: i + 1,
            full_name: `${first} ${last}`,
            balance: String(balance),
        },
        metrics: {
            id: i + 1,
            completed_trips: completedTrips,
            revenue,
            fuel_per_100km: fuelPer100km,
            coverage,
            on_time_rate: onTimeRate,
        },
    }
}

const built = Array.from({ length: 50 }, (_, i) => buildOne(i))

export const MOCK_DRIVERS = built.map((b) => b.driver) as unknown as DriversType[]
export const MOCK_DRIVER_BALANCES: MockBalance[] = built.map((b) => b.balance)
export const MOCK_DRIVER_METRICS: DriverMetrics[] = built.map((b) => b.metrics)
