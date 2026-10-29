import { useUser } from "@/constants/useUser"

export const useVstFinance = () => {
    const { data } = useUser()
    return data?.investor_version === 1 || import.meta.env.VITE_INVESTORS_V1 === "1"
}
