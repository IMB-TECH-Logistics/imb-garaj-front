#!/usr/bin/env node
/**
 * Ruxsat kodlari qo'riqchisi.
 *
 * Menyudagi `allowKey` va koddagi `useHasAction("...")` kalitlari backend
 * katalogida bormi — shuni tekshiradi. Katalog nusxasi:
 * src/constants/permission-codes.json
 *
 * Yangilash (garage-back ichida):
 *   python manage.py permission_codes > .../src/constants/permission-codes.json
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, extname } from "node:path"

const SRC = "src"
const CATALOG = "src/constants/permission-codes.json"

const known = new Set(JSON.parse(readFileSync(CATALOG, "utf8")))

const files = []
const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if ([".ts", ".tsx"].includes(extname(full))) files.push(full)
    }
}
walk(SRC)

const used = new Map()
const add = (code, file) => {
    if (!used.has(code)) used.set(code, new Set())
    used.get(code).add(file)
}

for (const file of files) {
    const text = readFileSync(file, "utf8")
    for (const m of text.matchAll(/allowKey:\s*"([^"]+)"/g)) add(m[1], file)
    for (const m of text.matchAll(/useHasAction\(\s*"([^"]+)"/g)) add(m[1], file)
    for (const m of text.matchAll(/useHasAction\(\s*\[([^\]]+)\]/g)) {
        for (const q of m[1].matchAll(/"([^"]+)"/g)) add(q[1], file)
    }
}

const unknown = [...used.entries()].filter(([code]) => !known.has(code))

if (unknown.length) {
    console.error("\nBackend katalogida YO'Q ruxsat kodlari:\n")
    for (const [code, where] of unknown) {
        console.error(`  ${code}`)
        for (const file of where) console.error(`      ${file}`)
    }
    console.error(
        `\nKatalog: ${CATALOG} (${known.size} kod).` +
            "\nYo kodni to'g'rilang, yo backend katalogiga qo'shib faylni yangilang.\n",
    )
    process.exit(1)
}

const unused = [...known].filter((code) => !used.has(code))
console.log(
    `Ruxsat kodlari joyida: ${used.size} ta ishlatilgan / ${known.size} ta katalogda.`,
)
if (unused.length) {
    console.log(`UI'da ishlatilmagan ${unused.length} ta kod: ${unused.join(", ")}`)
}
