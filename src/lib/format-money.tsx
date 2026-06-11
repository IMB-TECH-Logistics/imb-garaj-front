import { ClassNameValue } from "tailwind-merge"

export function formatMoney(
    amount?: number | string,
    className?: ClassNameValue,
    suffix?: boolean,
) {
    const numeric = Number(amount)
    // Round doubles to at most two figures after the comma, trimming trailing zeros.
    const rounded = Number.isFinite(numeric)
        ? Math.round(numeric * 100) / 100
        : 0
    const [integerPart, decimalPart] = Math.abs(rounded).toString().split(".")
    const newIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const sign = rounded < 0 ? "-" : ""
    const text =
        sign + newIntegerPart + (decimalPart ? `.${decimalPart}` : "")
    return (
        <span className={`${className} text-nowrap`}>
            {text} {suffix ? " so'm" : ""}
        </span>
    )
}
