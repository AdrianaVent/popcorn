import {
  DEFAULT_AVATAR,
  parseAvatar,
  serializeAvatar,
  buildAvatarUrl,
  type AvatarOptions,
} from './avatars'

describe('parseAvatar', () => {
  it('returns DEFAULT_AVATAR for null', () => {
    expect(parseAvatar(null)).toEqual(DEFAULT_AVATAR)
  })

  it('returns DEFAULT_AVATAR for undefined', () => {
    expect(parseAvatar(undefined)).toEqual(DEFAULT_AVATAR)
  })

  it('returns DEFAULT_AVATAR for empty string', () => {
    expect(parseAvatar('')).toEqual(DEFAULT_AVATAR)
  })

  it('returns DEFAULT_AVATAR for malformed JSON', () => {
    expect(parseAvatar('not-json')).toEqual(DEFAULT_AVATAR)
  })

  it('merges partial options over DEFAULT_AVATAR', () => {
    const result = parseAvatar(JSON.stringify({ hair: 'fonze', skinColor: 'ae5d29' }))
    expect(result.hair).toBe('fonze')
    expect(result.skinColor).toBe('ae5d29')
    expect(result.hairColor).toBe(DEFAULT_AVATAR.hairColor)
  })

  it('converts legacy glasses: true to "round"', () => {
    expect(parseAvatar(JSON.stringify({ glasses: true }))).toMatchObject({ glasses: 'round' })
  })

  it('converts legacy glasses: "true" to "round"', () => {
    expect(parseAvatar(JSON.stringify({ glasses: 'true' }))).toMatchObject({ glasses: 'round' })
  })

  it('preserves glasses: "square"', () => {
    expect(parseAvatar(JSON.stringify({ glasses: 'square' }))).toMatchObject({ glasses: 'square' })
  })

  it('preserves glasses: null', () => {
    expect(parseAvatar(JSON.stringify({ glasses: null }))).toMatchObject({ glasses: null })
  })

  it('converts glasses: false to null', () => {
    expect(parseAvatar(JSON.stringify({ glasses: false }))).toMatchObject({ glasses: null })
  })

  it('preserves a valid mouth value', () => {
    expect(parseAvatar(JSON.stringify({ mouth: 'laughing' }))).toMatchObject({ mouth: 'laughing' })
  })

  it('falls back to default mouth for unknown mouth value', () => {
    expect(parseAvatar(JSON.stringify({ mouth: 'wink' }))).toMatchObject({ mouth: DEFAULT_AVATAR.mouth })
  })

  it('falls back to default mouth when mouth is missing (legacy avatar)', () => {
    const legacy = JSON.stringify({ hair: 'fonze', skinColor: 'ae5d29' })
    expect(parseAvatar(legacy)).toMatchObject({ mouth: DEFAULT_AVATAR.mouth })
  })

  it('preserves a valid glassesColor value', () => {
    expect(parseAvatar(JSON.stringify({ glassesColor: '3b82f6' }))).toMatchObject({ glassesColor: '3b82f6' })
  })

  it('falls back to default glassesColor for a removed color (e.g. green)', () => {
    expect(parseAvatar(JSON.stringify({ glassesColor: '22c55e' }))).toMatchObject({ glassesColor: DEFAULT_AVATAR.glassesColor })
  })

  it('falls back to default glassesColor when missing', () => {
    expect(parseAvatar(JSON.stringify({ hair: 'fonze' }))).toMatchObject({ glassesColor: DEFAULT_AVATAR.glassesColor })
  })
})

describe('serializeAvatar', () => {
  it('round-trips through parseAvatar', () => {
    const opts: AvatarOptions = {
      hair: 'mrT',
      hairColor: 'ec4899',
      skinColor: 'd08b5b',
      shirtColor: 'ef4444',
      glasses: 'round',
      glassesColor: '3b82f6',
      mouth: 'laughing',
    }
    expect(parseAvatar(serializeAvatar(opts))).toEqual(opts)
  })
})

describe('buildAvatarUrl', () => {
  it('includes seed in url', () => {
    const url = buildAvatarUrl(DEFAULT_AVATAR, 'testuser')
    expect(url).toContain('seed=testuser')
  })

  it('includes hair and colors', () => {
    const url = buildAvatarUrl(DEFAULT_AVATAR, 'u')
    expect(url).toContain(`hair[]=${DEFAULT_AVATAR.hair}`)
    expect(url).toContain(`hairColor[]=${DEFAULT_AVATAR.hairColor}`)
    expect(url).toContain(`baseColor[]=${DEFAULT_AVATAR.skinColor}`)
    expect(url).toContain(`shirtColor[]=${DEFAULT_AVATAR.shirtColor}`)
  })

  it('includes mouth in url', () => {
    const url = buildAvatarUrl(DEFAULT_AVATAR, 'u')
    expect(url).toContain(`mouth[]=${DEFAULT_AVATAR.mouth}`)
  })

  it('reflects changed mouth value', () => {
    const url = buildAvatarUrl({ ...DEFAULT_AVATAR, mouth: 'surprised' }, 'u')
    expect(url).toContain('mouth[]=surprised')
  })

  it('sets glassesProbability=0 when no glasses', () => {
    const url = buildAvatarUrl({ ...DEFAULT_AVATAR, glasses: null }, 'u')
    expect(url).toContain('glassesProbability=0')
    expect(url).not.toContain('glasses[]=')
  })

  it('sets glassesProbability=100 and includes glasses style and color when glasses selected', () => {
    const url = buildAvatarUrl({ ...DEFAULT_AVATAR, glasses: 'round', glassesColor: '3b82f6' }, 'u')
    expect(url).toContain('glassesProbability=100')
    expect(url).toContain('glasses[]=round')
    expect(url).toContain('glassesColor[]=3b82f6')
  })

  it('encodes seed with special characters', () => {
    const url = buildAvatarUrl(DEFAULT_AVATAR, 'user name')
    expect(url).toContain('seed=user%20name')
  })
})
