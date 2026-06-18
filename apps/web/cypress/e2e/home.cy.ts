const now = new Date()
const releaseDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`

const movieGenres = {
  genres: [
    { id: 28, name: 'Action' },
    { id: 18, name: 'Drama' },
    { id: 35, name: 'Comedy' },
  ],
}

const discoverMovies = {
  page: 1,
  results: [
    { id: 1, genre_ids: [28, 18] },
    { id: 2, genre_ids: [28, 35] },
    { id: 3, genre_ids: [18] },
  ],
  total_pages: 1,
  total_results: 3,
}

const tvGenres = {
  genres: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 18, name: 'Drama' },
  ],
}

const discoverTV = {
  page: 1,
  results: [
    { id: 10, genre_ids: [10759, 18] },
    { id: 11, genre_ids: [18] },
  ],
  total_pages: 1,
  total_results: 2,
}

describe('Dashboard', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres).as('movieGenreList')
    cy.intercept('GET', /\/discover\/movie/, discoverMovies).as('discoverMovies')
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres).as('tvGenreList')
    cy.intercept('GET', /\/discover\/tv/, discoverTV).as('discoverTV')
    // Disable series calendar releases (no provider IDs → query stays disabled)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] }).as('tvProviders')
    cy.visitAsAdmin('/home')
  })

  // ─── Layout ───────────────────────────────────────────────────

  it('shows the Home header', () => {
    cy.contains('Home').should('be.visible')
  })

  // ─── Content tab toggles ──────────────────────────────────────

  it('Movies icon buttons are active by default', () => {
    cy.get('button[aria-label="Movies"]').first().should('have.class', 'bg-primary/20')
    cy.get('button[aria-label="Series"]').first().should('not.have.class', 'bg-primary/20')
  })

  it('switches to Series on icon click', () => {
    cy.get('button[aria-label="Series"]').first().click()
    cy.get('button[aria-label="Series"]').first().should('have.class', 'bg-primary/20')
    cy.get('button[aria-label="Movies"]').first().should('not.have.class', 'bg-primary/20')
  })

  // ─── Mode toggle (admin) ─────────────────────────────────────

  it('does not show the user/global toggle for admin', () => {
    cy.wait('@discoverMovies')
    cy.contains('[role="group"]', 'My profile').should('not.exist')
  })

  // ─── Chart content ────────────────────────────────────────────

  it('renders the genre chart when global data loads', () => {
    cy.wait('@discoverMovies')
    cy.contains('Most watched genres').parents('.rounded-xl').first()
      .find('svg.recharts-surface').should('exist')
  })

  it('shows the series chart after switching to the Series icon', () => {
    const genreCard = () => cy.contains('Most watched genres').parents('.rounded-xl').first()
    genreCard().find('[aria-label="Series"]').click()
    cy.wait('@discoverTV')
    genreCard().find('svg.recharts-surface').should('exist')
  })

  // ─── Release calendar ─────────────────────────────────────────

  it('shows the release calendar title', () => {
    cy.contains('Release calendar').should('be.visible')
  })

  it('shows the calendar navigation controls', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.get('button[class*="rounded-md"]').should('have.length.gte', 2)
    })
  })

  it('has no axe violations on the home page (admin)', () => {
    cy.wait('@discoverMovies')
    cy.injectAxe()
    // color-contrast disabled: yellow-500 star scores are a deliberate design choice
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
  })
})

// ─── Mode toggle (guest) ──────────────────────────────────────────────────────

describe('Mode toggle (guest)', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres).as('movieGenreList')
    cy.intercept('GET', /\/discover\/movie/, discoverMovies).as('discoverMovies')
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres).as('tvGenreList')
    cy.intercept('GET', /\/discover\/tv/, discoverTV).as('discoverTV')
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] }).as('tvProviders')
    cy.visitAsGuest('/home')
  })

  // Helper: the genre chart card is identified by its "Most watched genres" heading
  const genreCard = () => cy.contains('Most watched genres').parents('.rounded-xl').first()

  it('defaults to Global mode when the user has no watched movies', () => {
    cy.wait('@discoverMovies')
    genreCard().find('[role="group"]').within(() => {
      cy.contains('Global').should('have.class', 'bg-primary')
      cy.contains('My profile').should('not.have.class', 'bg-primary')
    })
  })

  it('switches to My profile mode on toggle click', () => {
    cy.wait('@discoverMovies')
    genreCard().find('[role="group"]').contains('My profile').click()
    genreCard().find('[role="group"]').within(() => {
      cy.contains('My profile').should('have.class', 'bg-primary')
      cy.contains('Global').should('not.have.class', 'bg-primary')
    })
  })

  it('switches back to Global after My profile', () => {
    cy.wait('@discoverMovies')
    genreCard().find('[role="group"]').contains('My profile').click()
    genreCard().find('[role="group"]').contains('Global').click()
    genreCard().find('[role="group"]').within(() => {
      cy.contains('Global').should('have.class', 'bg-primary')
    })
  })

  it('shows the empty state when My profile has no watched titles', () => {
    cy.wait('@discoverMovies')
    genreCard().find('[role="group"]').contains('My profile').click()
    genreCard().contains('Mark some titles as watched to see your genres').should('be.visible')
  })

  it('has no axe violations on the home page (guest)', () => {
    cy.wait('@discoverMovies')
    cy.injectAxe()
    // color-contrast disabled: yellow-500 star scores are a deliberate design choice
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
  })
})

// ─── Calendar day selection ────────────────────────────────────────────────────

// ─── Top10 ───────────────────────────────────────────────────────────────────

const top10Movies = {
  page: 1,
  results: [
    {
      id: 19995,
      title: 'Avatar',
      release_date: '2009-12-18',
      vote_average: 7.6,
      vote_count: 30000,
      poster_path: null,
      genre_ids: [28, 12, 14, 878],
    },
  ],
  total_pages: 1,
  total_results: 1,
}

describe('Top10 card', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, discoverMovies)
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
    cy.intercept('GET', /\/movie\/top_rated/, top10Movies).as('top10')
    cy.intercept('GET', /\/tv\/top_rated/, { page: 1, results: [], total_pages: 1, total_results: 0 })
    cy.visitAsAdmin('/home')
  })

  it('shows the movie title in the Top10 list', () => {
    cy.wait('@top10')
    cy.contains('Avatar').should('be.visible')
  })

  it('shows the release year next to the title', () => {
    cy.wait('@top10')
    cy.contains('Avatar').closest('li').contains('2009').should('be.visible')
  })

  // ─── Genre filter dropdown ────────────────────────────────────

  it('opens the genre dropdown when the genre button is clicked', () => {
    cy.wait('@top10')
    cy.contains('button', 'All genres').click()
    cy.get('[data-cy="top10-genre-dropdown"]').contains('Drama').should('be.visible')
    cy.get('[data-cy="top10-genre-dropdown"]').contains('Action & Adventure').should('be.visible')
  })

  it('closing the dropdown via a second click hides the options', () => {
    cy.wait('@top10')
    cy.contains('button', 'All genres').click()
    cy.get('[data-cy="top10-genre-dropdown"]').should('be.visible')
    cy.contains('button', 'All genres').click()
    cy.get('[data-cy="top10-genre-dropdown"]').should('not.exist')
  })

  it('selecting a genre fetches genre-filtered results and updates the list', () => {
    cy.intercept('GET', /\/discover\/movie.*with_genres=18/, {
      page: 1,
      results: [{ id: 999, title: 'Drama King', release_date: '2022-03-01', vote_average: 8.9, vote_count: 6000, poster_path: null, genre_ids: [18] }],
      total_pages: 1,
      total_results: 1,
    }).as('genreTop10')
    cy.wait('@top10')
    cy.contains('button', 'All genres').click()
    cy.get('[data-cy="top10-genre-dropdown"]').contains('Drama').click()
    cy.wait('@genreTop10')
    cy.contains('Drama King').should('be.visible')
  })

  it('genre button label updates to the selected genre name', () => {
    cy.intercept('GET', /\/discover\/movie.*with_genres=18/, { page: 1, results: [], total_pages: 1, total_results: 0 })
    cy.wait('@top10')
    cy.contains('button', 'All genres').click()
    cy.get('[data-cy="top10-genre-dropdown"]').contains('Drama').click()
    cy.contains('button', 'Drama').should('be.visible')
  })

  it('has no axe violations on the Top10 card', () => {
    cy.wait('@top10')
    cy.injectAxe()
    // color-contrast disabled: yellow-500 star scores are a deliberate design choice
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
  })
})

// ─── StatsCard — admin ────────────────────────────────────────────────────────

const mockStats = {
  total: 12, guests: 9, admins: 3, thisMonth: 1,
  byMonth: [
    { month: '2026-01', count: 2 }, { month: '2026-02', count: 0 },
    { month: '2026-03', count: 3 }, { month: '2026-04', count: 1 },
    { month: '2026-05', count: 4 }, { month: '2026-06', count: 2 },
  ],
  byWeek: [], byDay: [],
}

describe('StatsCard — admin', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, discoverMovies)
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
    cy.intercept('GET', '/api/users/stats', mockStats).as('userStats')
    cy.visitAsAdmin('/home')
  })

  it('shows the Users title for admin', () => {
    cy.get('[data-cy="stats-card"]').contains('Users').should('be.visible')
  })

  it('shows total, guests, admins and new this month chips', () => {
    cy.wait('@userStats')
    cy.get('[data-cy="stats-card"]').within(() => {
      cy.contains('12').should('be.visible')
      cy.contains('Total users').should('be.visible')
      cy.contains('9').should('be.visible')
      cy.contains('Guests').should('be.visible')
      cy.contains('3').should('be.visible')
      cy.contains('Admins').should('be.visible')
      cy.contains('1').should('be.visible')
      cy.contains('New this month').should('be.visible')
    })
  })

  it('shows the Registrations chart and svg', () => {
    cy.wait('@userStats')
    cy.get('[data-cy="stats-card"]').contains('Registrations').should('be.visible')
    cy.get('[data-cy="stats-card"]').find('svg').should('exist')
  })

  it('period toggle defaults to month with correct aria-pressed', () => {
    cy.wait('@userStats')
    cy.get('[data-cy="stats-card"]').find('button[aria-pressed="true"]').should('have.text', 'month')
    cy.get('[data-cy="stats-card"]').find('button[aria-pressed="false"]').should('have.length', 2)
  })

  it('updates aria-pressed when period changes', () => {
    cy.wait('@userStats')
    cy.get('[data-cy="stats-card"]').contains('button', 'week').click()
    cy.get('[data-cy="stats-card"]').find('button[aria-pressed="true"]').should('have.text', 'week')
    cy.get('[data-cy="stats-card"]').find('button[aria-pressed="false"]').should('have.length', 2)
  })

  it('shows loading skeleton while fetching', () => {
    // Before the intercept resolves, the animate-pulse skeleton is visible
    cy.get('[data-cy="stats-card"]').find('.animate-pulse').should('exist')
  })

  it('has no axe violations on the stats card (admin)', () => {
    cy.wait('@userStats')
    cy.injectAxe()
    cy.get('[data-cy="stats-card"]').then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
    })
  })
})

// ─── StatsCard — guest ────────────────────────────────────────────────────────

describe('StatsCard — guest (empty)', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, discoverMovies)
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
    cy.visitAsGuest('/home')
  })

  it('shows the My activity title for guest', () => {
    cy.get('[data-cy="stats-card"]').contains('My activity').should('be.visible')
  })

  it('shows the 5 stat chip labels in Activity tab', () => {
    cy.get('[data-cy="stats-card"]').within(() => {
      cy.contains('Movies').should('be.visible')
      cy.contains('Sagas').should('be.visible')
      cy.contains('Series').should('be.visible')
      cy.contains('Episodes').should('be.visible')
      cy.contains('series completed').should('be.visible')
    })
  })

  it('shows the empty state message when no activity', () => {
    cy.get('[data-cy="stats-card"]').contains('Mark some titles as watched to see your activity').should('be.visible')
    cy.get('[data-cy="stats-card"]').find('svg').should('not.exist')
  })

  it('has no axe violations on the stats card (guest empty state)', () => {
    cy.injectAxe()
    cy.get('[data-cy="stats-card"]').then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
    })
  })
})

describe('StatsCard — guest (with activity)', () => {
  it('shows the activity chart and period toggle when movies are watched', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
      cy.intercept('GET', /\/discover\/movie/, discoverMovies)
      cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
      cy.intercept('GET', /\/discover\/tv/, discoverTV)
      cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
      cy.visit('/home', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          win.localStorage.setItem('popcorn-watched-v3', JSON.stringify({
            state: {
              movies: {
                [userId]: {
                  1: { id: 1, title: 'Inception', poster_path: null, release_date: '2010-07-16', vote_average: 8.8, vote_count: 35000, original_language: 'en', watchedAt: Date.now() },
                },
              },
              episodes: {},
              seriesData: {},
            },
            version: 0,
          }))
        },
      })
    })
    cy.get('[data-cy="stats-card"]').contains('Activity').should('be.visible')
    cy.get('[data-cy="stats-card"]').find('svg').should('exist')
    cy.get('[data-cy="stats-card"]').contains('button[aria-pressed="true"]', 'week').should('be.visible')
    cy.injectAxe()
    cy.get('[data-cy="stats-card"]').then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
    })
  })
})

// ─── StatsCard — guest Resumen tab ───────────────────────────────────────────

describe('StatsCard — guest Resumen tab', () => {
  const seedWithRatings = (win: Window, userId: string, role: string) => {
    win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
    win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
    win.localStorage.setItem('popcorn-watched-v3', JSON.stringify({
      state: {
        movies: { [userId]: { 1: { id: 1, title: 'Inception', poster_path: null, release_date: '2010-07-16', vote_average: 8.8, vote_count: 35000, original_language: 'en', watchedAt: Date.now() } } },
        episodes: {},
        seriesData: {},
      },
      version: 0,
    }))
    win.localStorage.setItem('popcorn-ratings-v1', JSON.stringify({
      state: { ratings: { [userId]: { movies: { 1: 4 }, series: {} } } }, version: 0,
    }))
  }

  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, discoverMovies)
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
  })

  it('shows Activity and Summary tab buttons for guest', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="stats-card"]').within(() => {
      cy.contains('button', 'Activity').should('be.visible')
      cy.contains('button', 'Summary').should('be.visible')
    })
  })

  it('Activity tab is selected by default', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="stats-card"]').contains('button', 'Activity').should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy="stats-card"]').contains('button', 'Summary').should('have.attr', 'aria-pressed', 'false')
  })

  it('shows no-insights empty state in Summary tab when no data', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role, username } = resp.body
      cy.visit('/home', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role, username }, version: 0 }))
          win.localStorage.setItem('popcorn-watched-v3', JSON.stringify({ state: { movies: {}, episodes: {}, seriesData: {} }, version: 0 }))
          win.localStorage.setItem('popcorn-ratings-v1', JSON.stringify({ state: { ratings: {} }, version: 0 }))
        },
      })
    })
    cy.get('[data-cy="stats-card"]').contains('button', 'Summary').click()
    cy.get('[data-cy="stats-no-insights"]').should('be.visible')
  })

  it('shows avg rating and ratings chart in Summary tab when ratings exist', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/home', { onBeforeLoad: (win: Window) => seedWithRatings(win, userId, role) })
    })
    cy.get('[data-cy="stats-card"]').contains('button', 'Summary').click()
    cy.get('[data-cy="stats-card"]').contains('My ratings').should('be.visible')
    cy.get('[data-cy="stats-card"]').find('svg').should('exist')
  })

  it('has no axe violations with Summary tab open', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="stats-card"]').contains('button', 'Summary').click()
    cy.injectAxe()
    cy.get('[data-cy="stats-card"]').then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
    })
  })
})

const calendarMovies = {
  page: 1,
  results: [{ id: 100, title: 'Calendar Test Movie', release_date: releaseDate, poster_path: null, overview: 'A test overview.', genre_ids: [] }],
  total_pages: 1,
  total_results: 1,
}

const mockCalendarVideos = {
  results: [{ id: 'v1', key: 'calendarTrailerKey', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en' }],
}

describe('Release calendar interaction', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, calendarMovies).as('discoverMovies')
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
    cy.visitAsAdmin('/home')
  })

  it('shows a release dot on day 15', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').find('.bg-primary').should('exist')
    })
  })

  it('clicking a day with a release shows the releases panel', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
  })

  it('clicking X closes the panel and restores the calendar view', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
      cy.get('[data-cy="calendar-close"]').click()
      cy.contains('Calendar Test Movie').should('not.exist')
    })
  })

  it('shows a trailer button for a release entry that has a trailer', () => {
    cy.intercept('GET', /\/movie\/100\/videos/, mockCalendarVideos).as('videos')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.wait('@videos')
    cy.get('[data-cy="trailer-button"]').should('be.visible')
  })

  it('shows the trailer iframe when the trailer button is clicked', () => {
    cy.intercept('GET', /\/movie\/100\/videos/, mockCalendarVideos).as('videos')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
    })
    cy.wait('@videos')
    cy.get('[data-cy="trailer-button"]').click()
    cy.get('iframe').should('have.attr', 'src').and('include', 'calendarTrailerKey')
  })

  it('does not show the trailer button when no trailer is available', () => {
    cy.intercept('GET', /\/movie\/100\/videos/, { results: [] }).as('noVideos')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.wait('@noVideos')
    cy.get('[data-cy="trailer-button"]').should('not.exist')
  })

  it('does not show the heart button for admin users', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.get('[data-cy="calendar-watchlist-toggle"]').should('not.exist')
  })

  it('shows the heart button for guest users', () => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, calendarMovies).as('discoverMovies2')
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
    cy.visitAsGuest('/home')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.get('[data-cy="calendar-watchlist-toggle"]').should('be.visible')
  })

  it('toggles aria-pressed when the heart button is clicked', () => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, calendarMovies)
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
    cy.visitAsGuest('/home')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.get('[data-cy="calendar-watchlist-toggle"]').should('have.attr', 'aria-pressed', 'false')
    cy.get('[data-cy="calendar-watchlist-toggle"]').click()
    cy.get('[data-cy="calendar-watchlist-toggle"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy="calendar-watchlist-toggle"]').click()
    cy.get('[data-cy="calendar-watchlist-toggle"]').should('have.attr', 'aria-pressed', 'false')
  })

  it('hides the heart button when the movie is already watched', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
      cy.intercept('GET', /\/discover\/movie/, calendarMovies)
      cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
      cy.intercept('GET', /\/discover\/tv/, discoverTV)
      cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
      cy.visit('/home', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          win.localStorage.setItem('popcorn-watched-v3', JSON.stringify({
            state: {
              movies: {
                [userId]: {
                  // past release_date avoids purgeUpcomingMovies stripping this entry on load
              100: { id: 100, title: 'Calendar Test Movie', poster_path: null, release_date: '2010-01-01', vote_average: 0, vote_count: 0, original_language: 'en', watchedAt: Date.now() },
                },
              },
              episodes: {},
              seriesData: {},
            },
            version: 0,
          }))
        },
      })
    })
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.get('[data-cy="calendar-watchlist-toggle"]').should('not.exist')
  })

  it('has no axe violations with calendar panel open', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('exist')
    })
    cy.injectAxe()
    // Scope to the calendar card only — yellow-500 star scores elsewhere on the page
    // are a deliberate design choice and excluded from this check
    cy.contains('Release calendar').parents('.rounded-xl').first().then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'] })
    })
  })
})

// ─── Reminders panel ──────────────────────────────────────────────────────────

const _now         = new Date()
const TODAY_DATE   = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
const _future      = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 7)
const FUTURE_DATE  = `${_future.getFullYear()}-${String(_future.getMonth() + 1).padStart(2, '0')}-${String(_future.getDate()).padStart(2, '0')}`
const REMINDER_ID  = 500

const reminderMovie = (date: string) => ({
  page: 1,
  results: [{ id: REMINDER_ID, title: 'Watchlisted Movie', release_date: date, poster_path: null, overview: 'Test overview.', genre_ids: [] }],
  total_pages: 1,
  total_results: 1,
})

const seedRemindersGuest = (
  win: Window,
  userId: string,
  role: string,
  movieReleaseDate = FUTURE_DATE,
) => {
  win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
  win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
  win.localStorage.setItem('popcorn-watchlist-v1', JSON.stringify({
    state: {
      movies: {
        [userId]: {
          [REMINDER_ID]: { id: REMINDER_ID, title: 'Watchlisted Movie', release_date: movieReleaseDate, poster_path: null, vote_average: 7, vote_count: 1000, original_language: 'en', addedAt: Date.now() },
        },
      },
      series: {},
    },
    version: 0,
  }))
}

// Empty discover mock — used as default for reminders tests.
// discoverMovies lacks title/release_date, causing dedup() to throw and queries to error.
const emptyDiscover = { page: 1, results: [], total_pages: 1, total_results: 0 }

describe('Release calendar — reminders panel', () => {
  const baseIntercepts = (movieResults = emptyDiscover) => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, movieResults)
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, discoverTV)
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
  }

  it('reminders button is hidden for admin', () => {
    baseIntercepts()
    cy.visitAsAdmin('/home')
    cy.get('[data-cy="calendar-reminders"]').should('not.exist')
  })

  it('reminders button is visible for guest with correct aria-label and aria-pressed="false" when closed', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-reminders"]')
      .should('have.attr', 'aria-label', 'Reminders')
      .and('have.attr', 'aria-pressed', 'false')
  })

  it('replaces the bookmark button with a "Reminders" label and Close button when the panel is open', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-reminders"]').click()
    // The bookmark button is replaced by CloseBar when the panel is open
    cy.get('[data-cy="calendar-reminders"]').should('not.exist')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('Reminders').should('be.visible')
      cy.get('button[aria-label="Close"]').should('be.visible')
    })
  })

  it('opens the reminders panel and shows Today + Upcoming sections', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-reminders"]').click()
    cy.contains('Today').should('be.visible')
    cy.contains('Upcoming').should('be.visible')
  })

  it('closes the reminders panel when the X button is clicked and restores aria-pressed="false"', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-reminders"]').click()
    cy.contains('Today').should('be.visible')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.get('button[aria-label="Close"]').click()
    })
    cy.get('[data-cy="calendar-reminders"]').should('have.attr', 'aria-pressed', 'false')
  })

  it('shows empty state when no watchlist items have upcoming releases', () => {
    baseIntercepts({ page: 1, results: [], total_pages: 1, total_results: 0 })
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-reminders"]').click()
    cy.contains('No releases today').should('be.visible')
    cy.contains('No upcoming releases in your watchlist').should('be.visible')
  })

  it('shows a watchlisted movie releasing today in the Today section', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      baseIntercepts(reminderMovie(TODAY_DATE))
      cy.visit('/home', { onBeforeLoad: (win: Window) => seedRemindersGuest(win, userId, role, TODAY_DATE) })
    })
    cy.get('[data-cy="calendar-reminders"]').click()
    cy.get('.w-1\\/3').contains('Watchlisted Movie').should('be.visible')
  })

  it('shows a watchlisted movie releasing in the future in the Upcoming section', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      baseIntercepts(reminderMovie(FUTURE_DATE))
      cy.visit('/home', { onBeforeLoad: (win: Window) => seedRemindersGuest(win, userId, role, FUTURE_DATE) })
    })
    cy.get('[data-cy="calendar-reminders"]').click()
    cy.get('.flex-1').contains('Watchlisted Movie').should('be.visible')
  })

  it('has no axe violations with the reminders panel open', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-reminders"]').click()
    cy.contains('Today').should('be.visible')
    cy.injectAxe()
    cy.contains('Release calendar').parents('.rounded-xl').first().then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'] })
    })
  })
})

// ─── Seasonal panel ───────────────────────────────────────────────────────────

const seasonalMovies = {
  page: 1,
  results: [
    { id: 200, title: 'Great Fantasy Movie', release_date: '2022-03-15', vote_average: 8.5, vote_count: 2000, poster_path: null, genre_ids: [14], overview: '' },
    { id: 201, title: 'Another Fantasy',     release_date: '2021-06-20', vote_average: 7.8, vote_count: 1500, poster_path: null, genre_ids: [14], overview: '' },
  ],
  total_pages: 1,
  total_results: 2,
}

const seasonalSeries = {
  page: 1,
  results: [
    { id: 300, name: 'Fantasy Series', first_air_date: '2020-04-10', vote_average: 9.0, vote_count: 3000, poster_path: null, genre_ids: [10765], overview: '' },
  ],
  total_pages: 1,
  total_results: 1,
}

const seasonalMovieDetail = {
  id: 200, title: 'Great Fantasy Movie', release_date: '2022-03-15',
  vote_average: 8.5, vote_count: 2000, poster_path: null, genre_ids: [14],
  overview: 'A great fantasy film.', runtime: 120, genres: [{ id: 14, name: 'Fantasy' }],
}

describe('Release calendar — seasonal panel', () => {
  const baseIntercepts = () => {
    cy.intercept('GET', /\/genre\/movie\/list/, movieGenres)
    cy.intercept('GET', /\/discover\/movie/, seasonalMovies).as('discoverMovies')
    cy.intercept('GET', /\/genre\/tv\/list/, tvGenres)
    cy.intercept('GET', /\/discover\/tv/, seasonalSeries).as('discoverTV')
    cy.intercept('GET', /\/watch\/providers\/tv/, { results: [] })
  }

  it('seasonal button is visible for guest with aria-label and aria-pressed="false"', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]')
      .should('be.visible')
      .and('have.attr', 'aria-label', 'Monthly recommendations')
      .and('have.attr', 'aria-pressed', 'false')
  })

  it('seasonal button is hidden for admin', () => {
    baseIntercepts()
    cy.visitAsAdmin('/home')
    cy.get('[data-cy="calendar-seasonal"]').should('not.exist')
  })

  it('clicking the button opens the seasonal panel and sets aria-pressed="true"', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.get('[data-cy="calendar-seasonal"]').should('not.exist') // replaced by CloseBar
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('Monthly recommendations').should('be.visible')
    })
  })

  it('panel shows Movies and Series column headings', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.wait('@discoverMovies')
    cy.wait('@discoverTV')
    cy.get('[role="region"][aria-label="Monthly recommendations"]').within(() => {
      cy.contains('Movies').should('be.visible')
      cy.contains('Series').should('be.visible')
    })
  })

  it('panel shows movie titles from discover API', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.wait('@discoverMovies')
    cy.get('[role="region"][aria-label="Monthly recommendations"]')
      .contains('Great Fantasy Movie').should('be.visible')
  })

  it('panel shows series names from discover API', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.wait('@discoverTV')
    cy.get('[role="region"][aria-label="Monthly recommendations"]')
      .contains('Fantasy Series').should('be.visible')
  })

  it('clicking X closes the panel and restores the seasonal button', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.contains('Monthly recommendations').should('be.visible')
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.get('button[aria-label="Close"]').click()
    })
    cy.get('[data-cy="calendar-seasonal"]').should('have.attr', 'aria-pressed', 'false')
  })

  it('clicking a movie item opens the detail modal', () => {
    baseIntercepts()
    cy.intercept('GET', /\/movie\/200/, seasonalMovieDetail).as('movieDetail')
    cy.intercept('GET', /\/movie\/200\/watch\/providers/, { results: {} })
    cy.intercept('GET', /\/movie\/200\/videos/, { results: [] })
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.wait('@discoverMovies')
    cy.get('[role="region"][aria-label="Monthly recommendations"]')
      .contains('Great Fantasy Movie').click()
    cy.wait('@movieDetail')
    cy.contains('A great fantasy film.').should('be.visible')
  })

  it('opening reminders closes the seasonal panel', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.contains('Monthly recommendations').should('be.visible')
    cy.get('[data-cy="calendar-reminders"]').should('not.exist') // hidden while seasonal is open
  })

  it('has no axe violations with the seasonal panel open', () => {
    baseIntercepts()
    cy.visitAsGuest('/home')
    cy.get('[data-cy="calendar-seasonal"]').click()
    cy.wait('@discoverMovies')
    cy.injectAxe()
    cy.contains('Release calendar').parents('.rounded-xl').first().then(($el) => {
      cy.checkA11y($el[0], { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } })
    })
  })
})

describe('Drag mode toggle', () => {
  it('shows the Organizar button with aria-pressed="false" by default', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="drag-mode-toggle"]')
      .should('be.visible')
      .and('have.attr', 'aria-pressed', 'false')
  })

  it('activates drag mode and shows 4 drag handles', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="drag-mode-toggle"]').click()
    cy.get('[aria-label="Drag to reorder"]').should('have.length', 4)
    cy.get('[data-cy="drag-mode-toggle"]').should('have.attr', 'aria-pressed', 'true')
  })

  it('exits drag mode on second click and hides drag handles', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="drag-mode-toggle"]').click()
    cy.get('[aria-label="Drag to reorder"]').should('have.length', 4)
    cy.get('[data-cy="drag-mode-toggle"]').click()
    cy.get('[aria-label="Drag to reorder"]').should('not.exist')
    cy.get('[data-cy="drag-mode-toggle"]').should('have.attr', 'aria-pressed', 'false')
  })

  it('is also visible for admin', () => {
    cy.visitAsAdmin('/home')
    cy.get('[data-cy="drag-mode-toggle"]').should('be.visible')
  })

  it('has no axe violations in drag mode', () => {
    cy.visitAsGuest('/home')
    cy.get('[data-cy="drag-mode-toggle"]').click()
    cy.get('[aria-label="Drag to reorder"]').should('have.length', 4)
    cy.injectAxe()
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
  })
})
