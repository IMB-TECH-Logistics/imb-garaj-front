/**
 * YANGI-08: pul raqamlarining kasr qismi izchil formatlansin.
 *
 * Muammo: NDS ayirilgandan keyin qiymatlarning bir qismi kasrli bo'lib qoladi
 * va ekranda xom ko'rinardi — "+3 901 710.8" (bitta kasr xona) bir qatorda,
 * "+3 000 000" (kasrsiz) qo'shnisida. Kartalarda ham xuddi shunday:
 * "Jami Naqd 4 921 710.8 so'm".
 *
 * Qoida (butun loyihada bitta):
 *   * butun qiymat  → kasrsiz            ("3 000 000")
 *   * kasrli qiymat → ANIQ 2 kasr xona   ("3 901 710.80")
 *   * minglik ajratgich — probel, kasr ajratgich — nuqta
 *     (`lib/format-money.tsx` bilan bir xil, shunda modullar orasida
 *      "3 901 710,8" / "3,901,710.8" kabi uch xil ko'rinish qolmaydi)
 */
export function formatSom(value: number | string | null | undefined): string {
    const numeric = Number(value)
    const rounded =
        Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0
    const [integerPart, fractionPart] = Math.abs(rounded).toFixed(2).split(".")
    const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const text = fractionPart === "00" ? grouped : `${grouped}.${fractionPart}`
    return rounded < 0 ? `-${text}` : text
}

/** Ishorasiz ko'rinish — ishorani chaqiruvchi o'zi qo'yadigan joylar uchun. */
export const formatSomAbs = (value: number | string | null | undefined) =>
    formatSom(Math.abs(Number(value) || 0))
