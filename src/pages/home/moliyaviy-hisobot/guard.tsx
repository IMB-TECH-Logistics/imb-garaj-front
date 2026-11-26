import { useUser } from "@/constants/useUser"
import { Navigate } from "@tanstack/react-router"
import { ReactNode } from "react"

/** Moliyaviy hisobot faqat kontragent yoqilgan firmada (Izumi). Boshqalarda bosh sahifaga qaytaradi. */
export const FinReportGuard = ({ children }: { children: ReactNode }) => {
    const { data: me, isLoading } = useUser()
    if (isLoading || !me) return null
    const investorsV1 = me.investor_version === 1 || import.meta.env.VITE_INVESTORS_V1 === "1"
    if (investorsV1 || !me.kontragent_enabled) return <Navigate to="/" replace />
    return <>{children}</>
}
