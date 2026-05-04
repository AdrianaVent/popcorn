describe('Series', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb')
    cy.visitAsAdmin('/series')
  })

  it('displays the series list', () => {
    cy.wait('@tmdb')
    cy.contains('Breaking Bad').should('be.visible')
    cy.contains('Game of Thrones').should('be.visible')
  })

  it('shows a series detail modal on row click', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/tv/1396*', {
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      vote_average: 9.5,
      vote_count: 12000,
      overview: 'A chemistry teacher turns to manufacturing meth.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      number_of_seasons: 5,
      number_of_episodes: 62,
      episode_run_time: [47],
      status: 'Ended',
      seasons: [],
    }).as('detail')

    cy.wait('@tmdb')
    cy.contains('tr', 'Breaking Bad').click()
    cy.wait('@detail')
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"]').contains('Breaking Bad')
  })
})
