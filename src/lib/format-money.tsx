import { ClassNameValue } from "tailwind-merge"

export function formatMoney(
    amount?: number | string,
    className?: ClassNameValue,
    suffix?: boolean,
) {
    const numeric = Number(amount)
    const rounded = Number.isFinite(numeric) ? Math.round(numeric) : 0
    const integerPart = Math.abs(rounded).toString()
    const newIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const sign = rounded < 0 ? "-" : ""
    const text = sign + newIntegerPart
    return (
        <span className={`${className} text-nowrap`}>
            {text} {suffix ? " so'm" : ""}
        </span>
    )
}

export function formatNumber(amount?: number | string, className?: ClassNameValue) {
    const numeric = Number(amount)
    const rounded = Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0
    const [integerPart, decimalPart] = Math.abs(rounded).toString().split(".")
    const newIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const sign = rounded < 0 ? "-" : ""
    const text = sign + newIntegerPart + (decimalPart ? `.${decimalPart.padEnd(2, "0")}` : "")
    return <span className={`${className} text-nowrap`}>{text}</span>
}
