import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/format-money"
import { differenceInCalendarDays, parseISO } from "date-fns"
import { Boxes, FileText, PackageMinus, SquarePen } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate, toNumber } from "../ombor/utils"
import type { VehicleExpenseRow } from "./cols"
import { TECH_INSPECTION_CODE } from "./types"

type Props = {
    row: VehicleExpenseRow | null
    onClose: () => void
    onEdit: (row: VehicleExpenseRow) => void
}

const Block = ({
    label,
    children,
    className,
}: {
    label: string
    children: ReactNode
    className?: string
}) => (
    <div className={`rounded-lg bg-muted/60 p-3 min-w-0 ${className ?? ""}`}>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium break-words">{children}</div>
    </div>
)

const DaysBadge = ({ expiresAt }: { expiresAt: string | null }) => {
    const { t } = useTranslation()
    if (!expiresAt) return null
    const days = differenceInCalendarDays(parseISO(expiresAt), new Date())
    if (days < 0) {
        return (
            <Badge variant="destructive" className="whitespace-nowrap">
                {t("wh.tech.expired_badge")}
            </Badge>
        )
    }
    return (
        <Badge
            variant={days <= 30 ? "orange" : "secondary"}
            className="whitespace-nowrap"
        >
            {t("wh.tech.days_left", { count: days })}
        </Badge>
    )
}

const ExpenseDetailSheet = ({ row, onClose, onEdit }: Props) => {
    const { t } = useTranslation()
    const isWarehouse = row?.category_code === TECH_INSPECTION_CODE
    const items = row?.items ?? []

    return (
        <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl overflow-y-auto"
            >
                {row && (
                    <>
                        <SheetHeader>
                            <div className="flex items-start gap-3 pr-6">
                                <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                                    {isWarehouse ?
                                        <PackageMinus size={22} />
                                    :   <FileText size={22} />}
                                </div>
                                <div>
                                    <SheetTitle className="text-lg leading-tight">
                                        {t("wh.tech.detail_title")}
                                    </SheetTitle>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {[
                                            row.vehicle_name,
                                            row.category_name,
                                            fmtDate(row.date),
                                        ].join(" · ")}
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                            <Block label={t("table.truck_plate")}>
                                {row.vehicle_name || "—"}
                            </Block>
                            <Block label={t("form.expense_type")}>
                                {row.category_name}
                            </Block>
                            <Block label={t("form.date")}>
                                {fmtDate(row.date)}
                            </Block>
                            <Block label={t("table.responsible")}>
                                {row.executor_name || "—"}
                            </Block>
                            <Block
                                label={t("form.comment")}
                                className="col-span-2 sm:col-span-4"
                            >
                                {row.comment || "—"}
                            </Block>
                        </div>

                        {isWarehouse ?
                            <>
                                <h3 className="font-medium mt-5 mb-2 flex items-center gap-2">
                                    <Boxes size={16} className="text-primary" />
                                    {t("wh.tech.items_title")}
                                    {!!items.length && (
                                        <Badge>{items.length}</Badge>
                                    )}
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">
                                                №
                                            </TableHead>
                                            <TableHead>
                                                {t("wh.product")}
                                            </TableHead>
                                            <TableHead>
                                                {t("wh.lot")} / {t("texnik.serial.factory_number")}
                                            </TableHead>
                                            <TableHead>
                                                {t("wh.expiry")}
                                            </TableHead>
                                            <TableHead>
                                                {t("form.quantity")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">
                                                    {item.product_name}
                                                </TableCell>
                                                <TableCell className="font-mono whitespace-nowrap">
                                                    {item.factory_number ?
                                                        <div className="flex flex-col">
                                                            <span>{item.factory_number}</span>
                                                            {!!item.odometer && (
                                                                <span className="text-xs text-muted-foreground font-sans">
                                                                    {t("texnik.serial.odometer_value", { value: item.odometer })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    :   item.lot_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <span className="tabular-nums">
                                                            {fmtDate(
                                                                item.expires_at,
                                                            )}
                                                        </span>
                                                        <DaysBadge
                                                            expiresAt={
                                                                item.expires_at
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="tabular-nums whitespace-nowrap">
                                                    {toNumber(item.quantity)}{" "}
                                                    {item.unit_name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        :   <div className="rounded-lg bg-muted/60 p-3 mt-5">
                                <div className="text-xs text-muted-foreground">
                                    {t("form.amount")}
                                </div>
                                <div className="text-base font-semibold tabular-nums text-red-600">
                                    {formatMoney(row.amount ?? 0)}{" "}
                                    {t("page.som")}
                                </div>
                            </div>
                        }

                        <div className="flex items-center justify-end gap-3 mt-5">
                            <Button variant="outline" onClick={onClose}>
                                {t("actions.close")}
                            </Button>
                            <Button
                                icon={<SquarePen size={16} />}
                                onClick={() => onEdit(row)}
                            >
                                {t("actions.edit")}
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

export default ExpenseDetailSheet
