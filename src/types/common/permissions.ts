import codes from "@/constants/permission-codes.json"

/**
 * Backend katalogidan olingan kodlar. Ro‘yxat qo‘lda yozilmaydi:
 *   python manage.py permission_codes > src/constants/permission-codes.json
 * `pnpm run check:permissions` esa UI‘dagi kalitlar shu ro‘yxatda borligini
 * tekshiradi.
 */
type TPermissions = (typeof codes)[number]

export type { TPermissions }
