import { ParamCombobox } from "@/components/as-params/combobox"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

type TruckStats = {
    zapchast: number
    oil_change: number
    tire_change: number
    repair_cost: number
    other_expenses: number
    payment_type: "Naqt" | "Plastik" | "Perechislenie"
}

export const TexnikCheck = () => {
    const data: TruckStats[] = [
        {
            zapchast: 450_000,
            oil_change: 300_000,
            tire_change: 700_000,
            repair_cost: 250_000,
            other_expenses: 150_000,
            payment_type: "Naqt",
        },
        {
            zapchast: 500_000,
            oil_change: 280_000,
            tire_change: 800_000,
            repair_cost: 300_000,
            other_expenses: 100_000,
            payment_type: "Perechislenie",
        },
        {
            zapchast: 300_000,
            oil_change: 250_000,
            tire_change: 600_000,
            repair_cost: 200_000,
            other_expenses: 120_000,
            payment_type: "Plastik",
        },
    ]

    const allData = Array.from({ length: 25 }, (_, i) => ({
        ...data[i % data.length],
    }))

    return (
        <div>
            <div className="mb-3 flex items-center gap-3 justify-end">
                <ParamCombobox
                    paramName="region"
                    options={[]}
                    isSearch={false}
                    label="Transport turi"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />
                <ParamCombobox
                    paramName="truck_type"
                    options={[]}
                    isSearch={false}
                    label="Haydovchi"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />
                <ParamCombobox
                    paramName="status"
                    options={[]}
                    isSearch={false}
                    valueKey="key"
                    labelKey="name"
                    label="Status"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="mb-4 bg-muted p-4 rounded-lg text-sm">
                    <p>
                        <strong>Transport Miqdori :</strong>
                    </p>
                    <p>
                        <strong>Fura:</strong> 25 ta
                    </p>
                    <p>
                        <strong>Isuzu:</strong> 25 ta
                    </p>
                    <p>
                        <strong>Maz:</strong> 25 ta
                    </p>
                </div>
                <div className="mb-4 bg-muted p-4 rounded-lg text-sm">
                    <p>
                        <strong>Yoqilg'i Miqdori :</strong>
                    </p>
                    <p>
                        <strong>Benzin:</strong> 25 litr
                    </p>
                    <p>
                        <strong>Dizel:</strong> 25 litr
                    </p>
                    <p>
                        <strong>Metan:</strong> 80 kg/m3
                    </p>
                </div>

                <div className="mb-4 bg-muted p-4 rounded-lg text-sm">
                    <p>
                        <strong>Balon umumiy soni: 200 ta</strong>
                    </p>
                    <p>
                        <strong>Moy:</strong> 200 litr
                    </p>
                </div>
            </div>

            <DataTable
                numeration
                columns={cols()}
                data={allData}
                head={
                    <div className="flex items-center gap-3 mb-3 ">
                        <h1 className="text-xl font-semibold">
                            {`Transportlar ro'yxati`}
                        </h1>
                        <Badge className="text-sm">25</Badge>
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
    return useMemo<ColumnDef<TruckStats>[]>(
        () => [
            {
                header: "Avto raqam",
                accessorKey: "zapchast",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">01 A 123 BA</span>
                ),
            },
            {
                header: "Transport turi",
                accessorKey: "zapchast",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">Fura</span>
                ),
            },
            {
                header: "Ishlab chiqarilgan yili",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">2025-09-21</span>
                ),
            },
            {
                header: "Texnik holat",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">80%</span>
                ),
            },
            {
                header: "Tirkama",
                accessorKey: "oil_change",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">01 D 332 HA</span>
                ),
            },

            {
                header: "Probeg",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">300 000 km</span>
                ),
            },
            {
                header: "Yoqilg'i turlari",
                accessorKey: "repair_cost",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">Benzin</span>
                ),
            },
            {
                header: "Yoqilg‘i sarfi",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">100 litr</span>
                ),
            },
            {
                header: "Balon soni",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">4 ta</span>
                ),
            },
            {
                header: "Moy sig'imi",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">100 litr</span>
                ),
            },

            {
                header: "Haydovchi",
                accessorKey: "tire_change",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">Azizbek Sattorov</span>
                ),
            },
        ],
        [],
    )
}