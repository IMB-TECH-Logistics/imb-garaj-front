import { useNavigate, useSearch } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { useState } from "react"
import { toast } from "sonner"
import { useModal } from "./useModal"
import axiosInstance from "@/services/axios-instance"

/** Excel eksporti uchun uzaytirilgan kutish muddati (3 daqiqa). */
const EXPORT_TIMEOUT_MS = 180_000

export const useDownloadAsExcel = ({
    url,
    name,
    fileType,
    params,
}: {
    url: string
    name?: string
    fileType?: string
    params?: Record<string, any>
}) => {
    const [isFetching, setIsFetching] = useState(false)
    const { openModal, closeModal } = useModal("confim-download")

    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })

    const trigger = async () => {
        setIsFetching(true)
        try {
            const response = await axiosInstance.get(url, {
                responseType: "blob",
                /*
                 * Eksport katta jadvalda uzoq davom etishi mumkin, shuning
                 * uchun umumiy 20 soniyalik chegara bu yerda uzaytiriladi —
                 * aks holda tayyorlanayotgan hisobot yarim yo'lda uzilardi.
                 */
                timeout: EXPORT_TIMEOUT_MS,
                params,
            })
            if (response.status === 200) {
                downloadAsExcel({ data: response.data, name, fileType })
            }
        } catch (error) {
            if ((error as AxiosError)?.status === 455) {
                openModal()
                navigate({
                    search: {
                        ...search,
                        downloadUrl: url,
                    },
                })
            }
        } finally {
            setIsFetching(false)
        }
    }

    const downloadWithPassword = async (
        password: string,
        passwordUrl: string,
    ) => {
        setIsFetching(true)
        try {
            const response = await axiosInstance.get(passwordUrl, {
                responseType: "blob",
                timeout: EXPORT_TIMEOUT_MS,
                params: {
                    ...params,
                    password,
                },
            })
            if (response.status === 200) {
                downloadAsExcel({ data: response.data, name, fileType })
                navigate({
                    search: {
                        ...search,
                        downloadUrl: undefined,
                    },
                })
                closeModal()
            }
        } catch (error) {
            toast.error("Parol xato")
        } finally {
            setIsFetching(false)
        }
    }

    return { trigger, isFetching, downloadWithPassword }
}

type Arg = {
    data: Blob
    name?: string
    fileType?: string
}

function downloadAsExcel({
    data,
    name = new Date().toISOString(),
    fileType = ".xlsx",
}: Arg) {
    const blob = new Blob([data])
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = name + fileType
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
}
