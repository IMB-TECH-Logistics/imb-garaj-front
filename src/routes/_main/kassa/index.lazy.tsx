import Kassa from "@/pages/home/kassa"
import KassaV2 from "@/pages/home/kassa/v2"
import VstKassa from "@/pages/home/kassa/vst"
import { useUser } from "@/constants/useUser"
import { createLazyFileRoute } from "@tanstack/react-router"

const KassaPage = () => {
    const { data } = useUser()
    if (!data) return null
    if (data.kassa_mode === "driver_cash" && data.kassa_version === 2) return <KassaV2 />
    return data.kassa_mode === "driver_cash" ? <VstKassa /> : <Kassa />
}

export const Route = createLazyFileRoute("/_main/kassa/")({
    component: KassaPage,
})
