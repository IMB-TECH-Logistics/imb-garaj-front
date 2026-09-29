import { HR_COMPANIES_LIST, HR_DEPARTMENTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { downloadExcel } from "@/lib/download-excel"
import { handleFormError } from "@/lib/show-form-errors"
import {
    baseURL,
    getAccessToken,
    getSelectedTenant,
} from "@/services/axios-instance"
import { Download } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FormDatePicker } from "../form/date-picker"
import { FormMultiCombobox } from "../form/multi-combobox"
import { Button } from "../ui/button"
import FormAction from "./form-action"
import Modal from "./modal"

type Dates = {
    start: string
    end: string
    date: string
    companies?: number[]
    departments?: number[]
}

const ExportAsExcel = ({
    url,
    name,
    inputDate,
    inputInterval,
    params = {},
    label = "Yuklab olish",
    inputCompany = false,
}: {
    url: string
    name: string
    inputDate?: boolean
    inputInterval?: boolean
    params?: Record<string, string | number | boolean>
    label?: string
    inputCompany?: boolean
}) => {
    const { openModal, closeModal, isOpen } = useModal("select-interval" + url)
    const [loading, setLoading] = useState<boolean>(false)

    const { data: companies } = useGet<Properties[]>(HR_COMPANIES_LIST, {
        enabled: !!isOpen,
    })

    const { data: departments } = useGet<Department[]>(HR_DEPARTMENTS, {
        enabled: !!isOpen,
    })

    const { refetch, isFetching } = useGet(url, {
        enabled: false,
        config: { responseType: "blob" },
    })

    const trigger = async () => {
        if (inputDate || inputInterval) {
            return openModal()
        }
        const { data, isSuccess, isError, error } = await refetch()
        if (isSuccess) {
            downloadExcel({ data, name })
        }
        if (isError) {
            handleFormError(error)
        }
    }

    const methods = useForm<Dates>()

    const token = getAccessToken()

    const wd = methods.watch("companies") ?? []

    const doptions = useMemo(() => {
        if (!wd.length) {
            return []
        } else if (wd.length == 1) {
            return departments?.filter((d) => wd.includes(d.company))
        } else
            return departments
                ?.filter((d) => wd.includes(d.company))
                .map((c) => ({ ...c, name: `${c.name} - ${c.company_name}` }))
    }, [wd, departments])

    async function handleSubmit(vals: Dates) {
        setLoading(true)
        const prms = { ...vals }

        delete prms?.departments
        delete prms?.companies

        const searchParams = new URLSearchParams({
            ...params,
            ...(prms as any),
            companies: vals.companies?.join(",") ?? undefined,
            departments: vals.departments?.join(",") ?? undefined,
        })
        const response = await fetch(`${baseURL}${url}?` + searchParams, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...(getSelectedTenant() ? { "X-Tenant": getSelectedTenant() as string } : {}),
            },
        })
        if (response.status === 200) {
            const blobData = await response.blob()
            downloadExcel({
                data: blobData,
                name: name,
            })
        } else toast.error("Yuklab olishda xatolik")
        methods.reset()
        closeModal()
        setLoading(false)
    }

    return (
        <div className="inline-block">
            {!url || url === "" ?
                ""
            :   <Button
                    icon={<Download width={16} />}
                    loading={isFetching}
                    onClick={trigger}
                >
                    <span className="hidden sm:block">{label}</span>
                </Button>
            }

            <Modal
                title={
                    inputInterval ?
                        "Oraliq sanani tanlang"
                    :   "Hisobot sanasini tanlang"
                }
                modalKey={"select-interval" + url}
                className=" overflow-visible"
            >
                <form onSubmit={methods.handleSubmit(handleSubmit)}>
                    {inputCompany ?
                        <div className="grid grid-cols-2 gap-2 py-2">
                            <FormMultiCombobox
                                label={"Ofislar"}
                                control={methods.control}
                                options={companies}
                                valueKey="id"
                                labelKey="name"
                                name="companies"
                                hideSort
                                isSearch={false}
                                allSelected
                                skeletonCount={2}
                            />
                            <FormMultiCombobox
                                label={"Bo'limlar"}
                                placeholder={"Barchasi"}
                                control={methods.control}
                                options={doptions}
                                valueKey="id"
                                labelKey="name"
                                name="departments"
                                hideSort
                                allSelected
                                skeletonCount={2}
                            />
                        </div>
                    :   null}

                    {inputInterval ?
                        <div className="grid grid-cols-2 gap-2 py-2">
                            <FormDatePicker
                                control={methods.control}
                                name="start"
                                label={"Boshlanish"}
                                required
                            />
                            <FormDatePicker
                                control={methods.control}
                                name="end"
                                label={"Tugash"}
                                required
                            />
                        </div>
                    :   <FormDatePicker
                            control={methods.control}
                            name="date"
                            label={"Sana"}
                            required
                        />
                    }

                    <FormAction submitName={"Yuklab olish"} loading={loading} />
                </form>
            </Modal>
        </div>
    )
}

export default ExportAsExcel
