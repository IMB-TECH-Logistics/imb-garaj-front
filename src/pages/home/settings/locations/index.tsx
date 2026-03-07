import ParamInput from "@/components/as-params/input"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SETTINGS_COUNTRIES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { CirclePlus, Plus, PlusCircle } from "lucide-react"
import CountriesTable from "./tables/country"
import AddCountriesModal from "./tables/country/add-country"

const Locations = () => {
    const { openModal } = useModal("country-modal")
    const { clearKey } = useGlobalStore()

    const handleCountyModalOpen = () => {
        clearKey(SETTINGS_COUNTRIES)
        openModal()
    }

    return (
        <>
            <Card className="max-w-[3]">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-xl font-semibold tracking-tight">
                            Davlatlar
                        </CardTitle>
                        <div className="flex items-center  gap-4">
                            <div className="w-full sm:w-[360px]">
                                <ParamInput
                                    fullWidth
                                    placeholder="Qidirish..."
                                    searchKey="country_search"
                                    pageKey="page"
                                />
                            </div>
                            <Button
                                className="flex items-center gap-2"
                                onClick={handleCountyModalOpen}
                            >
                                <CirclePlus size={18} />
                                Qo'shish
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pt-0">
                    <div className="h-full rounded-md overflow-hidden">
                        <div className="h-full ">
                            <CountriesTable />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Modal
                size="max-w-xl"
                title="Davlat qo'shish"
                modalKey="country-modal"
            >
                <AddCountriesModal />
            </Modal>
        </>
    )
}

export default Locations
