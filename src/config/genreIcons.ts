import {
  TentTree,
  Drum,
  Smile,
  Scale,
  Camera,
  Drama,
  Sofa,
  Amphora,
  Skull,
  Baby,
  Guitar,
  HatGlasses,
  Newspaper,
  ScanEye,
  Rose,
  Rocket,
  Tv,
  Mic,
  Flashlight,
  Clapperboard,
  Swords,
  FlameKindling,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const GENRE_ICON_MAP: Record<number, LucideIcon> = {
  // Action & Adventure
  28:    TentTree,
  12:    TentTree,
  10759: TentTree,

  // Animation
  16: Drum,

  // Comedy
  35: Smile,

  // Crime
  80: Scale,

  // Documentary
  99: Camera,

  // Drama
  18: Drama,

  // Family
  10751: Sofa,

  // History
  36: Amphora,

  // Horror
  27: Skull,

  // Kids
  10762: Baby,

  // Music
  10402: Guitar,

  // Mystery
  9648: HatGlasses,

  // News
  10763: Newspaper,

  // Reality
  10764: ScanEye,

  // Romance
  10749: Rose,

  // Sci-Fi & Fantasy
  878:   Rocket,
  14:    Rocket,
  10765: Rocket,

  // Soap
  10766: Tv,

  // Talk
  10767: Mic,

  // Thriller
  53: Flashlight,

  // TV Movie
  10770: Clapperboard,

  // War & Politics
  10752: Swords,
  10768: Swords,

  // Western
  37: FlameKindling,
}

export function getGenreIcon(id: number): LucideIcon | null {
  return GENRE_ICON_MAP[id] ?? null
}

// Reverse map: genre name (EN + ES) → icon, for chart axis labels
import { GENRE_MAP } from '@/config/genres'

const NAME_TO_ICON = new Map<string, LucideIcon>()
for (const [idStr, icon] of Object.entries(GENRE_ICON_MAP)) {
  const names = GENRE_MAP[Number(idStr)]
  if (names) {
    NAME_TO_ICON.set(names.en, icon)
    NAME_TO_ICON.set(names.es, icon)
  }
}

export function getGenreIconByName(name: string): LucideIcon | null {
  return NAME_TO_ICON.get(name) ?? null
}
