const SECTION_LABELS: Record<string, string> = {
    user: "Foydalanuvchi",
    users: "Foydalanuvchilar",
    role: "Rol",
    roles: "Rollar",
    profile: "Profil",
    auth: "Avtorizatsiya",

    driver: "Haydovchi",
    drivers: "Haydovchilar",
    driverprofile: "Haydovchi profili",
    driver_profile: "Haydovchi profili",
    driversalary: "Oylik tarif",
    driver_salary: "Oylik tarif",
    driver_salaries: "Oylik tariflar",

    vehicle: "Avtomobil",
    vehicles: "Avtomobillar",
    vehicletype: "Mashina turi",
    vehicle_type: "Mashina turi",
    vehicle_types: "Mashina turlari",
    truck: "Avtomobil",
    trailer: "Tirkama",

    vehiclecashflow: "Avtomobil kassasi",
    vehicle_cash_flow: "Avtomobil kassasi",
    cashflow: "Kassa",
    cash_flow: "Kassa",
    kassa: "Kassa",

    technicalinspection: "Texnik ko'rik",
    technical_inspection: "Texnik ko'rik",
    technic_check: "Texnik ko'rik",
    "technic-check": "Texnik ko'rik",
    texnik_check: "Texnik ko'rik",

    trip: "Reys",
    trips: "Reyslar",
    reys: "Reys",
    reyslar: "Reyslar",
    run: "Reys",
    runs: "Reyslar",
    monitoring: "Monitoring",

    order: "Buyurtma",
    orders: "Buyurtmalar",

    transaction: "Tranzaksiya",
    transactions: "Tranzaksiyalar",
    tranzaksiya: "Tranzaksiya",
    tranzaksiyalar: "Tranzaksiyalar",
    checkout: "To'lov",

    cargotype: "Yuk turi",
    cargo_type: "Yuk turi",
    cargo_types: "Yuk turlari",
    paymenttype: "To'lov turi",
    payment_type: "To'lov turi",
    payment_types: "To'lov turlari",
    expensetype: "Xarajat turi",
    expense_type: "Xarajat turi",
    expense_types: "Xarajat turlari",
    expensecategory: "Xarajat turi",
    expense_category: "Xarajat turi",
    expense_categories: "Xarajat turlari",

    client: "Mijoz",
    clients: "Mijozlar",
    customer: "Mijoz",
    customers: "Mijozlar",

    route: "Yo'nalish",
    routes: "Yo'nalishlar",
    direction: "Yo'nalish",
    directions: "Yo'nalishlar",
    location: "Manzil",
    locations: "Manzillar",
    place: "Manzil",
    places: "Manzillar",
    country: "Davlat",
    countries: "Davlatlar",
    region: "Viloyat",
    regions: "Viloyatlar",
    district: "Tuman",
    districts: "Tumanlar",

    petrolstation: "Zapravka",
    petrol_station: "Zapravka",
    petrol_stations: "Zapravkalar",

    warehouse: "Ombor",
    ombor: "Ombor",

    accounting: "Buxgalteriya",
    buxgalteriya: "Buxgalteriya",
    finance: "Moliya",
    moliya: "Moliya",

    manager: "Meneger",
    managers: "Meneger",
    investor: "Investor",
    trucks: "Avtomobillar",

    dashboard: "Boshqaruv paneli",
    settings: "Sozlamalar",
    sozlamalar: "Sozlamalar",
    logs: "Faoliyat jurnali",
    log: "Faoliyat jurnali",
    mobile: "Mobil ilova",
    selectable: "Yordamchi ma'lumotlar",
}

const UZBEK_CHARS_RE = /[ʼ'`]|[a-z]/

const isLikelyUzbek = (s: string) => {
    const lower = s.toLowerCase()
    return [
        "yuklash",
        "tushirish",
        "yo'nalish",
        "haydovchi",
        "mijoz",
        "rey",
        "kassa",
        "tranzaksiya",
        "ombor",
        "buxgalter",
        "moliya",
        "zapravka",
        "texnik",
        "sozlama",
        "avtomobil",
        "tirkama",
        "manzil",
        "viloyat",
        "tuman",
        "yuk",
        "lavozim",
        "smena",
        "davomat",
        "oylik",
    ].some((stem) => lower.includes(stem))
}

export const getSectionLabel = (section: string | null | undefined): string => {
    if (!section) return "—"
    const raw = section.toString().trim()
    if (!raw) return "—"

    const key = raw.toLowerCase().replace(/\s+/g, "_")
    const found =
        SECTION_LABELS[key] ??
        SECTION_LABELS[key.replace(/_/g, "")] ??
        SECTION_LABELS[key.replace(/_/g, "-")] ??
        SECTION_LABELS[key.replace(/-/g, "_")]
    if (found) return found

    if (UZBEK_CHARS_RE.test(raw) && isLikelyUzbek(raw)) return raw

    return raw
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase())
}
