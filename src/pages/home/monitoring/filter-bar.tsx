import { Combobox } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/datepicker"
import { SETTINGS_SELECTABLE_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useMemo } from "react"
import { mockDriverIdentity } from "./status/data"
import type { DriverOption, MonitoringFilters } from "./types"

type Props = {
    value: MonitoringFilters
    onChange: (next: MonitoringFilters) => void
}

type VehicleOption = { id: number; label: string }

export default function MonitoringFilterBar({ value, onChange }: Props) {
    const { data: drivers } = useGet<DriverOption[]>(
        SETTINGS_SELECTABLE_USERS,
        { params: { role: "driver", page_size: 1000 } },
    )

    // Plate number only — no driver name in the dropdown.
    const vehicleOptions = useMemo<VehicleOption[]>(
        () =>
            (drivers ?? []).map((d) => ({
                id: d.id,
                label: mockDriverIdentity(d.id).plate,
            })),
        [drivers],
    )

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Combobox<VehicleOption>
                options={vehicleOptions}
                value={value.driver}
                setValue={(val) =>
                    onChange({
                        ...value,
                        driver: (val as number | null) ?? null,
                        order: null,
                        trip: null,
                        vehicle: null,
                    })
                }
                label="Avtomobil"
                valueKey="id"
                labelKey="label"
                className="h-9 w-auto min-w-[140px]"
            />

            <DatePicker
                date={value.fromDate ? new Date(value.fromDate) : ""}
                setDate={(d: string) =>
                    onChange({ ...value, fromDate: d, toDate: d })
                }
                placeholder="Sana"
                defaultValue={new Date()}
                className="h-9 w-auto min-w-[120px]"
                calendarProps={{ disabled: { after: new Date() } }}
            />
        </div>
    )
}
