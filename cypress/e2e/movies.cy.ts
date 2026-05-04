describe('Movies', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb')
    cy.visitAsAdmin('/movies')
  })

  it('displays the movies list', () => {
    cy.wait('@tmdb')
    cy.contains('Fight Club').should('be.visible')
    cy.contains('The Shawshank Redemption').should('be.visible')
  })

  it('shows a movie detail modal on row click', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/movie/550*', {
      id: 550,
      title: 'Fight Club',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 26000,
      runtime: 139,
      overview: 'A depressed man forms an underground fight club.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      belongs_to_collection: null,
    }).as('detail')

    cy.wait('@tmdb')
    cy.contains('tr', 'Fight Club').click()
    cy.wait('@detail')
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"]').contains('Fight Club')
  })

  // ─── Access control ───────────────────────────────────────────

  it('does not show the Export button for guest users', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
    cy.visitAsGuest('/movies')
    cy.wait('@tmdb-guest')
    cy.contains('Export').should('not.exist')
  })
})
