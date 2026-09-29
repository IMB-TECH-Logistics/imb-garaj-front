import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import i18n from "@/i18n/i18n"

const ORDER_STATUS_KEYS: Record<number, string> = {
  [-1]: "draft",
  0: "pending",
  1: "started",
  5: "loading_status",
  6: "on_road",
  7: "unloading",
  2: "done",
  3: "cancelled",
  4: "archived",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statusTransitionMessage(data: any): string | null {
  const transition = data?.status_transition
  if (transition?.code !== "forbidden") return null
  const label = (value: unknown) => {
    const key = ORDER_STATUS_KEYS[Number(value)]
    return key ? i18n.t(`status.${key}`) : String(value)
  }
  return i18n.t("backend_messages.status_transition_forbidden", {
    from: label(transition.from),
    to: label(transition.to),
  })
}

const errorText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(errorText).join(", ")
  if (value && typeof value === "object") {
    return Object.values(value).map(errorText).join(", ")
  }
  return String(value)
}

const fieldErrors = (key: string, value: unknown): [string, unknown][] => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([sub, v]) => [`${key}.${sub}`, v])
  }
  return [[key, value]]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleFormError(err: any, form?: UseFormReturn<any>) {
  const isClientError = err?.status !== 0 && Number(err?.status) < 500
  const data = err?.response?.data || {}
  const msg = data?.detail

  const transitionMsg = statusTransitionMessage(data)
  if (transitionMsg) {
    toast.error(transitionMsg, { duration: 5000 })
    return
  }

  let hasValidFieldError = false

  if (form && isClientError) {
    const fields = form.getValues()

    for (const [key, value] of Object.entries(data)) {
      if (key === "detail") continue
      for (const [path, fieldValue] of fieldErrors(key, value)) {
        const isFieldExist = path in fields || path.includes(".")
        if (isFieldExist) {
          hasValidFieldError = true
          form.setError(path as any, {
            type: "validate",
            message: errorText(fieldValue),
          })
        }
      }
    }

    if (!hasValidFieldError) {
      toast.error(msg || errorText(data) || "Xatolik yuz berdi")
    }
  } else if (isClientError) {
    const arrayErrors = Object.entries(data).filter(([key]) => key !== "detail")
    if (arrayErrors.length > 0) {
      toast.error(
        arrayErrors
          .map(([, value]) => errorText(value))
          .join("\n"),
        { duration: 5000 },
      )
    } else if (msg) {
      toast.error(msg, { duration: 5000 })
    } else {
      toast.error("Xatolik yuz berdi", { duration: 5000 })
    }
  } else {
    toast.error("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleQueryError(err: any) {
  const status = Number(err?.response?.status)
  if (status && status < 500) return
  const message =
    err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT"
      ? i18n.t("messages.request_timeout")
      : !err?.response
        ? i18n.t("messages.no_connection")
        : i18n.t("messages.load_error", { status })
  toast.error(message, { id: "query-error", duration: 6000 })
}
