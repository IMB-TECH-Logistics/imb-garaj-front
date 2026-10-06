import ParamInput from "@/components/as-params/input"
import { useTranslation } from "react-i18next"

const OmborHeaderSearch = () => {
    const { t } = useTranslation()

    return (
        <ParamInput
            searchKey="search"
            placeholder={t("wh.search_placeholder")}
            wrapperClassName="!h-9 !w-56 hidden sm:block"
            className="!h-9 !bg-muted/40 text-sm"
        />
    )
}

export default OmborHeaderSearch
