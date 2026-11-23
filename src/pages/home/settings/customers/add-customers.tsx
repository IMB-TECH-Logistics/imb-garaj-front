import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { SETTINGS_CUSTOMERS } from "@/constants/api-endpoints"
import { useConfirm } from "@/hooks/useConfirm"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import axiosInstance from "@/services/axios-instance"
import CoordinatesFields from "@/components/custom/coordinates-fields"
import { formatCoordinates, parseCoordinates } from "@/lib/coordinates"

type CustomerForm = Omit<CustomersType, "percent"> & {
    coordinates: string
    radius_m: number | string
    percent: number | string | null
}

const normalizeName = (value?: string) =>
    (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase()

const AddCustomerModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const confirm = useConfirm()

    const currentForwarder = getData<CustomersType>(SETTINGS_CUSTOMERS)
    const form = useForm<CustomerForm>({
        defaultValues: {
            name: currentForwarder?.name ?? "",
            code: currentForwarder?.code ?? "",
            coordinates: formatCoordinates(currentForwarder?.lat, currentForwarder?.lng),
            radius_m: currentForwarder?.radius_m ?? 1000,
            percent: currentForwarder?.percent ?? null,
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentForwarder?.id ? t("messages.success_edit") : t("messages.success_add"),
        )

        reset()
        clearKey(SETTINGS_CUSTOMERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_CUSTOMERS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = async (values: CustomerForm) => {
        const isValid = await form.trigger()

        if (!isValid) {
            toast.error(t("toast.error_fields"))
            return
        }

        const text = (values.coordinates ?? "").trim()
        const point = parseCoordinates(text)
        if (text && !point) {
            toast.error(t("coordinates.invalid"))
            return
        }
        const payload = {
            name: values.name,
            code: values.code,
            lat: point?.lat ?? null,
            lng: point?.lng ?? null,
            radius_m: Number(values.radius_m) || 1000,
            percent:
                values.percent === null || values.percent === ""
                    ? null
                    : Number(values.percent),
        }

        const name = normalizeName(values.name)
        if (name && name !== normalizeName(currentForwarder?.name)) {
            const duplicates = await axiosInstance
                .get(SETTINGS_CUSTOMERS, { params: { search: values.name.trim(), page_size: 100 } })
                .then(({ data }) => (data?.results ?? data ?? []) as CustomersType[])
                .then((list) =>
                    list.filter(
                        (c) => c.id !== currentForwarder?.id && normalizeName(c.name) === name,
                    ),
                )
                .catch(() => [] as CustomersType[])
            if (duplicates.length) {
                const proceed = await confirm({
                    title: t("messages.duplicate_client_title"),
                    description: t("messages.duplicate_client_name", {
                        name: values.name.trim(),
                        codes: duplicates.map((c) => c.code || "—").join(", "),
                    }),
                })
                if (!proceed) return
            }
        }

        if (currentForwarder?.id) {
            updateMutate(`${SETTINGS_CUSTOMERS}/${currentForwarder.id}`, payload)
        } else {
            postMutate(SETTINGS_CUSTOMERS, payload)
        }
    }

    return (
        <>
            <div className="w-full max-w-4xl mx-auto p-1">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid md:grid-cols-2 gap-4"
                >
                    <FormInput
                        required
                        name="name"
                        label={t("form.company_name")}
                        methods={form}
                    />

                    <FormInput
                        name="code"
                        label={t("form.company_code")}
                        methods={form}
                        placeholder={t("settings.customers.code_placeholder")}
                    />

                    <FormNumberInput
                        name="percent"
                        label={t("form.client_percent")}
                        placeholder="85"
                        control={form.control}
                        decimalScale={2}
                        allowNegative={false}
                        suffix="%"
                        isAllowed={({ floatValue }) =>
                            floatValue === undefined || floatValue <= 100
                        }
                    />

                    <CoordinatesFields methods={form} />

                    <div className="flex items-center justify-end gap-2 md:col-span-2">
                        <Button
                            className="min-w-36 w-full md:w-max"
                            type="submit"
                            loading={isPending}
                        >
                            {t("actions.save")}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default AddCustomerModal
