import { useSearch } from "@tanstack/react-router"
import SpendTab from "./spend-tab"
import VehiclesTab from "./vehicles-tab"

export const TexnikCheck = () => {
    const { ti_kind } = useSearch({ strict: false }) as { ti_kind?: string }
    return (
        <div className="flex flex-col w-full gap-3">
            {ti_kind === "spend" ? <SpendTab /> : <VehiclesTab />}
        </div>
    )
}
