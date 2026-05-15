import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import {
    MANAGERS_RUNS,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_DISTRICT,
    SETTINGS_SELECTABLE_CARGO_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { ParamCombobox } from "@/components/as-params/combobox"
import ParamInput from "@/components/as-params/input"
import { useAccountingCols, ReysOrder } from "./cols"
import EditReysModal from "./edit-reys"
import BuxgalteriyaExcelModal, {
    useBuxgalteriyaExcelModal,
} from "./excel-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"

type SelectItem = { id: number | string; name: string }

const BuxgalteriyaPage = () => {
    const search: any = useSearch({ strict: false })
    const { setData } = useGlobalStore()
    const { openModal } = useModal("edit-reys")
    const { openModal: openExcelModal } = useBuxgalteriyaExcelModal()

    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const defaultDateRange =
        !search?.from_date && !search?.to_date
            ? { from: startOfMonth, to: endOfMonth }
            : undefined

    const { data: clients } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_CLIENT, {
        params: { model_name: "client" },
    })
    const { data: districts } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_DISTRICT,
        { params: { model_name: "district" } },
    )
    const { data: cargoTypes } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_CARGO_TYPE,
        { params: { model_name: "cargo-type" } },
    )

    const { data, isLoading } = useGet<ListResponse<ReysOrder>>(
        MANAGERS_RUNS,
        {
            params: {
                from_date: search?.from_date,
                to_date: search?.to_date,
                page: search?.page,
                page_size: search?.page_size,
                search: search?.search,
                client: search?.client,
                loading: search?.loading,
                unloading: search?.unloading,
                cargo_type: search?.cargo_type,
            },
        },
    )

    const columns = useAccountingCols()

    const comboStyle = {
        className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
    }

    const handleEdit = (row: { original: ReysOrder }) => {
        setData(MANAGERS_RUNS, row.original)
        openModal()
    }

    return (
        <div className="space-y-3">
            <DataTable
                columns={columns}
                loading={isLoading}
                data={data?.results || []}
                numeration
                onEdit={handleEdit}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <div className="space-y-3 mb-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg">Reyslar</h1>
                                <Badge>{data?.count ?? 0}</Badge>
                            </div>
                            <div className="flex items-center justify-end gap-3 flex-wrap">
                            <ParamCombobox
                                paramName="client"
                                options={clients || []}
                                label="Firma nomi"
                                addButtonProps={comboStyle}
                            />
                            <ParamCombobox
                                paramName="loading"
                                options={districts || []}
                                label="Yuklash joyi"
                                addButtonProps={comboStyle}
                            />
                            <ParamCombobox
                                paramName="unloading"
                                options={districts || []}
                                label="Tushirish joyi"
                                addButtonProps={comboStyle}
                            />
                            <ParamCombobox
                                paramName="cargo_type"
                                options={cargoTypes || []}
                                label="Yuk turi"
                                addButtonProps={comboStyle}
                            />
                            <ParamInput
                                searchKey="search"
                                placeholder="Davlat raqami..."
                                className="!bg-background dark:!bg-secondary min-w-40"
                            />
                            <ParamDateRange
                                from="from_date"
                                to="to_date"
                                defaultValue={defaultDateRange}
                                addButtonProps={{
                                    className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
                                }}
                            />
                            <Button
                                icon={<Download width={16} />}
                                onClick={openExcelModal}
                            >
                                Excel
                            </Button>
                            </div>
                        </div>
                    </div>
                }
            />

            <Modal
                modalKey="edit-reys"
                title="Reys tahrirlash"
                size="max-w-2xl"
            >
                <EditReysModal />
            </Modal>

            <BuxgalteriyaExcelModal />
        </div>
    )
}

export default BuxgalteriyaPage
