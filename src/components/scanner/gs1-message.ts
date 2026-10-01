import type { TFunction } from "i18next"
import type { Gs1Error } from "./gs1"

export const gs1ErrorText = (t: TFunction, error: Gs1Error) =>
    t(`wh.gs1.${error.key}`, error.params)
