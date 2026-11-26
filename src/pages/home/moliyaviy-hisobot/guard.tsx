import { useUser } from "@/constants/useUser"
import { Navigate } from "@tanstack/react-router"
import { ReactNode } from "react"

/** Moliyaviy hisobot faqat kontragent yoqilgan firmada (Izumi). Boshqalarda bosh sahifaga qaytaradi. */
export const FinReportGuard = ({ children }: { children: ReactNode }) => {
    const { data: me, isLoading } = useUser()
    if (isLoading || !me) return null
    if (!me.kontragent_enabled) return <Navigate to="/" replace />
    return <>{children}</>
}
