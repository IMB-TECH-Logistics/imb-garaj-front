import Kassa from "@/pages/home/kassa"
import KassaV2 from "@/pages/home/kassa/v2"
import VstKassa from "@/pages/home/kassa/vst"
import { useUser } from "@/constants/useUser"
import { createLazyFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

const KassaBody = () => {
    const { data } = useUser()
    if (!data) return null
    if (data.kassa_mode === "driver_cash" && data.kassa_version === 2) return <KassaV2 />
    return data.kassa_mode === "driver_cash" ? <VstKassa /> : <Kassa />
}

const KassaPage = () => {
    const { t } = useTranslation()
    return (
        <>
            <h1 className="sr-only">{t("nav.kassa")}</h1>
            <KassaBody />
        </>
    )
}

export const Route = createLazyFileRoute("/_main/kassa/")({
    component: KassaPage,
})
