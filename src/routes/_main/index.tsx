import Forbidden from "@/components/custom/forbidden"
import { usePaths } from "@/hooks/usePaths"
import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_main/")({
    component: Landing,
})

function Landing() {
    const { firstAllowedPath, isLoadingPermissions } = usePaths()

    if (isLoadingPermissions) {
        return null
    }

    if (!firstAllowedPath) {
        return <Forbidden />
    }

    return <Navigate to={firstAllowedPath} replace />
}
