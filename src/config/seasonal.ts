export type SeasonalMonth = {
  themeKey: string
  movieGenres: number[]
  seriesGenres: number[]
  seriesExcludeGenres?: number[]
}

// Month numbers 1-12. Genre IDs from TMDB.
// Movies:  878 Sci-Fi, 10752 War, 10749 Romance, 18 Drama, 36 History, 14 Fantasy,
//          35 Comedy, 12 Adventure, 16 Animation, 28 Action, 10402 Music,
//          53 Thriller, 37 Western, 99 Documentary, 27 Horror, 80 Crime, 9648 Mystery, 10751 Family
// Series:  10765 Sci-Fi & Fantasy, 10768 War & Politics, 10759 Action & Adventure,
//          16 Animation, 35 Comedy, 80 Crime, 99 Documentary, 18 Drama,
//          10751 Family, 9648 Mystery, 37 Western, 10749 Romance
export const SEASONAL_CONFIG: Record<number, SeasonalMonth> = {
  1:  { themeKey: 'seasonal.january',   movieGenres: [878, 10752],    seriesGenres: [10765, 10768] },
  2:  { themeKey: 'seasonal.february',  movieGenres: [10749],         seriesGenres: [18],    seriesExcludeGenres: [10765, 9648, 10759, 80, 10768] },
  3:  { themeKey: 'seasonal.march',     movieGenres: [18, 36],        seriesGenres: [18] },
  4:  { themeKey: 'seasonal.april',     movieGenres: [14],            seriesGenres: [10765],  seriesExcludeGenres: [10768, 10759, 80, 99] },
  5:  { themeKey: 'seasonal.may',       movieGenres: [35],            seriesGenres: [35] },
  6:  { themeKey: 'seasonal.june',      movieGenres: [12, 16],        seriesGenres: [10759, 16] },
  7:  { themeKey: 'seasonal.july',      movieGenres: [28, 10402],     seriesGenres: [10759] },
  8:  { themeKey: 'seasonal.august',    movieGenres: [53, 37],        seriesGenres: [37] },
  9:  { themeKey: 'seasonal.september', movieGenres: [18, 99],        seriesGenres: [18, 99] },
  10: { themeKey: 'seasonal.october',   movieGenres: [27],            seriesGenres: [18] },
  11: { themeKey: 'seasonal.november',  movieGenres: [80, 9648],      seriesGenres: [80, 9648] },
  12: { themeKey: 'seasonal.december',  movieGenres: [10751],         seriesGenres: [10751] },
}
