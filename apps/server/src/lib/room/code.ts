const ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ2346789'
const CODE_LENGTH = 5
const MAX_ATTEMPTS = 100

export const generateCode = (existingCodes: Set<string>): string => {
  const bytes = new Uint8Array(CODE_LENGTH)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    crypto.getRandomValues(bytes)

    const code = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')

    if (!existingCodes.has(code)) {
      return code
    }
  }

  const bytes2 = new Uint8Array(3)
  crypto.getRandomValues(bytes2)
  const base = Array.from(bytes2, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
  const suffix = Date.now().toString(36).slice(-2).toUpperCase()

  return `${base}${suffix}`
}

