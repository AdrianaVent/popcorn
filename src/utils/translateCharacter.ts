import type { TFunction } from 'i18next'

const TERMS: Array<[RegExp, string]> = [
  [/\bself\b/gi,            'character.self'],
  [/\bvoice\b/gi,           'character.voice'],
  [/\bnarrator\b/gi,        'character.narrator'],
  [/\bguest\b/gi,           'character.guest'],
  [/\(uncredited\)/gi,      'character.uncredited'],
  [/\barchive footage\b/gi, 'character.archiveFootage'],
]

export function translateCharacter(character: string, t: TFunction): string {
  if (!character) return character
  let result = character
  for (const [pattern, key] of TERMS) {
    result = result.replace(pattern, (match) =>
      t(key, { defaultValue: match }),
    )
  }
  return result
}
