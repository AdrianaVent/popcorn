import type { TFunction } from 'i18next'
import { translateCharacter, translateJob } from './translateCharacter'

const t: TFunction = ((key: string, opts?: { defaultValue?: string }) =>
  opts?.defaultValue ?? key) as TFunction

const tTranslate: TFunction = ((key: string, opts?: { defaultValue?: string }) => {
  const map: Record<string, string> = {
    'character.self':         'Él/Ella mismo/a',
    'character.voice':        'Voz',
    'character.narrator':     'Narrador',
    'character.guest':        'Invitado',
    'character.uncredited':   '(sin acreditar)',
    'character.archiveFootage': 'Material de archivo',
    'job.director':           'Director',
    'job.producer':           'Productor',
    'job.executiveProducer':  'Productor ejecutivo',
    'job.coProducer':         'Coproductor',
    'job.screenplay':         'Guión',
    'job.writer':             'Guionista',
    'job.story':              'Historia original',
    'job.dop':                'Director de fotografía',
    'job.composer':           'Música original',
    'job.editor':             'Montador',
    'job.casting':            'Casting',
    'job.productionDesign':   'Director de arte',
    'job.costumeDesign':      'Diseño de vestuario',
    'job.vfxSupervisor':      'Supervisor de efectos visuales',
    'job.stuntCoordinator':   'Coordinador de especialistas',
    'job.actorsAssistant':    'Asistente del actor',
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

  it('translates "himself" and "herself" to the same as self', () => {
    expect(translateCharacter('Himself', tTranslate)).toBe('Él/Ella mismo/a')
    expect(translateCharacter('Herself', tTranslate)).toBe('Él/Ella mismo/a')
    expect(translateCharacter('Themselves', tTranslate)).toBe('Él/Ella mismo/a')
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

describe('translateJob', () => {
  it('returns empty string unchanged', () => {
    expect(translateJob('', t)).toBe('')
  })

  it('returns unknown job unchanged', () => {
    expect(translateJob('Location Manager', tTranslate)).toBe('Location Manager')
  })

  it('translates "Director"', () => {
    expect(translateJob('Director', tTranslate)).toBe('Director')
  })

  it('translates "Executive Producer" before "Producer"', () => {
    expect(translateJob('Executive Producer', tTranslate)).toBe('Productor ejecutivo')
    expect(translateJob('Producer', tTranslate)).toBe('Productor')
  })

  it('translates "Director of Photography" before "Director"', () => {
    expect(translateJob('Director of Photography', tTranslate)).toBe('Director de fotografía')
  })

  it('translates "Screenplay"', () => {
    expect(translateJob('Screenplay', tTranslate)).toBe('Guión')
  })

  it('translates "Original Music Composer"', () => {
    expect(translateJob('Original Music Composer', tTranslate)).toBe('Música original')
  })

  it('translates "Production Design" and "Production Designer"', () => {
    expect(translateJob('Production Design', tTranslate)).toBe('Director de arte')
    expect(translateJob('Production Designer', tTranslate)).toBe('Director de arte')
  })

  it('translates "Actor\'s Assistant" case-insensitively', () => {
    expect(translateJob('Actor\'s Assistant', tTranslate)).toBe('Asistente del actor')
    expect(translateJob('actor\'s assistant', tTranslate)).toBe('Asistente del actor')
  })

  it('does not translate "Director" as a partial match inside longer strings', () => {
    expect(translateJob('Art Director', tTranslate)).toBe('Art Director')
  })
})
