import { describe, expect, test } from 'bun:test'

import { generateCode } from '$lib/room/code'

describe('generateCode', () => {
  test('generates a 5-character code', () => {
    const code = generateCode(new Set())
    expect(code).toHaveLength(5)
  })

  test('generates uppercase alphanumeric codes', () => {
    const code = generateCode(new Set())
    expect(code).toMatch(/^[A-Z0-9]+$/)
  })

  test('excludes ambiguous characters (O, 0, I, 1, L, S, 5)', () => {
    const ambiguous = /[O0I1LS5]/
    for (let i = 0; i < 100; i++) {
      const code = generateCode(new Set())
      expect(code).not.toMatch(ambiguous)
    }
  })

  test('avoids existing codes', () => {
    const existing = new Set(['ABCDE', 'FGHJK', 'MNPQR'])
    const code = generateCode(existing)
    expect(existing.has(code)).toBe(false)
  })
})

