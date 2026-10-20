import { useSearch } from "@tanstack/react-router"

export const usePaging = () => {
    const search = useSearch({ strict: false }) as { page?: number; page_size?: number }
    return { page: search.page, page_size: search.page_size }
}

export const paginationProps = (total?: number) => ({ totalPages: total, paramName: "page", pageSizeParamName: "page_size" })
