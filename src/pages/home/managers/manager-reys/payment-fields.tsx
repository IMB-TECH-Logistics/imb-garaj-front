import { FormNumberInput } from "@/components/form/number-input"
import { useEffect, useRef } from "react"
import { UseFormReturn } from "react-hook-form"

export type PaymentType = { id: number; name: string }

type MatchedDirection = {
    amount?: string | number | null
}

const NAQD_RE = /naqd/i
const PEREC_RE = /perech/i

export const findNaqdId = (paymentTypes: PaymentType[] | undefined) =>
    paymentTypes?.find((p) => NAQD_RE.test(p.name))?.id

export const findPerechId = (paymentTypes: PaymentType[] | undefined) =>
    paymentTypes?.find((p) => PEREC_RE.test(p.name))?.id

export const isNaqdPaymentTypeName = (name: string | undefined) =>
    !!name && NAQD_RE.test(name)

export const NaqdAmountField = ({
    methods,
    matchedDirection,
}: {
    methods: UseFormReturn<any>
    matchedDirection?: MatchedDirection | null
}) => {
    const { control, watch, setValue } = methods

    const isNaqd = !!watch("is_naqd")
    const amount = watch("amount")

    const prevModeRef = useRef(isNaqd)
    useEffect(() => {
        if (prevModeRef.current === isNaqd) return
        prevModeRef.current = isNaqd
        if (!isNaqd) return
        if (!amount && matchedDirection?.amount != null) {
            setValue("amount", String(matchedDirection.amount))
        }
    }, [isNaqd, amount, matchedDirection, setValue])

    if (!isNaqd) return null

    return (
        <FormNumberInput
            required
            label="Summa"
            name="amount"
            control={control}
            thousandSeparator=" "
            placeholder="Ex: 1 500 000"
            autoComplete="off"
        />
    )
}
