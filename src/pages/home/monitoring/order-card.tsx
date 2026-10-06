import { ORDER_STATUS, STATUS_META } from "./status/data"

const EXTRA_META: Record<number, { label: string; color: string }> = {
    [ORDER_STATUS.COMPLETED]: { label: "Tugallandi", color: "#94a3b8" },
    [ORDER_STATUS.CANCELED]: { label: "Bekor qilindi", color: "#f87171" },
}

export function orderStatusMeta(garageStatus: number | null | undefined) {
    if (garageStatus == null) return { label: "—", color: "#9ca3af" }
    return STATUS_META[garageStatus] ?? EXTRA_META[garageStatus] ?? { label: "—", color: "#9ca3af" }
}
