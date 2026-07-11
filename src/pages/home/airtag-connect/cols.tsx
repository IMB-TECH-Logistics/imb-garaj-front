import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Link } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export const useAirtagConnectCols = (onConnect: (order: AirtagOrder) => void) => {
    const { t } = useTranslation()

    return useMemo<ColumnDef<AirtagOrder>[]>(
        () => [
            {
                header: "SAP",
                accessorKey: "sap",
            },
            {
                header: t("Yaratilgan sana"),
                accessorKey: "created_at",
                cell: ({ row }) =>
                    format(new Date(row.original.created_at), "yyyy-MM-dd HH:mm"),
            },
            {
                header: t("Status"),
                accessorKey: "status",
                cell: ({ row }) => {
                    const status = row.original.status
                    const statusMap: Record<number, { label: string; color: string }> = {
                        0: { label: t("Yaratilgan"), color: "text-gray-500" },
                        1: { label: t("Mashina biriktirilgan"), color: "text-blue-500" },
                        2: { label: t("Parkovkada"), color: "text-yellow-500" },
                        3: { label: t("Yuklanmoqda"), color: "text-orange-500" },
                        4: { label: t("Tushirilmoqda"), color: "text-orange-500" },
                        5: { label: t("Yetib keldi"), color: "text-cyan-500" },
                        6: { label: t("Tushirildi"), color: "text-indigo-500" },
                        7: { label: t("Yakunlangan"), color: "text-green-500" },
                        8: { label: t("Bekor qilingan"), color: "text-red-500" },
                    }
                    const s = statusMap[status]
                    if (!s) return status
                    return <span className={`${s.color} font-medium`}>{s.label}</span>
                },
            },
            {
                header: t("Buyurtma kodi"),
                accessorFn: (row) => row.extra_data?.order_code,
                id: "order_code",
            },
            {
                header: t("Amallar"),
                id: "actions",
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5"
                        onClick={() => onConnect(row.original)}
                    >
                        <Link className="w-4 h-4" />
                        {t("Ulash")}
                    </Button>
                ),
            },
        ],
        [t, onConnect],
    )
}
