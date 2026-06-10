import { ClassNameValue } from "tailwind-merge"

export function formatMoney(
    amount?: number | string,
    className?: ClassNameValue,
    suffix?: boolean,
) {
    // Currency: round to a whole number, strip any decimal remainder (1234.56 -> 1235)
    const rounded =
        amount !== undefined && amount !== "" && amount !== null
            ? Math.round(parseFloat(amount.toString()))
            : amount
    const integerPart = rounded ? rounded.toString() : ""
    const newIntegerPart = integerPart?.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    if (rounded) {
        return (
            <span className={`${className} text-nowrap`}>
                {newIntegerPart} {suffix ? " so'm" : ""}
            </span>
        )
    } else {
        return (
            <span className={`${className} text-nowrap`}>
                0 {suffix ? " so'm" : ""}
            </span>
        )
    }
}
