import i18n from "@/i18n/i18n"

export const RESERVED_USERNAME_PREFIX = "global."

export const validateUsername = (value?: string) =>
    !value?.toLowerCase().startsWith(RESERVED_USERNAME_PREFIX) ||
    i18n.t("validation.reserved_username", { prefix: RESERVED_USERNAME_PREFIX })
