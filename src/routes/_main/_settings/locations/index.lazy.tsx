import Locations from "@/pages/home/settings/locations"
import { createLazyFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

const LocationsRoute = () => {
    const { t } = useTranslation()
    return (
        <>
            <h1 className="sr-only">{t("nav.locations")}</h1>
            <Locations />
        </>
    )
}

export const Route = createLazyFileRoute("/_main/_settings/locations/")({
    component: LocationsRoute,
})
