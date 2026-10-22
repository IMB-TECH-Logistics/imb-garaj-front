import type { AlertItem, AlertListResponse, AlertSettingsValues, VehicleAlertSettings } from "@/components/alerts/types"
import { FormNumberInput } from "@/components/form/number-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { ALERTS, ALERTS_COUNTS, ALERTS_VEHICLE_SETTINGS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { usePut } from "@/hooks/usePut"
import { formatDateTime } from "@/lib/format-date"
import { handleFormError } from "@/lib/show-form-errors"
import { ALERT_FIELDS } from "@/pages/home/settings/alerts/fields"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const VEHICLE_ALERT_SETTINGS_MODAL = "vehicle-alert-settings"

const HISTORY_PAGE_SIZE = 10

type FormValues = Record<keyof AlertSettingsValues, string>

const toForm = (data?: VehicleAlertSettings): FormValues =>
    Object.fromEntries(
        ALERT_FIELDS.map(({ name }) => [name, data?.[name] == null ? "" : String(data[name])]),
    ) as FormValues

const toPayload = (values: FormValues) =>
    Object.fromEntries(
        ALERT_FIELDS.map(({ name }) => [name, values[name] === "" || values[name] == null ? null : Number(values[name])]),
    )

export default function VehicleAlertSettingsContent() {
    const { t } = useTranslation()
    const { id } = useParams({ strict: false })
    const queryClient = useQueryClient()
    const hasControl = useHasAction("manager_vehicles_control")
    const [page, setPage] = useState(1)

    const settingsUrl = `${ALERTS_VEHICLE_SETTINGS}/${id}`
    const { data, isLoading } = useGet<VehicleAlertSettings>(settingsUrl, { enabled: !!id })
    const { data: history, isLoading: historyLoading } = useGet<AlertListResponse>(ALERTS, {
        params: { vehicle: id, kind: "unassigned_drive", page, page_size: HISTORY_PAGE_SIZE },
        enabled: !!id,
    })

    const form = useForm<FormValues>({ values: data ? toForm(data) : undefined })

    const { mutate, isPending } = usePut({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            queryClient.invalidateQueries({ queryKey: [settingsUrl] })
            queryClient.invalidateQueries({ queryKey: [ALERTS] })
            queryClient.invalidateQueries({ queryKey: [ALERTS_COUNTS] })
        },
        onError: (error: unknown) => handleFormError(error, form),
    })

    const columns = useMemo<ColumnDef<AlertItem>[]>(
        () => [
            {
                header: t("form.date"),
                id: "started_at",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.original.started_at ?? row.original.created_at)}
                    </span>
                ),
            },
            {
                header: t("alerts.vehicle_settings.distance"),
                id: "distance_km",
                cell: ({ row }) =>
                    row.original.distance_km != null ?
                        <span className="whitespace-nowrap">{row.original.distance_km} {t("alerts.units.km")}</span>
                    :   "-",
            },
            {
                header: t("alerts.vehicle_settings.duration"),
                id: "duration_minutes",
                cell: ({ row }) =>
                    row.original.duration_minutes != null ?
                        <span className="whitespace-nowrap">{row.original.duration_minutes} {t("alerts.units.minutes")}</span>
                    :   "-",
            },
            {
                header: t("form.driver"),
                id: "driver",
                cell: ({ row }) => row.original.driver?.name ?? "-",
            },
            {
                header: t("alerts.vehicle_settings.state"),
                id: "status",
                cell: ({ row }) =>
                    row.original.status === "open" ?
                        <Badge variant="orange">{t("alerts.tab_open")}</Badge>
                    :   <Badge variant="secondary">{t("alerts.status_resolved")}</Badge>,
            },
            {
                header: t("alerts.vehicle_settings.resolution"),
                id: "resolution",
                cell: ({ row }) => {
                    const alert = row.original
                    if (alert.status === "open") return "-"
                    return (
                        <div className="space-y-0.5 text-xs">
                            <p className="text-muted-foreground">
                                {[
                                    alert.resolved_by_name,
                                    formatDateTime(alert.resolved_at ?? undefined),
                                    alert.resolve_reason ? t(`alerts.reason.${alert.resolve_reason}`) : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                            {alert.comment && <p className="italic break-words">{alert.comment}</p>}
                        </div>
                    )
                },
            },
        ],
        [t],
    )

    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("alerts.vehicle_settings.hint")}</p>
                {isLoading ?
                    <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
                :   <form
                        onSubmit={form.handleSubmit((values) => mutate(settingsUrl, toPayload(values)))}
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ALERT_FIELDS.map((field) => (
                                <FormNumberInput
                                    key={field.name}
                                    name={field.name}
                                    label={t(`alerts.settings.fields.${field.name}`)}
                                    control={form.control}
                                    decimalScale={field.decimalScale}
                                    allowNegative={false}
                                    disabled={!hasControl}
                                    placeholder={data ? String(data.effective[field.name]) : undefined}
                                    suffix={` ${t(`alerts.units.${field.unit}`)}`}
                                />
                            ))}
                        </div>
                        {hasControl && (
                            <div className="flex justify-end">
                                <Button className="min-w-36 w-full sm:w-max" type="submit" loading={isPending}>
                                    {t("actions.save")}
                                </Button>
                            </div>
                        )}
                    </form>
                }
            </section>

            <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                    {t("alerts.vehicle_settings.history_title")}
                </h3>
                <DataTable
                    loading={historyLoading}
                    columns={columns}
                    data={history?.results}
                    viewAll
                />
                {(!!history?.previous || !!history?.next) && (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!history?.previous}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            {t("actions.back")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!history?.next}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            {t("alerts.show_more")}
                        </Button>
                    </div>
                )}
            </section>
        </div>
    )
}
