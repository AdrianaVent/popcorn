import type { TFunction } from 'i18next'
import { translateCharacter } from './translateCharacter'

const t: TFunction = ((key: string, opts?: { defaultValue?: string }) =>
  opts?.defaultValue ?? key) as TFunction

const tTranslate: TFunction = ((key: string, opts?: { defaultValue?: string }) => {
  const map: Record<string, string> = {
    'character.self': 'Él/Ella mismo/a',
    'character.voice': 'Voz',
    'character.narrator': 'Narrador',
    'character.guest': 'Invitado',
    'character.uncredited': '(sin acreditar)',
    'character.archiveFootage': 'Material de archivo',
  }
  return map[key] ?? opts?.defaultValue ?? key
}) as TFunction

describe('translateCharacter', () => {
  it('returns empty string unchanged', () => {
    expect(translateCharacter('', t)).toBe('')
  })

  it('returns string with no known terms unchanged', () => {
    expect(translateCharacter('John Wick', t)).toBe('John Wick')
  })

  it('translates "self" case-insensitively', () => {
    expect(translateCharacter('Self', tTranslate)).toBe('Él/Ella mismo/a')
    expect(translateCharacter('self', tTranslate)).toBe('Él/Ella mismo/a')
    expect(translateCharacter('SELF', tTranslate)).toBe('Él/Ella mismo/a')
  })

  it('does not translate "self" as a substring of another word', () => {
    expect(translateCharacter('herself', tTranslate)).toBe('herself')
    expect(translateCharacter('himself', tTranslate)).toBe('himself')
  })

  it('translates "voice"', () => {
    expect(translateCharacter('Voice', tTranslate)).toBe('Voz')
  })

  it('translates "narrator"', () => {
    expect(translateCharacter('Narrator', tTranslate)).toBe('Narrador')
  })

  it('translates "guest"', () => {
    expect(translateCharacter('Guest', tTranslate)).toBe('Invitado')
  })

  it('translates "(uncredited)"', () => {
    expect(translateCharacter('(uncredited)', tTranslate)).toBe('(sin acreditar)')
  })

  it('translates "archive footage"', () => {
    expect(translateCharacter('Archive footage', tTranslate)).toBe('Material de archivo')
  })

  it('translates partial match: "Self - Guest"', () => {
    expect(translateCharacter('Self - Guest', tTranslate)).toBe('Él/Ella mismo/a - Invitado')
  })

  it('falls back to original match when key has no translation', () => {
    expect(translateCharacter('Self', t)).toBe('Self')
  })
})
