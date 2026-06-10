import { ClassNameValue } from "tailwind-merge"

export function formatMoney(
    amount?: number | string,
    className?: ClassNameValue,
    suffix?: boolean,
) {
    // Round to at most 2 decimals, then strip trailing zeros (1234.50 -> 1234.5, 1234.00 -> 1234)
    const rounded =
        amount !== undefined && amount !== "" && amount !== null
            ? Number(parseFloat(amount.toString()).toFixed(2))
            : amount
    const [integerPart, decimalPart] =
        rounded ? rounded.toString().split(".") : ""
    const newIntegerPart = integerPart?.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    if (rounded) {
        if (decimalPart && +decimalPart > 0) {
            return (
                <span className={`${className} text-nowrap`}>
                    {newIntegerPart}.{decimalPart} {suffix ? " so'm" : ""}
                </span>
            )
        } else {
            return (
                <span className={`${className} text-nowrap`}>
                    {newIntegerPart} {suffix ? " so'm" : ""}
                </span>
            )
        }
    } else {
        return (
            <span className={`${className} text-nowrap`}>
                0 {suffix ? " so'm" : ""}
            </span>
        )
    }
}
