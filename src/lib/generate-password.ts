const LOWER = "abcdefghijkmnpqrstuvwxyz"
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGITS = "23456789"
const SYMBOLS = "!@#$%*-_+="
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

const randomIndex = (max: number) => {
    const limit = Math.floor(0x100000000 / max) * max
    const buffer = new Uint32Array(1)
    do {
        crypto.getRandomValues(buffer)
    } while (buffer[0] >= limit)
    return buffer[0] % max
}

const pick = (chars: string) => chars[randomIndex(chars.length)]

export const generatePassword = (length = 16) => {
    const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
    while (chars.length < length) chars.push(pick(ALL))
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join("")
}
