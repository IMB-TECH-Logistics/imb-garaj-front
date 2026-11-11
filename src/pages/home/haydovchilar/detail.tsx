import { format } from "date-fns"
import ParamTabs from "@/components/as-params/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_OVERVIEW } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { formatDriverLicense, formatPassportSerial } from "@/lib/format-driver-docs"
import { formatExperience } from "@/lib/format-experience"
import { formatMoney } from "@/lib/format-money"
import DriverFormPage from "./driver-form-page"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import {
    AlertTriangle,
    ArrowLeft,
    Heart,
    HeartPulse,
    MapPin,
    Route,
    Scale,
    ShieldCheck,
    Wrench,
    Calendar,
    CalendarClock,
    Clock,
    CreditCard,
    Edit,
    IdCard,
    MessageSquareText,
    Phone,
    PhoneCall,
    Plane,
    Truck,
    User,
} from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type DriverOverview = {
    id: number
    full_name: string
    first_name: string
    last_name: string
    phone: string | null
    passport_serial: string | null
    pinfl: string | null
    driver_license: string | null
    driver_license_date: string | null
    experience: number
    hired_at: string | null
    experience_months: number | null
    relative_phone_1?: string | null
    relative_phone_2?: string | null
    relative_contact_1?: string | null
    relative_contact_2?: string | null
    can_go_abroad?: boolean
    note?: string
    photo?: string | null
    middle_name?: string | null
    birth_date?: string | null
    marital_status?: string | null
    address?: string | null
    license_issued_date?: string | null
    license_categories?: string[] | null
    has_adr?: boolean | null
    has_international?: boolean | null
    previous_jobs?: { company: string; position: string; period: string; leave_reason: string }[] | null
    vehicle_brands?: string | null
    can_repair?: boolean | null
    ready_for_long_trips?: boolean | null
    had_accident?: boolean | null
    accident_note?: string | null
    health?: string | null
    health_note?: string | null
    convicted?: boolean | null
    completed_trips: number
    total_trips: number
    ongoing_trips: number
    completed_orders: number
    total_orders: number
    revenue_uzs: string | number
    salary_paid_uzs: string | number
    computed_balance_uzs: string | number
    price_diff_uzs?: string | number
    salary_balance_uzs?: string | number
    salary_due_uzs?: string | number
    price_diff_debt_uzs?: string | number
    debt_total_uzs?: string | number
    total_distance_km: string | number
    total_fuel_liters: string | number
    fuel_per_100km: string | number
    total_fuel_gas: string | number
    fuel_gas_per_100km: string | number
    coverage: number
    last_trip: null | {
        id: number
        start: string | null
        end: string | null
        vehicle_plate: string | null
        income_uzs: string | number
        expense_uzs: string | number
        orders_count: number
    }
}

type DriverTripRow = {
    id: number
    start: string | null
    end: string | null
    loading: string | null
    unloading: string | null
    vehicle_plate: string | null
    start_mileage: number
    end_mileage: number
    orders_count: number
    income_uzs: string | number
    expense_uzs: string | number
    driver_earnings: string | number
    salary_unpaid_uzs?: string | number
    status: "completed" | "ongoing" | "pending"
}

const num = (v: unknown) => Number(v ?? 0) || 0


function formatMoneyText(n: number): string {
    const negative = n < 0
    // Round doubles to at most two figures after the comma.
    const abs = Math.round(Math.abs(n) * 100) / 100
    const [int, dec] = abs.toString().split(".")
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    return (negative ? "-" : "") + grouped + (dec && Number(dec) > 0 ? `.${dec}` : "")
}

function formatDate(s?: string | null) {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return format(d, "dd/MM/yyyy")
}

function statusBadge(s: DriverTripRow["status"]) {
    if (s === "completed") return { labelKey: "status.done", variant: "default" as const }
    if (s === "ongoing") return { labelKey: "status.on_road", variant: "outline" as const }
    return { labelKey: "status.pending", variant: "secondary" as const }
}

const useAylanmaCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<DriverTripRow>[]>(
        () => [
            {
                header: t("page.turnover_detail"),
                id: "trip_range",
                cell: ({ row }) => {
                    const s = row.original.start
                    const e = row.original.end
                    if (!s && !e)
                        return <span className="text-muted-foreground">—</span>
                    return (
                        <span className="whitespace-nowrap tabular-nums">
                            {formatDate(s)} → {formatDate(e)}
                        </span>
                    )
                },
            },
            {
                header: t("form.direction"),
                id: "route",
                cell: ({ row }) => (
                    <span className="block break-words">
                        {row.original.loading || "—"} →{" "}
                        {row.original.unloading || "—"}
                    </span>
                ),
            },
            {
                header: t("table.auto_short"),
                accessorKey: "vehicle_plate",
                cell: ({ row }) =>
                    row.original.vehicle_plate || (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                header: t("page.trips"),
                accessorKey: "orders_count",
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.orders_count}
                    </span>
                ),
            },
            {
                header: t("table.status"),
                id: "status",
                cell: ({ row }) => {
                    const s = statusBadge(row.original.status)
                    return <Badge variant={s.variant}>{t(s.labelKey)}</Badge>
                },
            },
            {
                header: t("fleet.drivers.revenue_cash"),
                accessorKey: "income_uzs",
                cell: ({ row }) => (
                    <span className="tabular-nums text-green-600">
                        {formatMoney(num(row.original.income_uzs))}
                    </span>
                ),
            },
            {
                header: t("fleet.drivers.salary_due"),
                accessorKey: "driver_earnings",
                cell: ({ row }) => {
                    const v = num(row.original.driver_earnings)
                    return v > 0 ? (
                        <span className="text-amber-600 font-medium whitespace-nowrap tabular-nums">
                            {formatMoney(v)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                },
            },
            {
                header: t("fleet.drivers.salary_status"),
                id: "salary_status",
                cell: ({ row }) => {
                    const total = num(row.original.driver_earnings)
                    const unpaid = num(row.original.salary_unpaid_uzs)
                    if (total <= 0) return <span className="text-muted-foreground">—</span>
                    if (unpaid <= 0)
                        return <Badge className="border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">{t("status.given")}</Badge>
                    if (unpaid >= total)
                        return <Badge className="border-transparent bg-rose-500/10 text-rose-600 hover:bg-rose-500/10">{t("status.not_given")}</Badge>
                    return (
                        <Badge className="border-transparent bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 whitespace-nowrap">
                            {t("fleet.drivers.salary_partial", { amount: formatMoneyText(unpaid) })}
                        </Badge>
                    )
                },
            },
        ],
        [t],
    )
}


const InfoField = ({
    label,
    value,
    icon,
}: {
    label: string
    value: React.ReactNode
    icon?: React.ReactNode
}) => (
    <div className="text-sm leading-6 break-words flex items-start gap-2">
        {icon && (
            <span className="text-muted-foreground shrink-0 mt-1">{icon}</span>
        )}
        <span className="text-muted-foreground w-44 shrink-0">{label}:</span>
        <span className="text-foreground min-w-0 flex-1">
            {value === null || value === undefined || value === "" ?
                <span className="text-muted-foreground">—</span>
            :   value}
        </span>
    </div>
)

const InfoSection = ({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) => (
    <section className="border rounded-2xl px-5 py-4 bg-card shadow-sm">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <div className="flex flex-col gap-1.5">{children}</div>
    </section>
)

const HeadRow = ({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode
    label: string
    children: React.ReactNode
}) => (
    <div className="flex items-center flex-wrap sm:gap-3 gap-1.5">
        <div className="flex items-center gap-2 min-w-36 text-muted-foreground">
            {icon}
            <span>{label}:</span>
        </div>
        <span>{children}</span>
    </div>
)

const SumRow = ({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) => (
    <div className="flex w-full gap-2 items-center justify-between border-b pb-1">
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <span className="font-medium text-right tabular-nums whitespace-nowrap">
            {children}
        </span>
    </div>
)

const relative = (phone?: string | null, contact?: string | null) =>
    phone ?
        <span>
            {formatPhoneNumber(phone)}
            {contact ?
                <span className="text-muted-foreground"> · {contact}</span>
            :   null}
        </span>
    :   null

export default function HaydovchiDetail() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams({ strict: false }) as { id: string }
    const search = useSearch({ strict: false }) as any
    const driverId = Number(id)
    const canEdit = useHasAction("hr_drivers_control")

    const { data: overview, isError: overviewError, isLoading: overviewLoading } = useGet<DriverOverview>(
        `${DRIVERS_OVERVIEW}/${driverId}/overview`,
        { enabled: !!driverId, options: { retry: false } },
    )

    const { data: trips, isLoading: tripsLoading } = useGet<DriverTripRow[]>(
        `${DRIVERS_OVERVIEW}/${driverId}/trips`,
        { enabled: !!driverId },
    )

    const aylanmaCols = useAylanmaCols()

    const setEditing = (on: boolean) =>
        navigate({
            search: ((prev: any) => ({ ...prev, edit: on ? "1" : undefined })) as any,
        })

    if (search?.edit === "1" && canEdit) {
        return (
            <DriverFormPage
                driverId={driverId}
                onBack={() => setEditing(false)}
                onSaved={() => setEditing(false)}
            />
        )
    }

    if (overviewLoading) {
        return <div className="py-20 flex justify-center text-muted-foreground">{t("messages.loading")}</div>
    }

    if (overviewError || !overview) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                <p className="text-lg font-medium">{t("page.not_found")}</p>
                <Button onClick={() => navigate({ to: "/haydovchilar" })}>
                    <ArrowLeft size={16} className="mr-2" />
                    {t("page.back_to_list")}
                </Button>
            </div>
        )
    }

    const handleAylanmaClick = (row: DriverTripRow) => {
        navigate({
            to: "/haydovchilar/$id/aylanma/$tripId",
            params: { id, tripId: String(row.id) },
            search: {
                name: search?.name,
                start: row.start ?? undefined,
                end: row.end ?? undefined,
            } as any,
        })
    }

    const handleEdit = () => setEditing(true)

    const fullName = overview.full_name || search?.name || t("form.driver")
    const initials = `${overview.first_name?.[0] ?? ""}${overview.last_name?.[0] ?? ""}`.toUpperCase()
    const balance = num(overview.computed_balance_uzs)
    const salaryDue = num(overview.salary_due_uzs)
    const licenseExpired =
        !!overview.driver_license_date &&
        new Date(overview.driver_license_date) < new Date()
    const experience = formatExperience(
        t,
        overview.experience_months,
        overview.experience,
    )

    const yesNo = (v?: boolean | null) =>
        v === true ? t("actions.yes")
        : v === false ? t("actions.no")
        : null
    const withNote = (v?: boolean | null, note?: string | null) =>
        yesNo(v) ?
            <span>
                {yesNo(v)}
                {note ? <span className="text-muted-foreground"> · {note}</span> : null}
            </span>
        :   null
    const jobs = overview.previous_jobs ?? []

    const tabs = [
        {
            value: "trips",
            label: (
                <span className="flex items-center gap-1.5">
                    {t("page.turnovers")}
                    <Badge variant="secondary">{trips?.length ?? 0}</Badge>
                </span>
            ),
            content: (
                <Card>
                    <CardContent className="p-4">
                        <DataTable
                            loading={tripsLoading}
                            columns={aylanmaCols}
                            data={trips ?? []}
                            numeration
                            viewAll
                            onRowClick={handleAylanmaClick}
                            wrapperClassName="p-0 bg-transparent"
                        />
                    </CardContent>
                </Card>
            ),
        },
        {
            value: "info",
            label: t("driver_profile.info"),
            content: (
                <div className="grid lg:grid-cols-2 gap-3">
                    <InfoSection title={t("driver_profile.personal")}>
                        <InfoField icon={<User size={16} />} label={t("form.first_name")} value={`${overview.first_name ?? ""} ${overview.last_name ?? ""} ${overview.middle_name ?? ""}`.trim()} />
                        <InfoField icon={<Calendar size={16} />} label={t("anketa.birth_date")} value={overview.birth_date ? formatDate(overview.birth_date) : null} />
                        <InfoField icon={<Heart size={16} />} label={t("anketa.marital_status")} value={overview.marital_status ? t(`anketa.marital.${overview.marital_status}`) : null} />
                        <InfoField icon={<MapPin size={16} />} label={t("anketa.address")} value={overview.address} />
                        <InfoField icon={<Phone size={16} />} label={t("form.phone")} value={overview.phone ? formatPhoneNumber(overview.phone) : null} />
                        <InfoField icon={<PhoneCall size={16} />} label={t("form.relative_phone_1")} value={relative(overview.relative_phone_1, overview.relative_contact_1)} />
                        <InfoField icon={<PhoneCall size={16} />} label={t("form.relative_phone_2")} value={relative(overview.relative_phone_2, overview.relative_contact_2)} />
                    </InfoSection>
                    <InfoSection title={t("nav.documents")}>
                        <InfoField icon={<IdCard size={16} />} label={t("form.passport")} value={formatPassportSerial(overview.passport_serial)} />
                        <InfoField icon={<IdCard size={16} />} label={t("form.jshshir")} value={overview.pinfl} />
                        <InfoField icon={<CreditCard size={16} />} label={t("form.license_number")} value={formatDriverLicense(overview.driver_license)} />
                        <InfoField
                            icon={<CalendarClock size={16} />}
                            label={t("form.license_expiry")}
                            value={
                                overview.driver_license_date ?
                                    <span className={licenseExpired ? "text-red-500 font-medium" : undefined}>
                                        {formatDate(overview.driver_license_date)}
                                    </span>
                                :   null
                            }
                        />
                        <InfoField icon={<CalendarClock size={16} />} label={t("anketa.license_issued")} value={overview.license_issued_date ? formatDate(overview.license_issued_date) : null} />
                        <InfoField icon={<CreditCard size={16} />} label={t("anketa.categories")} value={(overview.license_categories ?? []).join(", ")} />
                        <InfoField icon={<ShieldCheck size={16} />} label={t("anketa.adr")} value={yesNo(overview.has_adr)} />
                        <InfoField icon={<ShieldCheck size={16} />} label={t("anketa.international")} value={yesNo(overview.has_international)} />
                    </InfoSection>
                    <InfoSection title={t("driver_profile.work")}>
                        <InfoField icon={<Calendar size={16} />} label={t("form.hired_at")} value={overview.hired_at ? formatDate(overview.hired_at) : null} />
                        <InfoField icon={<Clock size={16} />} label={t("form.work_experience")} value={experience} />
                        <InfoField icon={<Truck size={16} />} label={t("driver_profile.last_vehicle")} value={overview.last_trip?.vehicle_plate} />
                        <InfoField
                            icon={<Plane size={16} />}
                            label={t("form.can_go_abroad")}
                            value={
                                overview.can_go_abroad ?
                                    <span className="font-medium text-emerald-600">{t("actions.yes")}</span>
                                :   <span className="text-muted-foreground">{t("actions.no")}</span>
                            }
                        />
                    </InfoSection>
                    <InfoSection title={t("anketa.skills")}>
                        <InfoField icon={<Truck size={16} />} label={t("anketa.vehicle_brands")} value={overview.vehicle_brands} />
                        <InfoField icon={<Wrench size={16} />} label={t("anketa.can_repair")} value={yesNo(overview.can_repair)} />
                        <InfoField icon={<Route size={16} />} label={t("anketa.long_trips")} value={yesNo(overview.ready_for_long_trips)} />
                    </InfoSection>
                    <InfoSection title={t("anketa.extra")}>
                        <InfoField icon={<AlertTriangle size={16} />} label={t("anketa.accident")} value={withNote(overview.had_accident, overview.accident_note)} />
                        <InfoField
                            icon={<HeartPulse size={16} />}
                            label={t("anketa.health_label")}
                            value={
                                overview.health ?
                                    <span>
                                        {t(`anketa.health.${overview.health}`)}
                                        {overview.health_note ? <span className="text-muted-foreground"> · {overview.health_note}</span> : null}
                                    </span>
                                :   overview.health_note || null
                            }
                        />
                        <InfoField icon={<Scale size={16} />} label={t("anketa.convicted")} value={yesNo(overview.convicted)} />
                    </InfoSection>
                    <InfoSection title={t("anketa.jobs")}>
                        {jobs.length === 0 ?
                            <span className="text-sm text-muted-foreground">—</span>
                        :   jobs.map((j, i) => (
                                <div key={i} className="text-sm border-b last:border-b-0 pb-2 last:pb-0">
                                    <div className="font-medium">{j.company || "—"}</div>
                                    <div className="text-muted-foreground">
                                        {[j.position, j.period, j.leave_reason && `${t("anketa.job_reason")}: ${j.leave_reason}`].filter(Boolean).join(" · ")}
                                    </div>
                                </div>
                            ))
                        }
                    </InfoSection>
                    <InfoSection title={t("note.title")}>
                        <p className="text-sm whitespace-pre-wrap">
                            {overview.note || <span className="text-muted-foreground">—</span>}
                        </p>
                    </InfoSection>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="default"
                        size="icon"
                        onClick={() => navigate({ to: "/haydovchilar" })}
                        className="shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <h1 className="text-xl font-semibold">{t("driver_profile.title")}</h1>
                </div>
                {canEdit && (
                    <Button onClick={handleEdit}>
                        <Edit size={18} />
                    </Button>
                )}
            </div>

            <div className="bg-card shadow-sm border relative rounded-lg p-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-full sm:w-[160px] h-[180px] rounded-lg border flex items-center justify-center bg-muted text-4xl font-semibold text-muted-foreground shrink-0 overflow-hidden">
                            {overview.photo ?
                                <img
                                    src={overview.photo}
                                    alt={fullName}
                                    className="w-full h-full object-cover object-center"
                                />
                            :   initials || <User size={48} />}
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <div className="font-bold text-2xl mb-2 flex items-center gap-2 flex-wrap">
                                <span>{fullName}</span>
                                {overview.can_go_abroad && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                        <Plane size={13} />
                                        {t("form.can_go_abroad")}
                                    </span>
                                )}
                            </div>
                            <HeadRow icon={<Phone size={16} />} label={t("form.phone")}>
                                {overview.phone ?
                                    <a href={`tel:${overview.phone}`} className="hover:text-primary">
                                        {formatPhoneNumber(overview.phone)}
                                    </a>
                                :   "—"}
                            </HeadRow>
                            <HeadRow icon={<Truck size={16} />} label={t("driver_profile.last_vehicle")}>
                                {overview.last_trip?.vehicle_plate || "—"}
                            </HeadRow>
                            <HeadRow icon={<Calendar size={16} />} label={t("form.hired_at")}>
                                {overview.hired_at ? `${formatDate(overview.hired_at)}${experience ? ` · ${experience}` : ""}` : "—"}
                            </HeadRow>
                            <HeadRow icon={<CalendarClock size={16} />} label={t("form.license_expiry")}>
                                {overview.driver_license_date ?
                                    <span className={licenseExpired ? "text-red-500 font-medium" : undefined}>
                                        {formatDate(overview.driver_license_date)}
                                    </span>
                                :   "—"}
                            </HeadRow>
                            {overview.note && (
                                <HeadRow icon={<MessageSquareText size={16} />} label={t("note.title")}>
                                    <span className="line-clamp-2">{overview.note}</span>
                                </HeadRow>
                            )}
                        </div>
                    </div>
                    <div className="xl:col-span-1">
                        <div className="flex-col border p-4 rounded-lg flex gap-2 h-full">
                            <SumRow label={t("page.turnovers")}>
                                {overview.completed_trips}/{overview.total_trips}
                            </SumRow>
                            <SumRow label={t("page.trips")}>
                                {overview.completed_orders}/{overview.total_orders}
                            </SumRow>
                            <SumRow label={t("fleet.drivers.revenue_cash")}>
                                <span className="text-green-600">{formatMoneyText(num(overview.revenue_uzs))}</span>
                            </SumRow>
                            <SumRow label={t("fleet.drivers.fuel_l_100km")}>
                                {num(overview.fuel_per_100km) > 0 ? num(overview.fuel_per_100km).toFixed(1) : "—"}
                            </SumRow>
                            <SumRow label={t("fleet.drivers.fuel_gas_100km")}>
                                {num(overview.fuel_gas_per_100km) > 0 ? num(overview.fuel_gas_per_100km).toFixed(1) : "—"}
                            </SumRow>
                            <div className="flex w-full gap-2 items-center justify-between mt-auto pt-1">
                                <span className="font-semibold">{t("fleet.drivers.cash_in_hand")}</span>
                                <span className={`text-xl font-bold tabular-nums ${balance < 0 ? "text-red-500" : balance > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                                    {formatMoneyText(balance)}
                                </span>
                            </div>
                            <div className="flex w-full gap-2 items-center justify-between">
                                <span className="font-semibold">{t("fleet.drivers.salary_due")}</span>
                                <span className={`text-xl font-bold tabular-nums ${salaryDue > 0 ? "text-amber-600" : salaryDue < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                    {formatMoneyText(salaryDue)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ParamTabs options={tabs} paramName="driver_tab" />

        </div>
    )
}
