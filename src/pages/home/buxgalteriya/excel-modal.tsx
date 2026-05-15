import { Combobox } from "@/components/ui/combobox"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/form/date-range-picker"
import {
    MANAGERS_RUNS,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_DISTRICT,
    SETTINGS_SELECTABLE_CARGO_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Download } from "lucide-react"

type SelectItem = { id: number | string; name: string }

const EXCEL_MODAL_KEY = "buxgalteriya-excel"

export const useBuxgalteriyaExcelModal = () => useModal(EXCEL_MODAL_KEY)

const toStr = (v: unknown) =>
    v === undefined || v === null || v === "" ? "" : String(v)

const BuxgalteriyaExcelModal = () => {
    const search: any = useSearch({ strict: false })
    const { isOpen, closeModal } = useModal(EXCEL_MODAL_KEY)

    const { data: clients } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_CLIENT, {
        enabled: isOpen,
        params: { model_name: "client" },
    })
    const { data: districts } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_DISTRICT,
        { enabled: isOpen, params: { model_name: "district" } },
    )
    const { data: cargoTypes } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_CARGO_TYPE,
        { enabled: isOpen, params: { model_name: "cargo-type" } },
    )

    const [client, setClient] = useState<string>("")
    const [loading, setLoading] = useState<string>("")
    const [unloading, setUnloading] = useState<string>("")
    const [cargoType, setCargoType] = useState<string>("")
    const [searchText, setSearchText] = useState<string>("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    useEffect(() => {
        if (!isOpen) return
        setClient(toStr(search?.client))
        setLoading(toStr(search?.loading))
        setUnloading(toStr(search?.unloading))
        setCargoType(toStr(search?.cargo_type))
        setSearchText(toStr(search?.search))
        setDateRange({
            from: search?.from_date ? new Date(search.from_date) : undefined,
            to: search?.to_date ? new Date(search.to_date) : undefined,
        })
    }, [isOpen])

    const params = {
        client: client || undefined,
        loading: loading || undefined,
        unloading: unloading || undefined,
        cargo_type: cargoType || undefined,
        search: searchText || undefined,
        from_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        to_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    }

    const { trigger, isFetching } = useDownloadAsExcel({
        url: `${MANAGERS_RUNS}/excel`,
        name: "Buxgalteriya",
        params,
    })

    const handleDownload = async () => {
        await trigger()
        closeModal()
    }

    return (
        <Modal
            modalKey={EXCEL_MODAL_KEY}
            title="Excel yuklab olish"
            size="max-w-2xl"
        >
            <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                    <Combobox
                        label="Firma nomi"
                        options={clients || []}
                        value={client}
                        setValue={(v: any) => setClient(toStr(v))}
                        labelKey="name"
                        valueKey="id"
                    />
                    <Combobox
                        label="Yuk turi"
                        options={cargoTypes || []}
                        value={cargoType}
                        setValue={(v: any) => setCargoType(toStr(v))}
                        labelKey="name"
                        valueKey="id"
                    />
                    <Combobox
                        label="Yuklash joyi"
                        options={districts || []}
                        value={loading}
                        setValue={(v: any) => setLoading(toStr(v))}
                        labelKey="name"
                        valueKey="id"
                    />
                    <Combobox
                        label="Tushirish joyi"
                        options={districts || []}
                        value={unloading}
                        setValue={(v: any) => setUnloading(toStr(v))}
                        labelKey="name"
                        valueKey="id"
                    />
                </div>
                <Input
                    placeholder="Davlat raqami..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <DatePickerWithRange
                    date={dateRange}
                    setDate={setDateRange as any}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={closeModal} type="button">
                        Bekor qilish
                    </Button>
                    <Button
                        onClick={handleDownload}
                        loading={isFetching}
                        icon={<Download width={16} />}
                    >
                        Yuklab olish
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default BuxgalteriyaExcelModal
