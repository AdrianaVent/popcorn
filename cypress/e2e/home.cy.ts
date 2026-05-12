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

  // ─── Content tabs ─────────────────────────────────────────────

  it('has Movies tab active by default', () => {
    cy.contains('button', 'Movies').should('have.class', 'bg-card')
    cy.contains('button', 'Series').should('not.have.class', 'bg-card')
  })

  it('switches to Series tab on click', () => {
    cy.contains('button', 'Series').click()
    cy.contains('button', 'Series').should('have.class', 'bg-card')
    cy.contains('button', 'Movies').should('not.have.class', 'bg-card')
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

  it('shows the series chart after switching to the Series tab', () => {
    cy.contains('button', 'Series').click()
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
    cy.get('[role="group"]').within(() => {
      cy.contains('Global').should('have.class', 'bg-primary')
      cy.contains('My profile').should('not.have.class', 'bg-primary')
    })
  })

  it('switches to My profile mode on toggle click', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').contains('My profile').click()
    cy.get('[role="group"]').within(() => {
      cy.contains('My profile').should('have.class', 'bg-primary')
      cy.contains('Global').should('not.have.class', 'bg-primary')
    })
  })

  it('switches back to Global after My profile', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').contains('My profile').click()
    cy.get('[role="group"]').contains('Global').click()
    cy.get('[role="group"]').within(() => {
      cy.contains('Global').should('have.class', 'bg-primary')
    })
  })

  it('shows the empty state when My profile has no watched titles', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').contains('My profile').click()
    cy.contains('Mark some titles as watched to see your genres').should('be.visible')
  })
})

// ─── Calendar day selection ────────────────────────────────────────────────────

const calendarMovies = {
  page: 1,
  results: [{ id: 100, title: 'Calendar Test Movie', release_date: releaseDate, poster_path: null, overview: 'A test overview.', genre_ids: [] }],
  total_pages: 1,
  total_results: 1,
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
      cy.contains('Calendar Test Movie').should('be.visible')
    })
  })

  it('clicking X closes the panel and restores the calendar view', () => {
    cy.contains('Release calendar').parents('.rounded-xl').within(() => {
      cy.contains('button', '15').click()
      cy.contains('Calendar Test Movie').should('be.visible')
      // X button is the only button in the header when the panel is open
      cy.contains('Release calendar').parent().find('button').click()
      cy.contains('Calendar Test Movie').should('not.exist')
    })
  })
})
