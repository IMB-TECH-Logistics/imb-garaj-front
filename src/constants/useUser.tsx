import { PROFILE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"

export const useUser = () => {
    const { data, ...other } = useGet<User>(PROFILE)

    const actions = data?.actions

    return {
        data,
        actions,
        ...other,
    }
}

export function useHasAction(actionCodes: string | string[]): boolean {
    const { actions, data } = useUser()

    if (data?.is_superuser) return true

    if (!actions || !Array.isArray(actions)) return false

    const codes = Array.isArray(actionCodes) ? actionCodes : [actionCodes]

    return codes.some((code) => actions.includes(code))
}
