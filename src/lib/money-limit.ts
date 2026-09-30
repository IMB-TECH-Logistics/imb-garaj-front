export const MAX_MONEY_AMOUNT = 1_000_000_000

export const isWithinMoneyLimit = (value: unknown) =>
    Number(String(value ?? "").replace(/\s/g, "")) <= MAX_MONEY_AMOUNT
