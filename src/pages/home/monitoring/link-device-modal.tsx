import Modal from "@/components/custom/modal"
import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    MONITORING_GPS_DEVICES,
    MONITORING_GPS_LINK,
    MONITORING_GPS_LIVE,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { Link2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const LINK_MODAL = "gps-link"
const ADD_DEVICE_MODAL = "gps-add-device"
const PAGE_SIZE = 50

type VehicleOption = {
    id: number
    truck_number: string
    gps_imei: string
}

type DeviceOption = {
    imei: string
    name: string
    vehicle: number | null
    vehicle_number: string | null
}

type LinkForm = {
    vehicle: number | null
    imei: string | null
}

type LinkPreset = { id: number; truck_number: string } | null

type DeviceForm = {
    imei: string
    name: string
}

export function LinkDeviceModal() {
    const hasControl = useHasAction("monitoring_control")
    if (!hasControl) return null
    return (
        <Modal
            modalKey={LINK_MODAL}
            title="Mashinaga GPS qurilma biriktirish"
            size="max-w-xl"
        >
            <LinkDeviceForm />
        </Modal>
    )
}

export function LinkGpsIconButton({ vehicle }: { vehicle: { id: number; truck_number: string } }) {
    const { openModal } = useModal(LINK_MODAL)
    const { setData } = useGlobalStore()
    const hasControl = useHasAction("monitoring_control")
    if (!hasControl) return null
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
            aria-label="GPS biriktirish"
            title="GPS biriktirish"
            onClick={() => {
                setData<LinkPreset>(LINK_MODAL, { id: vehicle.id, truck_number: vehicle.truck_number })
                openModal()
            }}
        >
            <Link2 className="h-4 w-4" />
        </Button>
    )
}

export function LinkDeviceButton({ compact = false }: { compact?: boolean }) {
    const { openModal: openLinkModal } = useModal(LINK_MODAL)
    const { setData } = useGlobalStore()
    const openModal = () => {
        setData<LinkPreset>(LINK_MODAL, null)
        openLinkModal()
    }
    const hasControl = useHasAction("monitoring_control")

    const { t } = useTranslation()
    if (!hasControl) return null
    return (
        <>
            <Button
                variant="outline"
                onClick={openModal}
                className={compact ? "h-7 shrink-0 gap-1.5 px-2 text-xs" : "h-9 shrink-0 gap-2"}
            >
                <Link2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                GPS biriktirish
            </Button>
            <Modal
                modalKey={LINK_MODAL}
                title="Mashinaga GPS qurilma biriktirish"
                size="max-w-xl"
            >
                <LinkDeviceForm />
            </Modal>
        </>
    )
}

function LinkDeviceForm() {
    const { t } = useTranslation()
    const { closeModal } = useModal(LINK_MODAL)
    const { openModal: openAddDevice } = useModal(ADD_DEVICE_MODAL)
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const preset = getData<LinkPreset>(LINK_MODAL) ?? null
    const form = useForm<LinkForm>({
        defaultValues: { vehicle: preset?.id ?? null, imei: null },
    })
    const { control, handleSubmit, setValue } = form
    const [vehicleSearch, setVehicleSearch] = useState(preset?.truck_number ?? "")
    const [deviceSearch, setDeviceSearch] = useState("")
    const { mutate, isPending } = usePost()

    const vehicles = useGet<ListResponse<VehicleOption>>(VEHICLES, {
        params: { search: vehicleSearch, page_size: PAGE_SIZE },
    })
    const devices = useGet<DeviceOption[]>(MONITORING_GPS_DEVICES, {
        params: { search: deviceSearch },
    })

    useEffect(() => {
        if (devices.isError) {
            toast.error("GPS xizmati vaqtincha ishlamayapti", {
                id: "gps-devices-error",
            })
        }
    }, [devices.isError])

    const vehicleOptions = useMemo(
        () =>
            (vehicles.data?.results ?? []).map((v) => ({
                id: v.id,
                label: v.gps_imei
                    ? `${v.truck_number} · GPS ${v.gps_imei}`
                    : v.truck_number,
            })),
        [vehicles.data],
    )

    const deviceOptions = useMemo(
        () =>
            (devices.data ?? []).map((d) => ({
                imei: d.imei,
                label: [
                    d.imei,
                    d.name && d.name !== d.imei ? d.name : null,
                    d.vehicle_number ? `→ ${d.vehicle_number}` : null,
                ]
                    .filter(Boolean)
                    .join(" · "),
            })),
        [devices.data],
    )

    const onSubmit = (data: LinkForm) => {
        mutate(
            MONITORING_GPS_LINK,
            { vehicle: data.vehicle, imei: data.imei },
            {
                onSuccess: () => {
                    toast.success(t("toast.device_linked"))
                    queryClient.invalidateQueries({ queryKey: [VEHICLES] })
                    queryClient.invalidateQueries({
                        queryKey: [MONITORING_GPS_DEVICES],
                    })
                    queryClient.invalidateQueries({
                        queryKey: [MONITORING_GPS_LIVE],
                    })
                    closeModal()
                },
            },
        )
    }

    const onDeviceCreated = (device: DeviceOption) => {
        setDeviceSearch(device.imei)
        setValue("imei", device.imei, { shouldValidate: true })
    }

    return (
        <>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
            >
                <FormCombobox
                    required
                    control={control}
                    name="vehicle"
                    label={t("form.truck")}
                    placeholder={t("form.truck")}
                    options={vehicleOptions}
                    valueKey="id"
                    labelKey="label"
                    isLoading={vehicles.isLoading}
                    onSearchChange={setVehicleSearch}
                />
                <FormCombobox
                    required
                    control={control}
                    name="imei"
                    label={t("form.device")}
                    placeholder={t("form.device")}
                    options={deviceOptions}
                    valueKey="imei"
                    labelKey="label"
                    isLoading={devices.isLoading}
                    onSearchChange={setDeviceSearch}
                    onAdd={openAddDevice}
                    emptyText={
                        devices.isError
                            ? "Qurilmalarni yuklab bo'lmadi"
                            : undefined
                    }
                />
                {devices.isError && (
                    <p className="text-xs text-destructive">
                        GPS xizmati vaqtincha ishlamayapti
                    </p>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                    {t("actions.attach")}
                </Button>
            </form>
            <Modal
                modalKey={ADD_DEVICE_MODAL}
                title="Yangi GPS qurilma"
                size="max-w-md"
            >
                <AddDeviceForm onCreated={onDeviceCreated} />
            </Modal>
        </>
    )
}

function AddDeviceForm({
    onCreated,
}: {
    onCreated: (device: DeviceOption) => void
}) {
    const { t } = useTranslation()
    const { closeModal } = useModal(ADD_DEVICE_MODAL)
    const queryClient = useQueryClient()
    const form = useForm<DeviceForm>()
    const { handleSubmit, reset } = form
    const { mutate, isPending } = usePost()

    const onSubmit = (data: DeviceForm) => {
        const imei = data.imei.trim()
        mutate(
            MONITORING_GPS_DEVICES,
            { imei, name: data.name?.trim() || imei },
            {
                onSuccess: (device: DeviceOption) => {
                    toast.success(t("toast.device_added"))
                    queryClient.invalidateQueries({
                        queryKey: [MONITORING_GPS_DEVICES],
                    })
                    onCreated(device)
                    reset()
                    closeModal()
                },
            },
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormInput
                required
                methods={form}
                name="imei"
                label="IMEI"
                placeholder="15 raqamli IMEI (qurilma yorlig‘ida)"
            />
            <FormInput
                methods={form}
                name="name"
                label={t("form.name")}
                placeholder="Masalan, Isuzu 01 A 123 BC"
            />
            <Button type="submit" className="w-full" disabled={isPending}>
                {t("actions.save")}
            </Button>
        </form>
    )
}
