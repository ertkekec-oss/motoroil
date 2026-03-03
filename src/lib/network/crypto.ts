import crypto from "crypto"

export function sha256Base64(input: string) {
    return crypto.createHash("sha256").update(input).digest("base64")
}

export function randomNumericCode(len = 6) {
    const min = 10 ** (len - 1)
    const max = 10 ** len - 1
    return String(crypto.randomInt(min, max + 1))
}

export function randomToken() {
    return crypto.randomBytes(32).toString("base64url")
}
