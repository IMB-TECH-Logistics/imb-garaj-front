import { PROFILE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import type { TPermissions } from "@/types/common/permissions"

export const moduleOfCode = (code: string) =>
    code.replace(/_(view|control)$/, "")

export const useUser = () => {
    const { data, ...other } = useGet<User>(PROFILE)

    const actions = data?.actions

    return {
        data,
        actions,
        ...other,
    }
}

export function useHasAction(
    actionCodes: TPermissions | TPermissions[],
): boolean {
    const { actions, data } = useUser()

    const disabledModules = data?.disabled_modules ?? []
    const requested = Array.isArray(actionCodes) ? actionCodes : [actionCodes]
    const codes = requested.filter(
        (code) => !disabledModules.includes(moduleOfCode(code)),
    )

    if (codes.length === 0) return false

    if (data?.is_superuser) return true

    if (!actions || !Array.isArray(actions)) return false

    return codes.some((code) => actions.includes(code))
}
