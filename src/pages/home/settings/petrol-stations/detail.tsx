import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, MapPin, Plus } from "lucide-react"
import {
    type StationCashFlowRow,
    useStationCashFlowColumns,
} from "./cashflow-cols"
import { type PetrolStationRow } from "./cols"
import EditCashFlowModal, { useEditCashFlowStore } from "./edit-cashflow-modal"
import TopUpModal from "./top-up-modal"

const PetrolStationDetail = () => {
    const navigate = useNavigate()
    const { id } = useParams({ strict: false }) as { id: string }
    const stationId = Number(id)
    const search = useSearch({ strict: false }) as Record<string, any>

    const hasControl = useHasAction("settings_petrol_stations_control")

    const { data: station } = useGet<PetrolStationRow>(
        `${SETTINGS_PETROL_STATIONS}/${stationId}`,
        { enabled: !!stationId },
    )

    const { data: cashflows, isLoading } = useGet<
        ListResponse<StationCashFlowRow>
    >(`${SETTINGS_PETROL_STATIONS}/${stationId}/cash-flows`, {
        params: {
            search: search.cashflow_search,
            page: search.page,
            page_size: search.page_size,
            action: search.action,
        },
        enabled: !!stationId,
    })

    const { openModal: openTopUp } = useModal("petrol-top-up")
    const cashFlowEdit = useEditCashFlowStore()

    const columns = useStationCashFlowColumns()

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            navigate({ to: "/petrol-stations" })
                        }
                        className="shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold leading-tight">
                            {station?.name ?? "Zapravka"}
                        </h1>
                        {station?.address && (
                            <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
                                <MapPin size={12} />
                                {station.address}
                            </span>
                        )}
                    </div>
                </div>
                {hasControl && (
                    <Button onClick={openTopUp}>
                        <Plus size={16} className="mr-1" />
                        Balansni to'ldirish
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                            Hozirgi balans
                        </div>
                        <div className="text-2xl font-semibold tabular-nums">
                            {formatMoney(Number(station?.balance ?? 0))} so'm
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DataTable
                loading={isLoading}
                columns={columns}
                data={cashflows?.results}
                onEdit={
                    hasControl
                        ? (row) => {
                              if (
                                  (row.original as StationCashFlowRow).action ===
                                  1
                              ) {
                                  cashFlowEdit.open(
                                      row.original as StationCashFlowRow,
                                  )
                              }
                          }
                        : undefined
                }
                numeration
                paginationProps={{
                    totalPages: cashflows?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />

            <Modal
                title="Balansni to'ldirish"
                modalKey="petrol-top-up"
                size="max-w-md"
            >
                <TopUpModal stationId={stationId} />
            </Modal>

            <Modal
                title="To'ldirishni tahrirlash"
                modalKey="petrol-cash-flow-edit"
                size="max-w-md"
            >
                <EditCashFlowModal />
            </Modal>
        </div>
    )
}

export default PetrolStationDetail
