import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { SETTINGS_SELECTABLE_USERS, SETTINGS_SELECTABLE_VEHICLE_TYPE, VEHICLES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import FormInput from "@/components/form/input"
import { useGet } from "@/hooks/useGet"

//    const params = useParams({ strict: false })
//     const id = params.id

//     const { data: vehicleDetail } = useGet<VehicleDetailType>(
//         `${VEHICLES}/${id}`,
//         {
//             enabled: !!id,
//         },
//     )


const AddTransport = () => {
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal("create")
    const currentTruck = getData<TruckCreate & { id?: number }>(VEHICLES)

    const { data: truckType } = useGet<TruckType[]>(SETTINGS_SELECTABLE_VEHICLE_TYPE, {
        params: {
            type: "truck"
        }
    })
    const { data: trailerType } = useGet<TrailerType[]>(SETTINGS_SELECTABLE_VEHICLE_TYPE, {
        params: {
            type: "trailer"
        }
    })

    const { data: driversData } = useGet<DriversType[]>(SETTINGS_SELECTABLE_USERS, {
        params: {
            role: "1"
        }
    })

    const form = useForm<TruckCreate>({
        defaultValues: {
            truck_number: currentTruck?.truck_number,
            truck_passport: currentTruck?.truck_passport,
            trailer_number: currentTruck?.trailer_number,
            fuel: currentTruck?.fuel,
            truck_type: currentTruck?.truck_type,
            trailer_type: currentTruck?.trailer_type,
            driver: currentTruck?.driver,
        },
    })


    const { handleSubmit, control, reset } = form

    const onSuccess = () => {
        toast.success(
            currentTruck?.id
                ? "Transport tahrirlandi!"
                : "Yangi transport qo'shildi!"
        )
        reset()
        clearKey(VEHICLES)
        closeModal()
        queryClient.invalidateQueries({ queryKey: [VEHICLES] })
        queryClient.invalidateQueries({queryKey:[`${VEHICLES}/${currentTruck?.id}`]})
        
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })

    const isPending = creating || updating

    const onSubmit = (data: TruckCreate) => {
        const payload = {
            truck_number: data.truck_number,
            truck_passport: data.truck_passport,
            trailer_number: data.trailer_number || null,
            fuel: data.fuel,
            truck_type: data.truck_type || null,
            trailer_type: data.trailer_type || null,
            driver: data.driver,
        }

        if (currentTruck?.id) {
            update(`${VEHICLES}/${currentTruck.id}`, payload)
        } else {
            create(VEHICLES, payload)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormInput
                required
                name="truck_number"
                label="Avtoraqam"
                methods={form}
                placeholder="Misol: 01A345AD"
                uppercase
            />

            <FormInput
                required
                name="truck_passport"
                label="Tex. passport raqami"
                methods={form}
                placeholder="Misol: AS02131234131"
                uppercase
            />

            <FormCombobox
                required
                label="Haydovchi"
                name="driver"
                control={form.control}
                options={driversData}
                valueKey="id"
                labelKey="first_name"
                placeholder="Haydovchi tanlang"
            />


            <FormCombobox
                required
                label="Yoqilg'i turi"
                name="fuel"
                control={form.control}
                options={[
                    { label: "Dizel", value: "diesel" },
                    { label: "Metan", value: "methane" },
                ]}
                valueKey="value"
                labelKey="label"
                placeholder="Yoqilg'i turi"
            />


            <FormCombobox
                required
                label="Avtomobil turi"
                name="truck_type"
                control={form.control}
                options={truckType}
                placeholder="Avtomobil turi"
            />

            <FormCombobox
                required
                label="Tirkama turi"
                name="trailer_type"
                control={form.control}
                options={trailerType}
                placeholder="Tirkama turi"
            />

            <FormNumberInput
                name="trailer_number"
                label="Tirkama raqami"
                control={control}
                placeholder="Misol: 1"
            />

            <div className="col-span-2 flex justify-end gap-4 pt-4">

                <Button type="submit" loading={isPending} disabled={isPending}>
                    {currentTruck?.id ? "Yangilash" : "Qo'shish"}
                </Button>
            </div>
        </form>
    )
}

export default AddTransport