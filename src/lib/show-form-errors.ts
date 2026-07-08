import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleFormError(err: any, form?: UseFormReturn<any>) {
  const isClientError = err?.status !== 0 && Number(err?.status) < 500
  const data = err?.response?.data || {}
  const msg = data?.detail

  let hasValidFieldError = false

  if (form && isClientError) {
    const fields = form.getValues()

    for (const [key, value] of Object.entries(data)) {
      if (key !== "detail") {
        const isFieldExist = key in fields || key.includes(".")
        if (isFieldExist) {
          hasValidFieldError = true
          form.setError(key as any, {
            type: "validate",
            message: value as string,
          })
        }
      }
    }

    if (!hasValidFieldError && msg) {
      toast.error(msg)
    }
  } else if (isClientError) {
    const arrayErrors = Object.entries(data).filter(([key]) => key !== "detail")
    if (arrayErrors.length > 0) {
      toast.error(arrayErrors.map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join("\n"), {
        duration: 5000,
      })
    } else if (msg) {
      toast.error(msg, { duration: 5000 })
    } else {
      toast.error("Xatolik yuz berdi", { duration: 5000 })
    }
  } else {
    toast.error("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
  }
}
