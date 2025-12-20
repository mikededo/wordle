import * as v from 'valibot'

const ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ2346789'
const CODE_LENGTH = 5
const MAX_ATTEMPTS = 100

export const RoomCodeSchema = v.pipe(v.string(), v.length(5), v.toUpperCase(), v.brand('RoomCode'))
export type RoomCode = v.InferOutput<typeof RoomCodeSchema>

export const generateCode = (existingCodes: Set<string>): RoomCode => {
  const bytes = new Uint8Array(CODE_LENGTH)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    crypto.getRandomValues(bytes)

    const code = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
    const codeValidation = v.safeParse(RoomCodeSchema, code)

    if (codeValidation.success && !existingCodes.has(codeValidation.output)) {
      return codeValidation.output
    }
  }

  const bytes2 = new Uint8Array(3)
  crypto.getRandomValues(bytes2)
  const base = Array.from(bytes2, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
  const suffix = Date.now().toString(36).slice(-2).toUpperCase()
  const codeValidation = v.safeParse(RoomCodeSchema, `${base}${suffix}`)

  if (codeValidation.success) {
    return codeValidation.output
  }

  throw new Error('Failed to generate unique room code')
}

export const isValidRoomCode = (code: string): code is RoomCode => v.safeParse(RoomCodeSchema, code).success
