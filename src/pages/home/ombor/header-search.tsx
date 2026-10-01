import ParamInput from "@/components/as-params/input"
import { parseGs1 } from "@/components/scanner/gs1"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useScanLookup } from "./use-scan-lookup"

const OmborHeaderSearch = () => {
    const { t } = useTranslation()
    const lookup = useScanLookup()

    const handleEnter = async (value: string) => {
        if (!parseGs1(value).gtin) return
        const message = await lookup(value)
        if (message) toast.error(message)
    }

    return (
        <ParamInput
            searchKey="search"
            placeholder={t("wh.search_placeholder")}
            wrapperClassName="!h-9 !w-56 hidden sm:block"
            className="!h-9 !bg-muted/40 text-sm"
            onEnter={handleEnter}
        />
    )
}

export default OmborHeaderSearch
