import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

/**
 * Backend xatolari foydalanuvchiga ingliz tilida va xom maydon kaliti bilan
 * ko'rsatilardi, masalan: "username: user with this Username already exists."
 * (S2-27). Quyidagi ikki jadval eng ko'p uchraydiganlarini o'zbekchaga
 * o'giradi; mos keladigani topilmasa eski xulq saqlanadi.
 */
const FIELD_LABELS: Record<string, string> = {
  username: "Login",
  password: "Parol",
  name: "Nomi",
  code: "Kodi",
  first_name: "Ism",
  last_name: "Familiya",
  phone_number: "Telefon raqami",
  nds_percent: "NDS foizi",
  role: "Rol",
  type: "Turi",
  flow_type: "Yo'nalishi",
  method: "Usuli",
  actions: "Ruxsatlar",
  non_field_errors: "Xatolik",
}

const MESSAGE_RULES: { test: RegExp; text: (field: string) => string }[] = [
  {
    test: /already exists/i,
    text: (field) => `${field} allaqachon band — boshqasini kiriting`,
  },
  {
    test: /this field may not be blank|this field is required/i,
    text: (field) => `${field} to'ldirilishi shart`,
  },
  {
    test: /this field may not be null/i,
    text: (field) => `${field} bo'sh qoldirilmasin`,
  },
  {
    test: /a valid integer is required|a valid number is required/i,
    text: (field) => `${field} son bo'lishi kerak`,
  },
  {
    test: /ensure this field has no more than (\d+)/i,
    text: (field) => `${field} juda uzun`,
  },
  {
    test: /invalid|not a valid/i,
    text: (field) => `${field} noto'g'ri kiritilgan`,
  },
]

const asText = (value: unknown): string =>
  Array.isArray(value) ? value.join(", ") : String(value)

export function translateFieldError(key: string, value: unknown): string {
  const raw = asText(value)
  const field = FIELD_LABELS[key] ?? key
  const rule = MESSAGE_RULES.find((r) => r.test.test(raw))
  if (rule) return rule.text(field)
  // Tarjima qoidasi topilmasa — hech bo'lmasa maydon nomi o'zbekcha bo'lsin.
  return `${field}: ${raw}`
}

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
            message: translateFieldError(key, value),
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
      toast.error(
        arrayErrors
          .map(([key, value]) => translateFieldError(key, value))
          .join("\n"),
        {
          duration: 5000,
        },
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
