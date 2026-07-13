import { useModal } from "@/hooks/useModal";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/input";
import { usePost } from "@/hooks/usePost";
import { AIRTAG_DEVICE_GET, AIRTAG_DEVICE_POST } from "@/constants/api-endpoints";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/hooks/usePatch";
import { useGlobalStore } from "@/store/global-store";

const DeviceModal = () => {
    const { closeModal } = useModal("device-add")
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { clearKey } = useGlobalStore()
    const selecteDevice = useGlobalStore(
        (state) => state.dataMap[`device-data`]
    ) as AirtagDevice | undefined

    const form = useForm<CreateAirtagDeviceForm>({
        defaultValues: selecteDevice
            ? {
                device_id: selecteDevice.device_id,
                device_uuid: selecteDevice.device_uuid,
                comment: selecteDevice.comment,
            }
            : undefined,
    })
    const { handleSubmit, control } = form


    const { mutate: createDevice, isPending: isPendingCreate } =
        usePost<CreateAirtagDeviceForm>()

    const { mutate: updateDevice, isPending: isPendingUpdate } = usePatch()

    const isPending = isPendingCreate || isPendingUpdate

    const onSuccess = () => {
        toast.success(
            selecteDevice?.id
                ? t("Device muvaffaqiyatli tahrirlandi!")
                : t("Device muvaffaqiyatli qo'shildi")
        )
        closeModal()
        form.reset()
        clearKey(`device-data`)
        queryClient.invalidateQueries({ queryKey: [AIRTAG_DEVICE_GET] })
        queryClient.invalidateQueries({ queryKey: [AIRTAG_DEVICE_POST] })
    }

    const onSubmit = handleSubmit((values) => {
        if (selecteDevice?.id) {
            updateDevice(`${AIRTAG_DEVICE_POST}/${selecteDevice.id}`, values, { onSuccess })
        } else {
            createDevice(AIRTAG_DEVICE_POST, values, { onSuccess })
        }
    })

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <FormInput
                    name="device_id"
                    label="Device ID"
                    placeholder="Device ID"
                    methods={form}
                    required
                />
                <FormInput
                    name="device_uuid"
                    label="Device UUID"
                    placeholder="Device UUID"
                    methods={form}
                />

            </div>
            <Button type="submit" className="w-full" loading={isPending}>
                {t("Saqlash")}
            </Button>
        </form>
    );
};

export default DeviceModal;
