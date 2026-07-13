import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/datatable";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/custom/modal";
import DeviceModal from "./modal";
import { useModal } from "@/hooks/useModal";
import { useGet } from "@/hooks/useGet";
import { AIRTAG_DEVICE_POST } from "@/constants/api-endpoints";
import { useAirtagDeviceCols } from "./cols";
import DeleteModal from "@/components/custom/delete-modal";
import { useGlobalStore } from "@/store/global-store";

const AirtagDevice = () => {
    const { openModal } = useModal("device-add")
    const { openModal: openDeleteModal } = useModal(`device-delete`)

    const columns = useAirtagDeviceCols()
    const { t } = useTranslation()
    const { data } = useGet(AIRTAG_DEVICE_POST)
    const { setData, getData, clearKey } = useGlobalStore()

    const handleAdd = () => {
        clearKey(`device-data`)
        openModal()
    }
    const handleDelete = (employee: AirtagDevice) => {
        if (!employee.id) return
        setData(`device-data`, employee)
        openDeleteModal()
    }

    const handleUpdate = (employee: AirtagDevice) => {
        if (!employee.id) return
        setData(`device-data`, employee)
        openModal()
    }

    const selecteDevice = useGlobalStore(
        (state) => state.dataMap[`device-data`]
    ) as AirtagDevice | undefined

    return (
        <div>
            <DataTable
                columns={columns}
                data={data?.results || []}
                className="min-w-[900px]"
                onDelete={({ original }) => handleDelete(original)}
                onEdit={({ original }) => handleUpdate(original)}
                paginationProps={{
                    totalPages: data?.pages || 1,
                }}
                head={
                    <div className="mb-3">
                        <div className="flex justify-between items-center gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-medium">
                                    {t("Devicelar ro'yxati")}
                                </h1>


                            </div>

                            <Button
                                className="flex items-center gap-1"
                                onClick={handleAdd}
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:block">
                                    {t("Qo'shish")}
                                </span>
                            </Button>
                        </div>


                    </div>
                }
            />


            <Modal
                modalKey="device-add"
                title={selecteDevice?.id ? t("Device tahrirlash") : t("Device qo'shish")}
            >
                <DeviceModal />
            </Modal>
            <DeleteModal
                modalKey={`device-delete`}
                id={selecteDevice?.id}
                path={AIRTAG_DEVICE_POST}
            />
        </div>
    );
};

export default AirtagDevice;