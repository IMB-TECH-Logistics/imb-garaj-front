import { ORDER_STATUS, STATUS_META } from "./status/data"

const EXTRA_META: Record<number, { labelKey: string; color: string }> = {
    [ORDER_STATUS.COMPLETED]: { labelKey: "monitoring_stats.status_100", color: "#94a3b8" },
    [ORDER_STATUS.CANCELED]: { labelKey: "monitoring_stats.status_1000", color: "#f87171" },
}

export function orderStatusMeta(garageStatus: number | null | undefined): { labelKey: string | null; color: string } {
    if (garageStatus == null) return { labelKey: null, color: "#9ca3af" }
    return STATUS_META[garageStatus] ?? EXTRA_META[garageStatus] ?? { labelKey: null, color: "#9ca3af" }
}
