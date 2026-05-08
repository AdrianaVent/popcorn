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

  // ─── Mode toggle ─────────────────────────────────────────────

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

  // ─── Chart content ────────────────────────────────────────────

  it('renders the genre chart when global data loads', () => {
    cy.wait('@discoverMovies')
    cy.get('svg').should('exist')
  })

  it('shows the empty state when My profile has no watched titles', () => {
    cy.wait('@discoverMovies')
    cy.get('[role="group"]').contains('My profile').click()
    cy.contains('Mark some titles as watched to see your genres').should('be.visible')
  })

  it('shows the series chart after switching to the Series tab', () => {
    cy.contains('button', 'Series').click()
    cy.wait('@discoverTV')
    cy.get('svg').should('exist')
  })
})
