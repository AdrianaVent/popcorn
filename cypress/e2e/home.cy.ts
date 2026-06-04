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
    cy.get('[role="group"]').should('not.exist')
  })

  // ─── Chart content ────────────────────────────────────────────

  it('renders the genre chart when global data loads', () => {
    cy.wait('@discoverMovies')
    cy.get('svg').should('exist')
  })

  it('shows the series chart after switching to the Series icon', () => {
    cy.get('[aria-label="Series"]').first().click()
    cy.wait('@discoverTV')
    cy.get('svg').should('exist')
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

  it('defaults to Global mode when the user has no watched movies', () => {
    cy.wait('@discoverMovies')
    // Two [role="group"] toggles exist for guests (Top10 + genres chart); target genres chart (last)
    cy.get('[role="group"]').last().within(() => {
      cy.contains('Global').should('have.class', 'bg-primary')
      cy.contains('My profile').should('not.have.class', 'bg-primary')
    })
  })

  it('switches to My profile mode on toggle click', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').last().contains('My profile').click()
    cy.get('[role="group"]').last().within(() => {
      cy.contains('My profile').should('have.class', 'bg-primary')
      cy.contains('Global').should('not.have.class', 'bg-primary')
    })
  })

  it('switches back to Global after My profile', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').last().contains('My profile').click()
    cy.get('[role="group"]').last().contains('Global').click()
    cy.get('[role="group"]').last().within(() => {
      cy.contains('Global').should('have.class', 'bg-primary')
    })
  })

  it('shows the empty state when My profile has no watched titles', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').last().contains('My profile').click()
    cy.contains('Mark some titles as watched to see your genres').should('be.visible')
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
})
