import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { CopyButton } from "@/lib/copy-button"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

type TruckIncome = {
    order_id: string
    truck_number: string
    trailer_number: string
    driver_name: string
    income: number
    other_income: number
    debt: number
    advance: number
    fuel: string
    spare: number
    salary: number
    daily_expense: number
    other_expense: number
    tripIncome: number
    otherIncome: number
}

export const TruckTabsOneClone = () => {
    const data: TruckIncome[] = [
        {
            order_id: "277AH",
            truck_number: "01 369 JKA",
            trailer_number: "40 3994 BA",
            driver_name: "Jahongir Karimov",
            income: 1200000,
            other_income: 800000,
            debt: -1200000,
            advance: 3200000,
            fuel: "Metan",
            spare: 2000000,
            salary: 5000000,
            daily_expense: -1500000,
            other_expense: -700000,
            tripIncome: 7000000,
            otherIncome: 1500000,
        },
        {
            order_id: "912BX",
            truck_number: "10 554 KAA",
            trailer_number: "60 2222 TT",
            driver_name: "Azizbek Sattorov",
            income: 1500000,
            other_income: 400000,
            debt: -800000,
            advance: 2000000,
            fuel: "Dizel",
            spare: 1800000,
            salary: 4800000,
            daily_expense: -1300000,
            other_expense: -500000,
            tripIncome: 7200000,
            otherIncome: 1200000,
        },
        {
            order_id: "523CY",
            truck_number: "25 777 ZAA",
            trailer_number: "40 8888 FA",
            driver_name: "Sardor Akmalov",
            income: 2000000,
            other_income: 1000000,
            debt: -600000,
            advance: 2500000,
            fuel: "Metan",
            spare: 2500000,
            salary: 5100000,
            daily_expense: -1400000,
            other_expense: -600000,
            tripIncome: 8000000,
            otherIncome: 2000000,
        },
        {
            order_id: "118DF",
            truck_number: "90 123 QAA",
            trailer_number: "70 9999 HA",
            driver_name: "Oybek Normurodov",
            income: 1800000,
            other_income: 700000,
            debt: -900000,
            advance: 2800000,
            fuel: "Benzin",
            spare: 2300000,
            salary: 5200000,
            daily_expense: -1600000,
            other_expense: -800000,
            tripIncome: 7700000,
            otherIncome: 1700000,
        },
        {
            order_id: "879EG",
            truck_number: "80 654 MAA",
            trailer_number: "50 3333 LA",
            driver_name: "Dilmurod Abdug‘afforov",
            income: 1300000,
            other_income: 600000,
            debt: -400000,
            advance: 1500000,
            fuel: "Metan",
            spare: 2100000,
            salary: 4900000,
            daily_expense: -1200000,
            other_expense: -500000,
            tripIncome: 6900000,
            otherIncome: 1400000,
        },
    ]

    // 25 ta satr yaratamiz
    const allData = Array.from({ length: 25 }, (_, i) => ({
        ...data[i % data.length],
        order_id: data[i % data.length].order_id + "-" + (i + 1),
    }))

    return (
        <div>
            <DataTable
                numeration
                columns={cols()}
                data={allData}
                head={
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-xl font-semibold">
                            {`Yuksiz Reyslar ro'yxati`}
                        </h1>
                        <Badge className="text-sm">{formatMoney(25)}</Badge>
                    </div>
                }
                paginationProps={{
                    totalPages: 3,
                }}
            />
        </div>
    )
}

const cols = () => {
    return useMemo<ColumnDef<TruckIncome>[]>(
        () => [
            {
                header: "Sana",
                enableSorting: true,
                accessorKey: "date",
                cell: () => (
                    <span className="whitespace-nowrap">{"2025-10-14"}</span>
                ),
            },
            {
                header: "Buyurtma ID",
                enableSorting: true,
                accessorKey: "order_id",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {CopyButton(row.original.order_id)}
                    </span>
                ),
            },
            {
                header: "Sababi",
                enableSorting: true,
                accessorKey: "owner",
                cell: () => (
                    <span className="whitespace-nowrap">
                        {"Hozircha reys yo'q..."}
                    </span>
                ),
            },
            {
                header: "Qayerdan",
                enableSorting: true,
                accessorKey: "from",
                cell: () => (
                    <span className="whitespace-nowrap">{"Toshkent"}</span>
                ),
            },
            {
                header: "Qayerga",
                enableSorting: true,
                accessorKey: "to",
                cell: () => (
                    <span className="whitespace-nowrap">{"Samarqand"}</span>
                ),
            },
            {
                header: "Haydovchi",
                enableSorting: true,
                accessorKey: "driver_name",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.driver_name}
                    </span>
                ),
            },
            {
                header: "Motosoat",
                enableSorting: true,
                accessorKey: "date",
                cell: () => (
                    <span className="whitespace-nowrap">{"6 soat"}</span>
                ),
            },

            {
                header: "Bosilgan masofa",
                enableSorting: true,
                accessorKey: "date",
                cell: () => (
                    <span className="whitespace-nowrap">{"600 km"}</span>
                ),
            },

            {
                header: "Jami xarajat",
                enableSorting: true,
                accessorKey: "advance",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-destructive">
                        - {formatMoney(row.original.advance)}
                    </span>
                ),
            },
            {
                header: "Yoqilg'i ",
                enableSorting: true,
                accessorKey: "advance",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-destructive">
                        - {formatMoney(row.original.advance)}
                    </span>
                ),
            },
            {
                header: "Oylik",
                enableSorting: true,
                accessorKey: "salary",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-destructive">
                        - {formatMoney(row.original.salary)}
                    </span>
                ),
            },
            {
                header: "Kunlik",
                enableSorting: true,
                accessorKey: "daily_expense",
                cell: ({ row }) => (
                    <span className="text-destructive whitespace-nowrap">
                        {formatMoney(row.original.daily_expense)}
                    </span>
                ),
            },
            {
                header: "Boshqa ",
                enableSorting: true,
                accessorKey: "other_expense",
                cell: ({ row }) => (
                    <span className="text-destructive whitespace-nowrap">
                        {formatMoney(row.original.other_expense)}
                    </span>
                ),
            },
            {
                header: "Avans",
                enableSorting: true,
                accessorKey: "advance",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap ">
                        {formatMoney(row.original.advance)}
                    </span>
                ),
            },
            {
                header: "To'lov turi",
                enableSorting: true,
                accessorKey: "payment_type",
                cell: ({ row }) => <Badge>Naqt</Badge>,
            },
        ],
        [],
    )
}
