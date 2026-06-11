export type AvatarHair    = 'pixie' | 'dannyPhantom' | 'fonze' | 'full' | 'mrT' | 'dougFunny'
export type AvatarGlasses = 'round' | 'square'

export type AvatarOptions = {
  hair: AvatarHair
  hairColor: string
  skinColor: string
  shirtColor: string
  glasses: AvatarGlasses | null
  glassesColor: string
}

export const DEFAULT_AVATAR: AvatarOptions = {
  hair: 'pixie',
  hairColor: '77311d',
  skinColor: 'edb98a',
  shirtColor: '3b82f6',
  glasses: null,
  glassesColor: '111827',
}

export const SKIN_COLORS: { value: string; labelKey: string }[] = [
  { value: 'f9c9b6', labelKey: 'profile.avatar.skin.light' },
  { value: 'edb98a', labelKey: 'profile.avatar.skin.warm' },
  { value: 'd08b5b', labelKey: 'profile.avatar.skin.tan' },
  { value: 'c68642', labelKey: 'profile.avatar.skin.medium' },
  { value: 'ae5d29', labelKey: 'profile.avatar.skin.brown' },
  { value: '6f4e37', labelKey: 'profile.avatar.skin.richBrown' },
  { value: '614335', labelKey: 'profile.avatar.skin.dark' },
  { value: '3b2a1f', labelKey: 'profile.avatar.skin.deepDark' },
]

export const HAIR_COLORS: { value: string; labelKey: string }[] = [
  { value: '0e0e0e', labelKey: 'profile.avatar.hairColor.black' },
  { value: '77311d', labelKey: 'profile.avatar.hairColor.brown' },
  { value: 'b57a4b', labelKey: 'profile.avatar.hairColor.chestnut' },
  { value: 'f4d150', labelKey: 'profile.avatar.hairColor.blonde' },
  { value: 'c64b3e', labelKey: 'profile.avatar.hairColor.red' },
  { value: 'a8aab4', labelKey: 'profile.avatar.hairColor.silver' },
  { value: '5b8ef0', labelKey: 'profile.avatar.hairColor.blue' },
  { value: 'ec4899', labelKey: 'profile.avatar.hairColor.pink' },
]

export const SHIRT_COLORS: { value: string; labelKey: string }[] = [
  { value: '000000', labelKey: 'profile.avatar.shirt.black' },
  { value: 'ffffff', labelKey: 'profile.avatar.shirt.white' },
  { value: '3b82f6', labelKey: 'profile.avatar.shirt.blue' },
  { value: 'ef4444', labelKey: 'profile.avatar.shirt.red' },
  { value: '22c55e', labelKey: 'profile.avatar.shirt.green' },
  { value: 'facc15', labelKey: 'profile.avatar.shirt.yellow' },
  { value: 'a855f7', labelKey: 'profile.avatar.shirt.purple' },
  { value: 'ec4899', labelKey: 'profile.avatar.shirt.pink' },
]

export const HAIR_STYLES: { value: AvatarHair; labelKey: string }[] = [
  { value: 'pixie',        labelKey: 'profile.avatar.hair.short' },
  { value: 'full',         labelKey: 'profile.avatar.hair.long' },
  { value: 'dannyPhantom', labelKey: 'profile.avatar.hair.messy' },
  { value: 'fonze',        labelKey: 'profile.avatar.hair.slick' },
  { value: 'mrT',          labelKey: 'profile.avatar.hair.mohawk' },
  { value: 'dougFunny',    labelKey: 'profile.avatar.hair.bald' },
]

export const GLASSES_STYLES: { value: AvatarGlasses | null; labelKey: string }[] = [
  { value: null,    labelKey: 'profile.avatar.glasses.none' },
  { value: 'round', labelKey: 'profile.avatar.glasses.round' },
  { value: 'square', labelKey: 'profile.avatar.glasses.square' },
]

export const GLASSES_COLORS: { value: string; labelKey: string }[] = [
  { value: '111827', labelKey: 'profile.avatar.glassesColor.black' },
  { value: '92400e', labelKey: 'profile.avatar.glassesColor.brown' },
  { value: 'a8aab4', labelKey: 'profile.avatar.glassesColor.silver' },
  { value: '3b82f6', labelKey: 'profile.avatar.glassesColor.blue' },
  { value: '22c55e', labelKey: 'profile.avatar.glassesColor.green' },
  { value: 'a855f7', labelKey: 'profile.avatar.glassesColor.purple' },
  { value: 'ec4899', labelKey: 'profile.avatar.glassesColor.pink' },
  { value: 'ef4444', labelKey: 'profile.avatar.glassesColor.red' },
]

export function buildAvatarUrl(opts: AvatarOptions, seed: string): string {
  const parts = [
    `seed=${encodeURIComponent(seed)}`,
    `hair[]=${opts.hair}`,
    `hairColor[]=${opts.hairColor}`,
    `baseColor[]=${opts.skinColor}`,
    `shirtColor[]=${opts.shirtColor}`,
    `glassesProbability=${opts.glasses ? '100' : '0'}`,
  ]
  if (opts.glasses) {
    parts.push(`glasses[]=${opts.glasses}`)
    parts.push(`glassesColor[]=${opts.glassesColor}`)
  }
  return `https://api.dicebear.com/9.x/micah/svg?${parts.join('&')}`
}

export function parseAvatar(raw: string | null | undefined): AvatarOptions {
  try {
    if (!raw) return DEFAULT_AVATAR
    const parsed = JSON.parse(raw) as Partial<AvatarOptions>
    const rawGlasses = (parsed as Record<string, unknown>).glasses
    let glasses: AvatarGlasses | null = null
    if (rawGlasses === true || rawGlasses === 'true') glasses = 'round'
    else if (rawGlasses && typeof rawGlasses === 'string') glasses = rawGlasses as AvatarGlasses
    return { ...DEFAULT_AVATAR, ...parsed, glasses }
  } catch {
    return DEFAULT_AVATAR
  }
}

export function serializeAvatar(opts: AvatarOptions): string {
  return JSON.stringify(opts)
}
